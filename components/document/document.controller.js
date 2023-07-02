import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "../../config/email/emailService.js";
import { STATUS } from "../../constants/common.js";
import {
  BAD_REQUEST_STATUS_CODE,
  BAD_REQUEST_STATUS_MESSAGE,
  FORBIDDEN_STATUS_CODE,
  FORBIDDEN_STATUS_MESSAGE,
  INTERNAL_SERVER_STATUS_CODE,
  INTERNAL_SERVER_STATUS_MESSAGE,
  NOTFOUND_STATUS_CODE,
  NOTFOUND_STATUS_MESSAGE,
  SUCCESS_STATUS_CODE,
  SUCCESS_STATUS_MESSAGE,
} from "../../constants/http-response.js";

import dotenv from "dotenv";
import { APIResponse } from "../../models/APIResponse.js";
import documentModel from "../../models/document.model.js";
import userModel from "../../models/user.model.js";
dotenv.config();
// Interact Data

export const createDocument = async (req, res) => {
  const {
		token, presId, filename, uploadUrl,
		// podId, current, authzToken, uploadFailed, uploadFailReasons
	} = req.body;

  //Check presId exists
  try {
    const existDoc = await documentModel.findOne({ presId });
    if (existDoc) {
      return res.status(BAD_REQUEST_STATUS_CODE).json(APIResponse(STATUS.ERROR, "The document is already existed"));
    }
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  //Get Author
  const author = jwt.decode(token);
  let authorUser;

  try {
    authorUser = await userModel.findOne({ email: author.user.email });
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  const newDoc = new documentModel({
    // podId,
    authorId: author.id,
    presId,
    filename,
    uploadUrl,
    // current,
    // authzToken,
    // uploadFailed,
    // uploadFailReasons,
  });

  try {
    await newDoc.save();
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, INTERNAL_SERVER_STATUS_MESSAGE, error.message));
  }

  //ALl SUCCESS
  return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, newDoc));
};

export const getDocumentByPresIds = async (req, res) => {
	try {
		if (req.user) {
			const { ids = [] } = req.body;

			const docList =
				ids?.length > 0
					? await documentModel.find({
							presId: {
								$in: ids,
							},
						})
					: await documentModel.find();

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
