import { Router } from "express";
import {
    changeUserPassword,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser
)


router.route('/login').post(loginUser)

//secured routes

router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-access-token').post(refreshAccessToken)
router.route('/change-password').put(verifyJWT, changeUserPassword)
router.route('/get-current-user').get(verifyJWT, getCurrentUser)
router.route('/update-account').patch(verifyJWT, updateAccountDetails)
router.route('/change-avatar').patch(verifyJWT, upload.single('avatar'), updateUserAvatar)
router.route('/change-cover-image').patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage)
router.route('/c/:username').get(verifyJWT, getUserChannelProfile)
router.route('/watch-history').get(verifyJWT, getWatchHistory)




export default router