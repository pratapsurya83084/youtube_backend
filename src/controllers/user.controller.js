import { asyncHandler } from "../utiles/asyncHandler.js";
import { ApiError } from "../utiles/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadonCloudinary } from "../utiles/cloudinary.js";
import { ApiResponse } from "../utiles/ApiResponse.js";
import jwt from "jsonwebtoken";
//generated both tokens in user.model call and save refreshtokens in DB
const generateAccessandRfereshToken = async (userId) => {
  try {
    const user = await User.findById(userId); //find userid and  DBid
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //save user refreshTokens in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); //without any validation direct save in DB refresgTokens
    //after save the refreshTokens in the db return both tokens
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something Went wrong While generating refresh and access token "
    );
  }
};

//resgister user  method is used in router
//if /register  url  then hit register method.
const registerUser = asyncHandler(async (req, res) => {
  //step1- take a input from user,frontend
  //step2-check empty or not
  //step3-if empty, validation
  //step4-check user is already exist or not check=username,email
  //step5-avatar  is required,coverimage  check
  //step6-url upload cloudinary
  //step7-check avatar or not
  //step8-create a user object -create entry in DB
  //remove password and refreshtoken
  //check for user creation
  //if create return respond if not then send error

  const { fullName, username, email, password } = req.body;
  // console.log("email:", email, "password:", password);

  //check validation all input
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field is required");
  }

  //check user is already existed or not in DB through username,email
  //User is model findOne is a searching method in DB
  const existedUser = await User.findOne({
    $or: [{ username }, { email }], //username,email is match then  return this user
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "....User with email or username is alredy existed......"
    );
  }

  //so multer gives file access

  //take file from frontend as a input
  const avatarLocalPath = await req.files?.avatar?.[0]?.path; //path is coming from multer file
  // const coverimageLocalPath = await req.files?.coverImage[0]?.path;
  // console.log(avatar);

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
    // console.log(coverImageLocalPath);
  }
  console.log(avatarLocalPath);
  //check avatar is existed or not,
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is Required");
  }

  //if file is exist in avatarlocalFilePath ,then upload to cloudinary
  const avatar = await uploadonCloudinary(avatarLocalPath); //cloudinary upload img

  //if file is exist in coverImagelocalFilePath ,then upload to cloudinary
  const coverImage = await uploadonCloudinary(coverImageLocalPath);

  //so avatar is required then again check the avatar is uploaded on cloudinary or  not  if no the throw err
  if (!avatar) {
    throw new ApiError(400, "........Avatar is also Required......");
  }

  //step8-if create a user object -insert data, entry in DB
  //User is model name
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", //if coverimage is exists then url stored in DB but is not exist then empty ,because it is not required
    email,
    password,
    username: username.toLowerCase(),
  });

  //user variable contained is stored all above data in db
  //after stored mongooDB create auto id for each entry
  //select keyword use to not select password and refreshtoken

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //using id check user is create or not

  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while registring the User..................."
    );
  }

  //if user is created then send response successfull created
  //we import ApiResponse
  //return response to created user
  return res.status(201).json(
    new ApiResponse(
      200, //statusCode
      createdUser, // no pasword ,refreshToken , but all data
      "User created successfully" //message
    )
  );
});

//login user method
const loginUser = asyncHandler(async (req, res) => {
  //step1-take input from frontend ppassword,email req.body
  //username and email check
  //find the user in DB
  //password check if no throw err
  //if password is check ,generate refresh,access token and send use
  //send tokens in cookies

  const { email, password, username } = req.body;
  //if user is not give email,password as a input then throw err
  if (!(username || email)) {
    throw new ApiError(400, "username and password is required");
  }

  //check registerd user or not if registerd user only login possible
  //find in db ,username and email ,if no throw errr
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "user does not existed");
  }

  //check user password with bcrypt password use=isCorrectPassword is a function
  const isPasswordvalid = await user.isPasswordCorrect(password); //we pass argu as a input through user .

  if (!isPasswordvalid) {
    throw new ApiError(401, "password is incorrect");
  }

  //if user password is correct then create refresh and  access token i create above generate method
  const { accessToken, refreshToken } = await generateAccessandRfereshToken(
    user._id
  ); //after calling we get access ,refresh tokens

  const loggedInuser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //Send cookies i.e which info we send to the user

  const options = {
    httpOnly: true,
    secure: true,
  };
  //send response all ok
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          //data
          user: loggedInuser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully" //message
      )
    );
});

