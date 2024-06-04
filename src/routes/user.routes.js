import { registerUser } from "../controllers/user.controller.js";

import { Router } from "express";

const router = Router();

router.route("/register").post(registerUser); //if '/register' path ,then execute registerUser method

export  default router ;   //export in the app.js