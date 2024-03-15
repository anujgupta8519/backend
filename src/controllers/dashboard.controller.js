import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
     
    if (!req.user) {
        
        
    }
    const channelState = await Video.aggregate([

        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"owner",
                foreignField:"channel",
                as:"subscribers",
                pipeline:[
                    {
                        $group:{
                            _id:null,
                            totalSubscribers:{$sum:1}
                        }
                       
                    }
                ]

            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes",
                pipeline:[
                    {
                        $group:{
                            _id:null,
                            totalLikes:{$sum:1}
                        }
                     
                    }
                ]
            }
        },
        {
            $group:{
                _id:null,
                totalVideos:{$sum:1},

            }
           
        },
        {
            $project:{
                _id:0
            }
        }
    ])
    res.status(200).json(new ApiResponse(200, channelState, "Channel stats"))


    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const videos = await Video.find({owner: req.user?._id})
    res.status(200).json(new ApiResponse(200, videos, "Channel videos"))



    
    
   

    
})

export {
    getChannelStats, 
    getChannelVideos
    }


         /*
        {
                $match: {
                    owner: mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $group: {
                    _id: "$owner",
                    totalVideos: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscriptionData"
                }
            },
            {
                $lookup: {
                    from: "likes",
                    let: { ownerId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$channel", "$$ownerId"] } } },
                        { $group: { _id: "$channel", totalLikes: { $sum: 1 } } }
                    ],
                    as: "likesData"
                }
            },
            {
                $addFields: {
                    totalSubscribers: { $size: "$subscriptionData" },
                    totalLikes: { $ifNull: [{ $arrayElemAt: ["$likesData.totalLikes", 0] }, 0] }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalVideos: 1,
                    totalSubscribers: 1,
                    totalLikes: 1
                }
            }
        ]);
         */