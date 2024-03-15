import jwt  from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteonCloudinary, uploadOnCloudinary } from "../utils/Cloudinary.uploader.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userid) => {
    try {
        const user = await User.findById(userid);
        const accessToken = await user.genrateAccessToken();
        const refreshToken = await user.genrateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({
            validateBeforeSave: false
        })
        return {
            accessToken,
            refreshToken
        };


    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }


}



const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body
    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")

    }
    if (email && !email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
        throw new ApiError(400, "Invalid email")
    }

    const existedUser = await User.findOne({
        $or: [
            { email },
            { username }
        ]
    })

    if (existedUser) {
        console.log(existedUser);
        throw new ApiError(409, "User is already exist with this email or username")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files?.coverImage) && req.files?.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path

    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avtar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avtar) {
        throw new ApiError(500, "Something went wrong while uploading avatar");
    }

    const createdUser = await User.create({
        fullName,
        avtar: avtar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase(),
        password,
    })
    const user = await User.findById(createdUser._id).select(
        "-password -refreshToken"
    );
    if (!user) {
        throw new ApiError(500, "Something went wrong while registering user")
    }

    res.status(201).json(
        new ApiResponse(200, user, "User registered successfully")
    )

})


const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    console.log((!username || !email))
    if ((!username && !email)) {
        throw new ApiError(400, "email or username  are required for login")
    }
    const user = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        }, "User logged in successfully"))

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1
        }
    },
        {
            new: true,
        })
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))



})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
            if (incomingRefreshToken !== user?.refreshToken) {
                throw new ApiError(401, "Refresh token is expired");
    
            }
    
    
    const options = {
        httpOnly:true,
        secure:true
    }
    
    const {accessToken, refreshToken} =await generateAccessAndRefreshToken(user._id);
    
    
       
        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, {accessToken, refreshToken}, "Access token refreshed successfully"))
    } catch (error) {
           throw new ApiError(500, error.message)
    }
})


 const changeUserPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id);
    if(!user){
        throw new ApiError(404, "User not found")
    }
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(401, "Old password is incorrect")
    }
    user.password = newPassword;
    await user.save({
        validateBeforeSave: false
    })
    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
 })

 const updateAccountDetails = asyncHandler(async(req,res)=>{
     const {fullName, email} = req.body;

     if (!fullName || !email) {
        throw new ApiError(400, "Full name and email are required") 
     }
     const exitedUser = await User.findOne({email});
     if (exitedUser) {
        throw new ApiError(400, "Email already exist")
     }

     const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set:{
            fullName,
            email
        }},
        {
        new:true
     }).select("-password -refreshToken")

     return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"))
     
 })

 const getCurrentUser = asyncHandler(async(req,res)=>{
     return res.status(200)
               .json(new ApiResponse(200, req.user, "User fetched successfully"))
 })

 const updateUserAvatar = asyncHandler(async(req,res)=>{
     const avtarLocalPath = req.file?.path;
     if (!avtarLocalPath) {
        throw new ApiError(400, "Avtar is required")
        
     }
     const avatar = await uploadOnCloudinary(avtarLocalPath)
     if (!avatar.url) {
        throw new ApiError(500, "Error while uploading avtar")
        
     }
     const user1 = await User.findById(req.user?._id);

     if (!user1) {
        throw new ApiError(404, "User not found")
     }

     await deleteonCloudinary(user1?.avatar);


     const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {
            new:true
        }

     ).select("-password -refreshToken")

     return res.status(200).json(new ApiResponse(200, user, "Avtar updated successfully"))

 })

 const updateUserCoverImage = asyncHandler(async(req,res)=>{
     const coverImageLocalPath = req.file?.path;
     if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is required")
     }
     const coverImage = await uploadOnCloudinary(coverImageLocalPath)
     if (!coverImage.url) {
        throw new ApiError(500, "Error while uploading cover image")
     }


    const user1 = await User.findById(req.user?._id);

    if (!user1) {
        throw new ApiError(404, "User not found")
    }

    await deleteonCloudinary(user1?.coverImage);

         const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {
            new:true
        }
     ).select("-password -refreshToken")





     return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"))

 })

 const getUserChannelProfile = asyncHandler(async(req,res)=>{
     const {username} = req.params;
     if (!username?.trim()) {
        throw new ApiError(400, "Username is required")
     }

    const channel= await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{$size:"$subscribers"},
                subscribedToCount:{$size:"$subscribedTo"},
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }



                }
            }
        },
        {
            $project:{
              fullName:1,
              username:1,
              subscribersCount:1,
              subscribedToCount:1,
              isSubscribed:1,
              avatar:1,
              coverImage:1,
              email:1
            }
        }
        

     ])
     if (channel?.length === 0) {
        throw new ApiError(404, "Channel not found")
        
     }
     
     return res.status(200).json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))
     
 })
 const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:'users',
                            localField:'owner',
                            foreignField:'_id',
                            as:'owner',
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                           owner:{
                            $first:"$owner"
                           }
                        }
                    }
                ]

            }
        }

    ])
    if (!user) {
        throw new ApiError(404, "History not found")
        
    }
    return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"))



     
 })



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

}