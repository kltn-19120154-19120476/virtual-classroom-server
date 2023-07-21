import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "../../config/email/emailService.js";
import { STATUS } from "../../constants/common.js";
import {
  BAD_REQUEST_STATUS_CODE,
  NOTFOUND_STATUS_CODE,
  SUCCESS_STATUS_CODE,
} from "../../constants/http-response.js";
import userModel from "../../models/user.model.js";

export const sendVerificationEmail = async (req, res) => {
  try {
    if (req.user) {
      const user = req.user;

      sendEmail(
        process.env.EMAIL_HOST,
        user.email,
        "Verified your account",
        `<p> Please click to this link to verify your account: <a href="${process.env.CLIENT_DOMAIN}/active?userId=${user._id}&activeCode=${user.activeCode}">${process.env.CLIENT_DOMAIN}/active?userId=${user._id}&activeCode=${user.activeCode}</a> </p>`
      );

      return res.status(SUCCESS_STATUS_CODE).json({
        status: STATUS.OK,
        data: [],
        message: "The verification email has been sent",
      });
    } else {
      return res.status(NOTFOUND_STATUS_CODE).json({
        status: STATUS.ERROR,
        data: [],
        message: "Can not send verification email",
      });
    }
  } catch (e) {
    return res.status(NOTFOUND_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: e,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    if (req.user) {
      return res.status(SUCCESS_STATUS_CODE).json({
        status: STATUS.OK,
        data: [req.user],
        message: "Get user successfully",
      });
    } else {
      return res.status(NOTFOUND_STATUS_CODE).json({
        status: STATUS.ERROR,
        data: [],
        message: "User not found",
      });
    }
  } catch (e) {
    return res.status(NOTFOUND_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: e,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    if (req.user) {
      const { name, password, newPassword } = req.body;

      const isPasswordValid = await bcrypt.compare(password, req.user.password);

      if (isPasswordValid) {
        let newPasswordHashed = "";
        if (newPassword) {
          newPasswordHashed = await bcrypt.hash(newPassword, 10);
        }
        await userModel.findOneAndUpdate(
          { email: req.user.email },
          {
            ...req.user,
            name,
            password: newPassword ? newPasswordHashed : password,
          }
        );
        const updatedUser = await userModel.findOne({ email: req.user.email });

        return res.status(SUCCESS_STATUS_CODE).json({
          status: STATUS.OK,
          data: [updatedUser],
          message: "Update user successfully",
        });
      } else {
        return res.status(BAD_REQUEST_STATUS_CODE).json({
          status: STATUS.ERROR,
          data: [],
          message: "Invalid password",
        });
      }
    } else {
      return res.status(NOTFOUND_STATUS_CODE).json({
        status: STATUS.ERROR,
        data: [],
        message: "User not found",
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

export const getUserByIds = async (req, res) => {
  try {
    if (req.user) {
      const { ids = [] } = req.body;

      const userList = await userModel
        .find({
          _id: {
            $in: ids,
          },
        })
        .sort({ createdAt: -1 });

      return res.status(SUCCESS_STATUS_CODE).json({
        status: STATUS.OK,
        data: userList.map(({ _id, name, email }) => ({ _id, name, email })),
        message: "Get user list successfully",
      });
    } else {
      return res.status(NOTFOUND_STATUS_CODE).json({
        status: STATUS.ERROR,
        data: [],
        message: "User not found",
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

export const adminGetUserList = async (req, res) => {
  if (req.user?.type !== "ADMIN") {
    return res.status(BAD_REQUEST_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: "You must be an administrator to do this action",
    });
  }

  try {
    let userList = [];

    const search = req.param("search") || "";

    if (search) {
      userList = await userModel
        .find({
          $or: [
            { name: new RegExp(search, "iu") },
            { email: new RegExp(search, "iu") },
          ],
          type: {
            $ne: "ADMIN",
          },
        })
        .sort({
          createdAt: -1,
        });
    } else {
      userList = await userModel
        .find({ type: { $ne: "ADMIN" } })
        .sort({ createdAt: -1 });
    }

    return res.status(SUCCESS_STATUS_CODE).json({
      status: STATUS.OK,
      data: userList,
      message: "Get user list successfully",
    });
  } catch (e) {
    return res.status(NOTFOUND_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: e.message,
    });
  }
};

export const adminUpdateUser = async (req, res) => {
  if (req.user?.type !== "ADMIN") {
    return res.status(BAD_REQUEST_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: "You must be an administrator to do this action",
    });
  }

  try {
    const userId = req.param("userId");

    const updateInfo = req.body;

    await userModel.updateOne({ _id: userId }, updateInfo);

    return res.status(SUCCESS_STATUS_CODE).json({
      status: STATUS.OK,
      message: "User updated successfully",
    });
  } catch (e) {
    return res.status(NOTFOUND_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: e.message,
    });
  }
};

export const adminDeleteUser = async (req, res) => {
  if (req.user?.type !== "ADMIN") {
    return res.status(BAD_REQUEST_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: "You must be an administrator to do this action",
    });
  }

  try {
    const userId = req.param("userId");

    await userModel.deleteOne({ _id: userId });

    return res.status(SUCCESS_STATUS_CODE).json({
      status: STATUS.OK,
      message: "User deleted successfully",
    });
  } catch (e) {
    return res.status(NOTFOUND_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: e.message,
    });
  }
};

export const adminResetUserPassword = async (req, res) => {
  if (req.user?.type !== "ADMIN") {
    return res.status(BAD_REQUEST_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: "You must be an administrator to do this action",
    });
  }

  try {
    const userId = req.param("userId");

    const newPassword = uuidv4().substr(0, 8);

    const newPasswordHashed = await bcrypt.hash(newPassword, 10);

    await userModel.updateOne({ _id: userId }, { password: newPasswordHashed });

    return res.status(SUCCESS_STATUS_CODE).json({
      status: STATUS.OK,
      data: [{ newPassword }],
      message: "User reset password successfully",
    });
  } catch (e) {
    return res.status(NOTFOUND_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: e.message,
    });
  }
};
