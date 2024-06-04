import express from "express";
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express();
//cookie parser and cors  are after (config) used app create

app.use(cors({   
    //options
    origin:process.env.CORS_ORIGIN,
    credentials:true

}))

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'
//routes declaration  permnantly no change below route 
 //if userRouter component create /login route ,then here change 
 //then http://localhost:8000/users/login  
 //,if another route then only replace /login


app.use('/api/v1/users',userRouter)  //add api version like v1
//http://localhost:8000/users/register

export { app };
