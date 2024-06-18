

import { ApiError } from "../utiles/ApiError.js";
import { asyncHandler } from "../utiles/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyjwt = asyncHandler(async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    console.log(token);

    if (!token) {
      throw new ApiError(401, "Unauthorized request: No token provided");
    }

    // Verify the user token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    //issued
    console.log(decodedToken);
    const user = await User.findById(decodedToken?.id).select(
      "-password -refreshToken"
    );

    console.log(user); //null
    if (!user) {
      throw new ApiError(401, "Invalid access token: User not found");
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error) {
    //error create
    throw new ApiError(401, error.message || "Invalid access token");
  }
});

export { verifyjwt };
