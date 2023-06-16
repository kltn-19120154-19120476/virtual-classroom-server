import mongoose from "mongoose";

const Room = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  memberIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  coOwnerIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  meetingInfo: { type: String },
  presentation: { type: String },
  meetingSettings: { type: String },
  learningDashboards: [{ type: String }],
});

export default mongoose.model("Room", Room);
