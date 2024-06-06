import { registerUser ,loginUser,logOutUser} from "../controllers/user.controller.js";

import {upload} from '../middlewares/multer.middlewares.js'

import { Router } from "express";
import { verifyjwt } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
    //upload is a diskStorage path './public/temp' take a file
    // 2 url/file take avatar=1 and coverImage=1
    upload.fields([
        {name:"avatar",maxCount:1 },
        {name:"coverImage",maxCount:1}
    ]),
    registerUser
); //if '/register' path ,then execute registerUser method


router.route("/login").post(loginUser)  //

//secured routes
router.route("/logout").post(verifyjwt,logOutUser) //

export  default router ;   //export in the app.js