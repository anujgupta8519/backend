import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    if (!content) {
        throw new ApiError("content is required", 400);   
    }
    if (!req.user) {
        throw new ApiError("user is required", 400);
        
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"))

 

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError("invalid user id", 400);
    }

    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const tweets = await Tweet.find({owner: userId})

    res.status(200).json(new ApiResponse(200, tweets, "User tweets"))

 
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    
    const {tweetId} = req.params
    const {content} = req.body

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError("invalid tweet id", 400);
    }
    if (!content) {
        throw new ApiError("content is required", 400);
    }
    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const tweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set:{
            content
        }
    })

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"))


})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError("invalid tweet id", 400);
    }

    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId)

    res.status(200).json(new ApiResponse(200, tweet, "Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}