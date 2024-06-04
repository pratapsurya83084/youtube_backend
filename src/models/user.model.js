import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt, { compare } from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudinary url
      required: true,
    },
    coverImage: {
      type: String, //cloudinary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Vidio",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);


//pre is a hook before save  .
//This is useful for adding logic such as validation,
// modification, or other side effects before saving, updating, 
//deleting, or finding documents in the database.
userSchema.pre("save", async function (next) {
  //if password is not modified then return next()
  if (!this.isModified("password")) return next();

  //if password modified then bcryt and save after DB
  this.password = bcrypt.hash(this.password, 10);
  next();
  //before the save take a password and bcrypt
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
  //after the save take a password and bcrypt
  //compare the password with the hashed password
  //return true or false
 
};

//generate accesstoken jwt.sign method auto generate token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      email: this.email,
      fullName: this.fullName,
      
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }

  );
};

//generate the refreshtoken 
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
      
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};



export const User = mongoose.model("User", userSchema);
