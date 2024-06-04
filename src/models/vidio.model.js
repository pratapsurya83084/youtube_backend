import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
//agggragate mongoose-pagi-v2    is allows to write aggregate queries
import mongoose from 'mongoose-aggregate-paginate-v2'

const vidioSchema = new Schema(
  {
    vidiofile: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },

    duration: {
        type: Number,
        required: true,
      },
      views:{
        type:Number,
        default:0
      },
      isPublished:{
        type:Boolean,
        default:true
      },
      owner:{
         type:Schema.Types.objectId,
         ref:"User"
      }
  },
  { timestamps: true }
);

vidioSchema.plugin(mongooseAggregatePaginate)

// a plugin is a way to add reusable functionality to your Mongoose schemas. 
// Plugins allow you to encapsulate and
// share common logic across different schemas and models.
export const Vidio = mongoose.model("Vidio", vidioSchema);
