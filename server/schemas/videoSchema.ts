import mongoose from "mongoose"

const videoSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export const videoModel = mongoose.model("Video", videoSchema)
