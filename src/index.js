import {connect_DB}  from './db/index.js'
import dotenv  from 'dotenv'
import {app} from './app.js'
// import express from 'express'


dotenv.config({
    path: './.env'
})
connect_DB().then(()=>{  //pr0mise return
    app.listen(process.env.Port || 8000)  //es port pe server run kare
console.log(`server is running at port :${process.env.PORT}`);
})
.catch((error)=>{
    console.log("db connection is failed..............",error);
})

