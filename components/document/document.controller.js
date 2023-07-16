import { STATUS } from "../../constants/common.js";
import {
  BAD_REQUEST_STATUS_CODE,
  INTERNAL_SERVER_STATUS_CODE,
  INTERNAL_SERVER_STATUS_MESSAGE,
  NOTFOUND_STATUS_CODE,
  SUCCESS_STATUS_CODE,
} from "../../constants/http-response.js";

import dotenv from "dotenv";
import { APIResponse } from "../../models/APIResponse.js";
import documentModel from "../../models/document.model.js";
dotenv.config();
// Interact Data

export const createDocument = async (req, res) => {
  const {
    token,
    presId,
    filename,
    uploadUrl,
    // podId, current, authzToken, uploadFailed, uploadFailReasons
  } = req.body;

  //Check presId exists
  try {
    const existDoc = await documentModel.findOne({ presId });
    if (existDoc) {
      return res
        .status(BAD_REQUEST_STATUS_CODE)
        .json(APIResponse(STATUS.ERROR, "The document is already existed"));
    }
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  const newDoc = new documentModel({
    // podId,
    userId: req.user._id,
    presId,
    filename,
    uploadUrl,
    // current,
    // authzToken,
    // uploadFailed,
    // uploadFailReasons,
    isPublic: req.user?.type === "ADMIN",
  });

  try {
    await newDoc.save();
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(
        APIResponse(STATUS.ERROR, INTERNAL_SERVER_STATUS_MESSAGE, error.message)
      );
  }

  //ALl SUCCESS
  return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, newDoc));
};

export const getDocumentByPresIds = async (req, res) => {
  try {
    if (req.user) {
      const { ids = [] } = req.body;
      const userId = req.user._id;

      const docList =
        ids?.length > 0
          ? await documentModel
              .find({
                presId: {
                  $in: ids,
                },
                userId,
              })
              .sort({
                db_createdTime: -1,
              })
          : await documentModel
              .find({ $or: [{ userId }, { isPublic: true }] })
              .sort({
                db_createdTime: -1,
              });

      return res.status(SUCCESS_STATUS_CODE).json({
        status: STATUS.OK,
        data: docList,
        message: "Get document list successfully",
      });
    } else {
      return res.status(NOTFOUND_STATUS_CODE).json({
        status: STATUS.ERROR,
        data: [],
        message: "Not found",
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

export const deletePres = async (req, res) => {
  try {
    if (req.user) {
      const id = req.param("id");
      const userId = req.user._id;

      await documentModel.deleteOne({ presId: id, userId });

      return res.status(SUCCESS_STATUS_CODE).json({
        status: STATUS.OK,
        data: [],
        message: "Document deleted successfully",
      });
    } else {
      return res.status(NOTFOUND_STATUS_CODE).json({
        status: STATUS.ERROR,
        data: [],
        message: "Not found",
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

export const updatePres = async (req, res) => {
  try {
    if (req.user) {
      const userId = req.user._id;
      const id = req.param("id");

      const body = req.body;

      await documentModel.updateOne({ presId: id, userId }, body);

      return res.status(SUCCESS_STATUS_CODE).json({
        status: STATUS.OK,
        data: [],
        message: "Document updated successfully",
      });
    } else {
      return res.status(NOTFOUND_STATUS_CODE).json({
        status: STATUS.ERROR,
        data: [],
        message: "Not found",
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
