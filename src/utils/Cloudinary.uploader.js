import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs';
          
cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localpath)=>{
    try {
        if (!localpath) {
            return null
        }else{
            const result = await cloudinary.uploader.upload(localpath,{
                resource_type: "auto"
            })
            console.log("file uploaded on cloudinary",result)
            fs.unlinkSync(localpath)
            return result;
        }
        
    } catch (error) {
        fs.unlinkSync(localpath)
    }
}