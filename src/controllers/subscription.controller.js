import mongoose  from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400,"Channel not found");
        
    }

    if (!req.user) {
        throw new ApiError(400,"User not found");
    }

    const subscription = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if (subscription) {
        const deletedSubscription = await Subscription.findByIdAndDelete(subscription._id)
        res.status(200).json(new ApiResponse(200, deletedSubscription, "Subscription deleted successfully"))
    }else{
        const newSubscription = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        })

        res.status(200).json(new ApiResponse(200, newSubscription, "Subscription created successfully"))
    }


})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400,"Channel not found");
    }

    if (!req.user) {
        throw new ApiError(400,"User not found");
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
                pipeline:[
                    {
                        $project:{
                            email:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        }
    ])

    res.status(200).json(new ApiResponse(200, subscriptions, "Subscribers list"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!mongoose.isValidObjectId(subscriberId)) {
        throw new ApiError(400,"Subscriber not found");
    }

    if (!req.user) {
        throw new ApiError(400,"User not found");
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channel",
                pipeline:[
                    {
                        $project:{
                            email:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        }
    ])

    res.status(200).json(new ApiResponse(200, subscriptions, "Subscribed channels list"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}