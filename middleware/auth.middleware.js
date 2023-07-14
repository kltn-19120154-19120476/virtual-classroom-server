import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { STATUS } from "../constants/common.js";
import {
  BAD_REQUEST_STATUS_CODE,
  FORBIDDEN_STATUS_CODE,
  UNAUTHENTICATED_STATUS_CODE,
  UNAUTHENTICATED_STATUS_MESSAGE,
} from "../constants/http-response.js";
import { APIResponse } from "../models/APIResponse.js";
import User from "../models/user.model.js";
dotenv.config();

const authenticationMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(UNAUTHENTICATED_STATUS_CODE)
      .json({ message: UNAUTHENTICATED_STATUS_MESSAGE });
  }

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(token, process.env.SECRET_TOKEN, async (err, decodedToken) => {
      if (err) {
        return res
          .status(FORBIDDEN_STATUS_CODE)
          .json({ message: err.message, data: [], status: STATUS.ERROR });
      } else {
        const owner = jwt.decode(token);
        let ownerUser = await User.findOne({
          email: owner?.email || owner?.user?.email,
        });

        if (req.body?.isSendVerificationEmail) {
          const {
            _id = "",
            activeCode = "",
            isActive = false,
            email = "",
          } = ownerUser?._doc;
          req.user =
            { _id: _id?.toString(), activeCode, isActive, email } || null;
          next();
        } else if (ownerUser?._doc?.isActive) {
          req.body.token = token;
          req.user = { ...ownerUser._doc, access_token: token } || null;
          next();
        } else {
          return res
            .status(FORBIDDEN_STATUS_CODE)
            .json(APIResponse(STATUS.ERROR, "ACCOUNT_NOT_ACTIVATED"));
        }
      }
    });
  } catch (err) {
    return res
      .status(BAD_REQUEST_STATUS_CODE)
      .json({ message: err.message, data: [], status: STATUS.ERROR });
  }
};

export default authenticationMiddleware;
