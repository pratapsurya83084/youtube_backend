

// The asyncHandler function takes a requestHandler 
// function as an argument and returns a new function
//  that wraps the requestHandler function in a Promise.resolve() method.
//  This allows the requestHandler function to be executed asynchronously and
//  its result to be returned as a Promise.

// The returned function also includes a catch() method 
// that handles any errors that may occur during the 
// execution of the requestHandler function. If an error occurs,
//  the catch() method calls the next() function with the error
//  object as an argument, which allows the error to be handled
//  by the Express.js error handling middleware.

const asyncHandler = (requestHandler) => {
  return  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

 export  {asyncHandler} ;

//asyncHandler is higher order function -use as a parameter and return as variable

// 2.second method

// const asyncHandler=(fn)=>async(req,res,next)=>{
// try {
//     await fn(req,res,next)
// } catch (error) {
//     res.status(err.code ||400).json({
//         sucsess:false,
//         message:err.message
//     })
// }
// }
// export {asyncHandler}
