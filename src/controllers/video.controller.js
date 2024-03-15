import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteonCloudinary, uploadOnCloudinary} from "../utils/Cloudinary.uploader.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page=1, limit=10,query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError("invalid user id", 400);
    }

    //by using this we can not get user details 
    // const videos = await Video.paginate (
    //     {
    //         $or:[
    //             {
    //                 title: {
    //                     $regex: query,
    //                     $options: "i"
    //                 }
    //             }
    //         ],
    //         owner: userId,
    //         isPublished: true
    //     },
    //     {
    //         page: page,
    //         limit: limit,
    //         sort: {
    //             [sortBy]: sortType

    //         }
    //     }

    // )

    // if (!videos) {
    //     throw new ApiError("videos not found", 404);
        
    // }

    // res.status(200).json(new ApiResponse(200, videos, "All videos"))

    const videosWithUserData = await Video.aggregate([
        {
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } }
                ],
                owner: new mongoose.Types.ObjectId(userId),
                isPublished: true
            }
        },
        {
            $lookup: {
                from: "users", // This should be the name of your User collection in MongoDB
                localField: "owner",
                foreignField: "_id",
                as: "ownerData",
            }
        },
        {
            $addFields: {
                ownerData: { $arrayElemAt: ["$ownerData", 0] }
            }
        },

        {
            $sort: { [sortBy]: sortType === 'asc' ? 1 : -1 }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ]);

    if (!videosWithUserData) {
        throw new ApiError("videos not found", 404);
        
    }

    res.status(200).json(new ApiResponse(200, videosWithUserData, "All videos"))
    
   
    



    
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!title) {
        throw new ApiError("title is required", 400);
    }
    if (!description) {
        throw new ApiError("description is required", 400);
        
    }

    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!videoLocalPath) {
        throw new ApiError("video is required", 400);
    }
    if (!thumbnailLocalPath) {
        throw new ApiError("thumbnail is required", 400);
        
    }

    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!video) {
        throw new ApiError("video upload failed", 400);
    }
    if (!thumbnail) {
        throw new ApiError("thumbnail upload failed", 400);
        
    }
    const newvideo  = await Video.create({
        title,
        description,
        videoFile: video.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        duration:video.duration

    })

    res.status(201).json(new ApiResponse(201, newvideo, "Video published successfully"))




})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError("invalid video id", 400);
        
    }

    if (!req.user) {
        throw new ApiError("user is required", 400);
        
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
                 


            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            avatar: 1

                        }
                    },
  
                    
                    
                ]

            }
        }
    ])

    if (!video[0]) {
        throw new ApiError("video not found", 404);
    }

    res.status(200).json(new ApiResponse(200, video[0], "Video found successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body;

    if (!title) {
        throw new ApiError("title is required", 400);
    }

    if (!description) {
        throw new ApiError("description is required", 400);
    }
    

    if (!isValidObjectId(videoId)) {
        throw new ApiError("invalid video id", 400);
    }

    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const video = await Video.findById(videoId)

    if (req.user._id.toString() !== video?.owner.toString()) {
        throw new ApiError("unauthorized access", 401);
        
    }

    if (!video) {
        throw new ApiError("video not found", 404);
    }

    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError("thumbnail is required", 400);
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail) {
        throw new ApiError("thumbnail upload failed", 400);
    }

    await deleteonCloudinary(video.thumbnail)

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description,
                thumbnail: thumbnail.url
            }
        }
    )

    res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"))




})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError("invalid video id", 400);
    }

    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const video = await Video.findById(videoId)

    if (req.user._id.toString() !== video?.owner.toString()) {
        throw new ApiError("unauthorized access", 401);
        
    }

    if (!video) {
        throw new ApiError("video not found", 404);
    }

    await deleteonCloudinary(video.videoFile)
    await deleteonCloudinary(video.thumbnail)

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    res.status(200).json(new ApiResponse(200, deletedVideo, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle publish status

    if (!isValidObjectId(videoId)) {
        throw new ApiError("invalid video id", 400);
    }

    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const video = await Video.findById(videoId)

    if (req.user._id.toString() !== video?.owner.toString()) {
        throw new ApiError("unauthorized access", 401);
    }

    if (!video) {
        throw new ApiError("video not found", 404);
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished: !video.isPublished
            }
        }
    )

    res.status(200).json(new ApiResponse(200, updatedVideo, "Video status updated successfully"))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}