import multer from "multer";

//configuration = which place you can store file  i.e image url

const storage = multer.diskStorage({
  //I can use diskStorage for url
  destination: (req, file, cb)=>{
    cb(null, "./public/temp"); //./public/temp  is a file stored location
  },
  filename: (req, file, cb)=>{
    cb(null, file.originalname); //original name means user uploaded time this file name i.e original name
  },
});

export const upload = multer({ storage });
