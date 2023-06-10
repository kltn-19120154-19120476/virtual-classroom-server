import mongoose from "mongoose";

const Group = new mongoose.Schema({
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
  inviteCode: [{ type: String, required: true }],
  meetingInfo: { type: String },
  presentation: { type: String },
});

export default mongoose.model("Group", Group);
