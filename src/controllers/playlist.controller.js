import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    if (!name) {
        throw new ApiError("name is required", 400);
    }
    if (!description) {
        throw new ApiError("description is required", 400); 
    }

    if (!req.user) {
        throw new ApiError("user is required", 400);   
    }
    

    const playList = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    return res.status(201).json(new ApiResponse(201, playList, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError("invalid user id", 400);
        
    }
    if (!req.user) {
        throw new ApiError("user is required", 400);
    }

    const playlists = await Playlist.aggregate([
        {
            $match:{
                owner: mongoose.Types.ObjectId(userId)

            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]


            }
        }
    ])
    res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched successfully"))



})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError("invalid playlist id", 400);
    }
    if (!req.user) {
        throw new ApiError("user is required", 400);
        
    }

    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        }
    ])

    res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"))




})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    // TODO: add video to playlist

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400,"Playlist not found");
        
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400,"Video not found");
    }

    if (!req.user) {
        throw new ApiError(400,"User not found");
        
    }

    const playList = await Playlist.findByIdAndUpdate(playlistId, {
        $push:{
            videos: videoId
        }
    })

    res.status(200).json(new ApiResponse(200, playList, "Video added to playlist successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400,"Playlist not found");
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400,"Video not found");
    }

    if (!req.user) {
        throw new ApiError(400,"User not found");
    }

    const playList = await Playlist.findByIdAndUpdate(playlistId, {
        $pull:{
            videos: videoId
        }
    })

    res.status(200).json(new ApiResponse(200, playList, "Video removed from playlist successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400,"Playlist not found");
        
    }


    const playList = await Playlist.findByIdAndDelete(playlistId)
    if (!playList) {
        throw new ApiError(400,"Playlist not found");
    }
    res.status(200).json(new ApiResponse(200, playList, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!playlistId) {
        throw new ApiError(400,"Playlist not found");
        
    }
    if (!name) {
        throw new ApiError(400,"Name is required");
        
    }
    if (!description) {
        throw new ApiError(400,"Description is required"); 
    }

    const playList = await Playlist.findByIdAndUpdate(playlistId, {
        $set:{
            name,
            description
        }
    })

    res.status(200).json(new ApiResponse(200, playList, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}