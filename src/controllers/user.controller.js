import {asyncHandler} from '../utiles/asyncHandler.js'


//resgister user  method is used in router 
//if /register  url  then hit register method.
const registerUser = asyncHandler(async (req, res) => {

  res.status(200).json({
    Message:'ok',

})


})


export {registerUser}

