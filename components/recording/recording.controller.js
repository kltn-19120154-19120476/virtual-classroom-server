import jwt from "jsonwebtoken";
import { STATUS } from "../../constants/common.js";
import {
  BAD_REQUEST_STATUS_CODE,
  FORBIDDEN_STATUS_CODE,
  INTERNAL_SERVER_STATUS_CODE,
  INTERNAL_SERVER_STATUS_MESSAGE,
  NOTFOUND_STATUS_CODE,
  SUCCESS_STATUS_CODE,
} from "../../constants/http-response.js";

import dotenv from "dotenv";
import { APIResponse } from "../../models/APIResponse.js";
import recordingModel from "../../models/recording.model.js";
import roomModel from "../../models/room.model.js";
import userModel from "../../models/user.model.js";
dotenv.config();
// Interact Data

export const createRecording = async (req, res) => {
  const {
    token,
    recordId,
    meetingId,
    startTime,
    endTime,
    playbackUrl,
    name,
    participants,
    published,
    recordName,
  } = req.body;

  //Check presId exists
  try {
    const existRecording = await recordingModel.findOne({ recordId });
    if (existRecording) {
      return res
        .status(BAD_REQUEST_STATUS_CODE)
        .json(APIResponse(STATUS.ERROR, "This recording is already existed"));
    }
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //Get Author
  const author = jwt.decode(token);
  let authorUser;

  try {
    authorUser = await userModel.findOne({ email: author.user.email });
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  const newRecording = new recordingModel({
    recordId,
    meetingId,
    startTime,
    endTime,
    playbackUrl,
    name,
    participants,
    published,
    deleted: false,
    recordName,
  });

  try {
    await newRecording.save();
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(
        APIResponse(STATUS.ERROR, INTERNAL_SERVER_STATUS_MESSAGE, error.message)
      );
  }

  //ALl SUCCESS
  return res
    .status(SUCCESS_STATUS_CODE)
    .json(APIResponse(STATUS.OK, newRecording));
};

export const getRecordingByMeetingId = async (req, res) => {
  try {
    if (req.user) {
      const { meetingId } = req.body;

      let existRoom;
      //Check room exists
      try {
        existRoom = await roomModel.findById(meetingId);
        if (!existRoom) {
          return res
            .status(NOTFOUND_STATUS_CODE)
            .json(APIResponse(STATUS.ERROR, "Room not found"));
        }
      } catch (error) {
        return res
          .status(INTERNAL_SERVER_STATUS_CODE)
          .json(APIResponse(STATUS.ERROR, error.message));
      }

      const isOwner = existRoom.ownerId.equals(req.user._id);

      const recordingFilter = {
        meetingId,
        deleted: false,
      };

      if (!isOwner) {
        recordingFilter.published = true;
      }

      const recordingList = await recordingModel.find(recordingFilter).sort({
        endTime: -1,
      });

      return res.status(SUCCESS_STATUS_CODE).json({
        status: STATUS.OK,
        data: recordingList,
        message: "Get recordings successfully",
      });
    } else {
      return res.status(NOTFOUND_STATUS_CODE).json({
        status: STATUS.ERROR,
        data: [],
        message: "This meeting has no recording",
      });
    }
  } catch (e) {
    return res.status(NOTFOUND_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: e.message,
    });
  }
};

export const deleteRecording = async (req, res) => {
  const recordId = req.param("recordId");
  const roomId = req.param("roomId");

  let existRoom;
  //Check room exists
  try {
    existRoom = await roomModel.findById(roomId);
    if (!existRoom) {
      return res
        .status(NOTFOUND_STATUS_CODE)
        .json(APIResponse(STATUS.ERROR, "Room not found"));
    }
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //Check owner of room
  if (!existRoom.ownerId.equals(req.user._id)) {
    return res
      .status(FORBIDDEN_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, "You are not allowed"));
  }

  try {
    await recordingModel.updateOne({ recordId }, { deleted: true });
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //ALl SUCCESS
  return res
    .status(SUCCESS_STATUS_CODE)
    .json(APIResponse(STATUS.OK, "Recording deleted successfully"));
};

export const updateRecording = async (req, res) => {
  const { data, roomId, recordId } = req.body;

  const updateData = JSON.parse(data);

  let existRoom;
  //Check room exists
  try {
    existRoom = await roomModel.findById(roomId);
    if (!existRoom) {
      return res
        .status(NOTFOUND_STATUS_CODE)
        .json(APIResponse(STATUS.ERROR, "Room not found"));
    }
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //Check owner of room
  if (!existRoom.ownerId.equals(req.user._id)) {
    return res
      .status(FORBIDDEN_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, "You are not allowed"));
  }

  try {
    await recordingModel.updateOne({ recordId }, updateData);
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //ALl SUCCESS
  return res
    .status(SUCCESS_STATUS_CODE)
    .json(APIResponse(STATUS.OK, "Update recording successfully"));
};
