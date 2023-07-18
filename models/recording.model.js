import mongoose from "mongoose";

const Recording = new mongoose.Schema(
  {
    recordId: {
      type: String,
    },
    meetingId: {
      type: String,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    playbackUrl: {
      type: String,
    },
    name: {
      type: String,
    },
    recordName: {
      type: String,
    },
    participants: {
      type: Number,
    },
    published: {
      type: Boolean,
    },
    deleted: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Recording", Recording);
