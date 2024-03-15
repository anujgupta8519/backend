import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError("invalid video id", 400);
    }

    res.status(200).json(
        {
            "message": "success"
        }
    )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;
    if (!content) {
        throw new ApiError("content is required", 400);
        
    }
    if (!req.user) {
        throw new ApiError("user is required", 400);
    }
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError("invalid video id", 400);
        
    }

    const comment = await Comment.create({
        content,
        owner: req.user?._id,
        video: videoId

    })

    return res.status(201).json(new ApiResponse(201, comment, "Comment created successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    if (!content) {
        throw new ApiError("content is required", 400);   
    }
    if (!req.user) {
        throw new ApiError("user is required", 400);
    }
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError("invalid comment id", 400);
    }

    const comment = await Comment.findByIdAndUpdate(commentId, {
        $set:{
            content
        }
    },
    {
        new:true
    }
    )
    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"))


})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params
    if (!req.user) {
        throw new ApiError("user is required", 400);
    }
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError("invalid comment id", 400);
    }

    const comment = await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(new ApiResponse(200, comment, "Comment deleted successfully"))

    


})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }