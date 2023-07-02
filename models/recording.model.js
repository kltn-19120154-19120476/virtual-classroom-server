import mongoose from "mongoose";

const Recording = new mongoose.Schema({
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
  participants: {
    type: Number,
  },
  published: {
    type: Boolean,
  },
  deleted: {
    type: Boolean,
  },
});

export default mongoose.model("Recording", Recording);
