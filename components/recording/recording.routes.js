import express from "express";
import authenticationMiddleware from "../../middleware/auth.middleware.js";
import {
  createRecording,
  deleteRecording,
  getRecordingByMeetingId,
  updateRecording,
} from "./recording.controller.js";
const router = express.Router();

router.post("/create", authenticationMiddleware, createRecording);
router.post("/list", authenticationMiddleware, getRecordingByMeetingId);
router.delete("/delete", authenticationMiddleware, deleteRecording);
router.put("/update", authenticationMiddleware, updateRecording);

export default router;
