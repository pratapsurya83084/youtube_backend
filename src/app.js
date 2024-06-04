import express from "express";
import cors from 'cors'
import cookiePasrser from 'cookie-pasrser'

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
app.use(cookiePasrser())
export { app };
