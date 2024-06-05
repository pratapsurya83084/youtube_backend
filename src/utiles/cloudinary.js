import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

//fs is used to help to file read,write ,sync,async,open,close,link,unlink

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

///file uploaded on cloudinary below code

const uploadonCloudinary = async (localFilePath) => {
  //localFilePath is a parameter as url
  try {
    if (!localFilePath) return null;
    // throw new ApiError(401,'not find file path')
    //upload file on the cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been successfull uploaded on cloudinary
    console.log(".....file is uploaded on cloudinary..", response.url);
    //after uploaded i can unlink file
    fs.unlinkSync(localFilePath);
    //  console.log(response);
    return response;
  } catch (error) {
    //server se locally saved temparary file is remove i.e we use fs.unlink
    fs.unlinkSync(localFilePath);

    return null;
  }
};

export { uploadonCloudinary };