//logout method
// const logOutUser=asyncHandler(async(req,res)=>{
// //use Middleware
// await User.findByIdAndUpdate(
//   req.user._id,
// {
//   $set : {
//     refreshToken:undefined
//   }
// },
// {
//   new :true
// }
// )

// const options = {
//   httpOnly: true,
//   secure: true,
// };

// return res
// .status(200)
// .clearCookie("accessToken",options)
// .clearCookie("refreshToken",options)
// .json(new ApiResponse(200 ,{},"User logged Out success"))

// })

const logOutUser = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "User not authenticated"));
  }

  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { refreshToken: undefined } },
      { new: true }
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //how to refresh access tokens
  //access help of cookies
  const incomingRefreshtoken =
    req.cookies.refreshToken || req.body.refreshToken;

  console.log(incomingRefreshtoken);

  if (!incomingRefreshtoken) {
    throw new ApiError(401, "unauthorized request");
  }
  //verify users token
  try {
    const decodedtoken = jwt.verify(
      incomingRefreshtoken,
      process.env.REFRESH_TOKEN_SECRET
    );
    //db token
    const user = await User.findById(decodedtoken?._id);
    console.log(user);
    if (!user) {
      throw new ApiError(401, "invalid refreshtoken");
    }

    //userToken not equal db refreshToken
    if (incomingRefreshtoken !== user?.refreshToken) {
      throw new ApiError(401, "refreshToken is expired");
    }

    //generate tokens
    const options = {
      httpOnly: true,
      secure: true,
    };
    //generate new tokens
    const { accessToken, newrefreshToken } =
      await generateAccessandRfereshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access token refreshed "
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

//change current password
const currentPasswordchange = asyncHandler(async (req, res) => {
  //take user 2 password
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const ispasswordcorrect = await user.isPasswordCorrect(oldPassword);

  if (!ispasswordcorrect) {
    throw new ApiError(400, "invalid old password");
  }

  user.password = newPassword;
  user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

//if  user is loggeIn then throw current user
const currentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        req.user,
        currentUser,
        "current user fetch successfully"
      )
    );
});

//update account
const updateAccountDetail = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All filed are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        //set is update method
        fullName,
        email: email,
      },
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  ).select("-password ");
  //find by user id wise

  return res
    .status(200)
    .json(new ApiResponse(200, user, "account updated successfully"));
  //   return res.status(200).json(new ApiResponse(200,{},"account updated successfully"))
});

//update avatar file
const UpdateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is missing");
  }
  const avatar = await uploadonCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  //update avatar
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password ");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));

  //  const user=await User.findByIdAndUpdate(
  //    req.user?._id,
  //    {
  //      $set:{
  //        avatar:req.file?.path
  //      }
  //    },
  //    {
  //      new:true,
  //      runValidators:true,
  //      useFindAndModify:false,
  //    }
  //  ).select("-password -refreshToken")
});

//update coverImage file
const UpdateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage file is missing");
  }
  const coverImage = await uploadonCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on coverImage");
  }

  //update avatar
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password ");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      //one pipeline
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  console.log(channel);

  if (!channel?.length) {
    throw new ApiError(404, "channel is not exist");
  }

  return res
    .status(200)
    .json(200, channel[0], "user channel is fetched successfully");
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.objectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "vidios",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },

          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }

        ],
      },
    },
  ]);
return res
.status(200)
.json(
   ApiResponse( 200,  user[0].getWatchHistory ,
    "watchHistory fetched successfully "

    )
)

});



export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  currentPasswordchange,
  updateAccountDetail,
  UpdateUserAvatar,
  UpdateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
