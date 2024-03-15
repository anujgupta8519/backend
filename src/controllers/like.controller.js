import mongoose  from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError("invalid video id", 400);  
    }

    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const like = await Like.findOne({video: videoId, likedby: req.user?._id})

    if (like) {
       const deletedlike = await Like.findByIdAndDelete(like._id)
       res.status(200).json(new ApiResponse(200, deletedlike, "unliked"))
    }else{
        const newLike = new Like({
            video: videoId,
            likedby: req.user?._id
        })
        res.status(200).json(new ApiResponse(200, newLike, "liked"))
    }    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError("invalid comment id", 400);
    }

    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const like = await Like.findOne({comment: commentId, likedby: req.user?._id})

    if (like) {
       const deletedlike = await Like.findByIdAndDelete(like._id)
       res.status(200).json(new ApiResponse(200, deletedlike, "unliked"))
    }else{
        const newLike = new Like({
            comment: commentId,
            likedby: req.user?._id
        })
        res.status(200).json(new ApiResponse(200, newLike, "liked"))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError("invalid tweet id", 400);
    }

    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const like = await Like.findOne({tweet: tweetId, likedby: req.user?._id})

    if (like) {
       const deletedlike = await Like.findByIdAndDelete(like._id)
       res.status(200).json(new ApiResponse(200, deletedlike, "unliked"))
    }else{
        const newLike = new Like({
            tweet: tweetId,
            likedby: req.user?._id
        })
        res.status(200).json(new ApiResponse(200, newLike, "liked"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const videos = await Like.aggregate([
        {
            $match:{
                likedby: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video"
            }
        },
        {
            $project:{
                comment:0,
                tweet:0,
                _id:0
            }
        }
    ])

    res.status(200).json(new ApiResponse(200, videos, "liked videos"))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}