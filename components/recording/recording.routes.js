import express from "express";
import authenticationMiddleware from "../../middleware/auth.middleware.js";
import { createRecording, getRecordingByMeetingId } from "./recording.controller.js";
const router = express.Router();

router.post("/create", authenticationMiddleware, createRecording);
router.post("/list", authenticationMiddleware, getRecordingByMeetingId);

export default router;
