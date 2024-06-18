import mongoose, { Schema } from 'mongoose'

const subscriptionSchema=new  Schema({
    subscriber:{
        type:Schema.Types.ObjectId,//one who is subscribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,//one whom subscriber  is subscribing
        ref:"User"
    }
},{timestamps:true})




export const  Subscription=mongoose.model("Subscription",subscriptionSchema)


//how to count the subscriber = count the document ,how many document create 
//user subscribe the any one channel then create a 1 automatically document
//every time create one new document ,suppose i subscribe 1 channel then create a new document.
