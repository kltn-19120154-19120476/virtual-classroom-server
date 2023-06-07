import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { APIResponse } from "../../models/APIResponse.js";
import User from "../../models/user.model.js";

import { DEFAULT_PASSWORD, STATUS } from "../../constants/common.js";
import { BAD_REQUEST_STATUS_CODE, INTERNAL_SERVER_STATUS_CODE, NOTFOUND_STATUS_CODE, SUCCESS_STATUS_CODE, SUCCESS_STATUS_MESSAGE, UNAUTHENTICATED_STATUS_CODE } from "../../constants/http-response.js";

import { sendEmail } from "../../config/email/emailService.js";

import dotenv from "dotenv";
dotenv.config();

const getDecodedOAuthJwtGoogle = async (token) => {
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    return ticket?.payload || null;
  } catch (error) {
    return { status: 500, data: error };
  }
};

export const register = async (req, res) => {
  const { email, name, password } = req.body;
  try {
    const user = await User.findOne({
      email,
    });

    if (user) return res.status(BAD_REQUEST_STATUS_CODE).json({ status: STATUS.ERROR, message: "Email is used!", data: [] });

    const newPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      myGroupIds: [],
      joinedGroupIds: [],
      presentationIds: [],
      isActive: true,
      activeCode: uuidv4(),
    };

    const registerUser = await User.create({
      ...newUser,
      password: newPassword,
    });

    const access_token = jwt.sign({ user: newUser }, process.env.SECRET_TOKEN);

    return res.status(SUCCESS_STATUS_CODE).json({ code: STATUS.OK, message: SUCCESS_STATUS_MESSAGE, data: [{ ...registerUser._doc, access_token }] });
  } catch (err) {
    return res.status(NOTFOUND_STATUS_CODE).json({
      status: STATUS.ERROR,
      message: `Register failed: ${err}`,
      data: [],
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(UNAUTHENTICATED_STATUS_CODE).json({
        status: STATUS.ERROR,
        data: [],
        message: "Unauthorized",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      const access_token = jwt.sign({ user: user._doc }, process.env.SECRET_TOKEN);

      return res.status(SUCCESS_STATUS_CODE).json({
        status: STATUS.OK,
        message: SUCCESS_STATUS_MESSAGE,
        data: [
          {
            ...user._doc,
            access_token,
          },
        ],
      });
    } else {
      return res.status(BAD_REQUEST_STATUS_CODE).json({
        status: STATUS.ERROR,
        data: [],
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    res.status(INTERNAL_SERVER_STATUS_CODE).json({ status: STATUS.ERROR, data: [], message: error.message });
  }
};

export const loginWithGoogle = async (req, res) => {
  const { credential } = req.body;

  try {
    const data = await getDecodedOAuthJwtGoogle(credential);
    const { name, email } = data;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      const newPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      const newUser = {
        name,
        email,
        myGroupIds: [],
        joinedGroupIds: [],
        presentationIds: [],
        isActive: true,
        activeCode: uuidv4(),
        password: newPassword,
      };

      const registerUser = await User.create(newUser);
      const access_token = jwt.sign({ user: registerUser._doc }, process.env.SECRET_TOKEN);
      return res.status(SUCCESS_STATUS_CODE).json({ status: STATUS.OK, message: SUCCESS_STATUS_MESSAGE, data: [{ ...registerUser?._doc, access_token }] });
    } else {
      const access_token = jwt.sign({ user: user._doc }, process.env.SECRET_TOKEN);
      return res.status(SUCCESS_STATUS_CODE).json({
        status: STATUS.OK,
        message: SUCCESS_STATUS_MESSAGE,
        data: [
          {
            ...user._doc,
            access_token,
          },
        ],
      });
    }
  } catch (err) {
    return res.status(BAD_REQUEST_STATUS_CODE).json({ message: err.message, data: [], status: STATUS.ERROR });
  }
};

export const verifyAccount = async (req, res) => {
  const { userId, activeCode } = req.body;
  let user;

  try {
    user = await User.findById(userId);
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  if (!user) {
    return res.status(NOTFOUND_STATUS_CODE).json(APIResponse(STATUS.ERROR, "User not found"));
  }

  if (activeCode !== user.activeCode) {
    return res.status(BAD_REQUEST_STATUS_CODE).json(APIResponse(STATUS.ERROR, "Active code is not correct, please try again"));
  }

  try {
    user.isActive = true;
    await user.save();
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, "Account has been activated!", [user]));
};

export const resetAccount = async (req, res) => {
  const { email } = req.body;
  let user;

  try {
    user = await User.findOne({ email });
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  if (!user) {
    return res.status(NOTFOUND_STATUS_CODE).json(APIResponse(STATUS.ERROR, "User not found"));
  }

  const newPassword = uuidv4()
  const newHashPassword = await bcrypt.hash(newPassword, 10);
  user.password = newHashPassword;

  try {
    await user.save();
    sendEmail(
      process.env.EMAIL_HOST,
      email,
      "Reset your account",
      `<p> This is your new password: <h3> ${newPassword} </h3>`
    );
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, "New password has been sent to your email"));
};

