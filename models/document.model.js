import mongoose from "mongoose";

const Document = new mongoose.Schema({
  //   podId: {
  //     type: mongoose.Schema.Types.ObjectId,
  //   },
  presId: {
    type: String,
  },
  filename: {
    type: String,
  },
  uploadUrl: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isPublic: {
    type: Boolean,
  },
  //   current: {
  //     type: mongoose.Schema.Types.ObjectId,
  //   },
  //   authzToken: {
  //     type: mongoose.Schema.Types.ObjectId,
  //   },
  //   uploadFailed: {
  //     type: mongoose.Schema.Types.ObjectId,
  //   },
  //   uploadFailReasons: {
  //     type: mongoose.Schema.Types.ObjectId,
  //   },
  db_createdTime: {
    type: Date,
    default: new Date().getTime(),
  },
});

export default mongoose.model("Document", Document);
