// import db name and  password
import { DB_NAME } from "../constant.js";
import mongoose from "mongoose";

const connect_DB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGOO_DB_URL}/${DB_NAME}`
    );
    // console.log(connectionInstance);
    console.log(
      ".....the DB is connected successfully !!..",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log(".........failed db connected........",error);
    process.exit(1);
  }
};

export { connect_DB };
