import mongoose from "mongoose";

const User = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    password: { type: String },
    myRoomIds: [{ type: mongoose.Types.ObjectId, required: true, ref: "Room" }],
    joinedRoomIds: [
      { type: mongoose.Types.ObjectId, required: true, ref: "Room" },
    ],
    isActive: { type: Boolean, required: true },
    activeCode: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", User);
