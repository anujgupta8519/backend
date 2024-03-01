const asyncHandler = (requestHandle)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandle(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}

// asyncHandler =>(fn) => async(req,res,next)=>{
//     try {
//         await fn(req,res,next);
        
//     } catch (error) {
//         res.status(error.code||500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }