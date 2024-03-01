import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.uploader.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body
    if (
        [fullName, email, username, password].some((field)=>
        field?.trim()==="" )
        ) {
            throw new ApiError(400,"All fields are required")
        
    }
    if (email  && !email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
        throw new ApiError(400,"Invalid email")    
    }

    const existedUser = await User.findOne({
        $or:[
            { email },
            { username }
        ]
    })

    if(existedUser){
        console.log(existedUser);
        throw new ApiError(409,"User is already exist with this email or username")
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
    avtar:avtar.url,
    coverImage:coverImage?.url||"",
    email,
    username:username.toLowerCase(),
    password,
   })
    const user = await User.findById(createdUser._id).select(
        "-password -refreshToken"
    );
    if (!user) {
        throw new ApiError(500,"Something went wrong while registering user")
    }

    res.status(201).json(
        new ApiResponse(200,user,"User registered successfully")
    )

})


export {registerUser}