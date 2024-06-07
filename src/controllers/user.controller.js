import { asyncHandler } from "../utiles/asyncHandler.js";
import { ApiError } from "../utiles/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadonCloudinary } from "../utiles/cloudinary.js";
import { ApiResponse } from "../utiles/ApiResponse.js";

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
        {  //data
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
    return res.status(400).json(new ApiResponse(400, {}, "User not authenticated"));
  }

  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { refreshToken: undefined } },
      { new: true }
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, {}, "Internal server error"));
  }
});


export { registerUser, loginUser ,logOutUser};
