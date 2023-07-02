import mongoose from 'mongoose';

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
});

export default mongoose.model('Recording', Recording);
