import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/user.model.js";

import { SECRET_TOKEN, STATUS } from "../../constants/common.js";
import { BAD_REQUEST_STATUS_CODE, INTERNAL_SERVER_STATUS_CODE, NOTFOUND_STATUS_CODE, SUCCESS_STATUS_CODE, SUCCESS_STATUS_MESSAGE, UNAUTHENTICATED_STATUS_CODE } from "../../constants/http-response.js";

export const register = async (req, res) => {
  const { email, name, password } = req.body;
  try {
    const user = await User.findOne({
      email,
    });

    if (user) return res.status(BAD_REQUEST_STATUS_CODE).json({ code: STATUS.ERROR, message: "Email is used!", data: [] });

    const newPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: newPassword,
    });

    return res.status(SUCCESS_STATUS_CODE).json({ code: STATUS.OK, message: SUCCESS_STATUS_MESSAGE, data: [user] });
  } catch (err) {
    return res.status(NOTFOUND_STATUS_CODE).json({
      code: STATUS.ERROR,
      message: `Register failed: ${err}`,
      data: [],
    });
  }
};

export const login = async (req, res) => {
  const user = req.user;

  if (user) {
    const access_token = jwt.sign({ ...user }, SECRET_TOKEN);

    return res.status(SUCCESS_STATUS_CODE).json({
      code: STATUS.OK,
      data: [
        {
          ...user,
          access_token,
        },
      ],
      message: SUCCESS_STATUS_MESSAGE,
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(UNAUTHENTICATED_STATUS_CODE).json({
        code: STATUS.ERROR,
        data: [],
        message: "Unauthorized",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      const access_token = jwt.sign({ ...user }, SECRET_TOKEN);

      return res.status(SUCCESS_STATUS_CODE).json({
        status: STATUS.OK,
        message: SUCCESS_STATUS_MESSAGE,
        data: [
          {
            ...user,
            access_token,
          },
        ],
      });
    } else {
      return res.status(NOTFOUND_STATUS_CODE).json({
        code: STATUS.ERROR,
        data: [],
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    res.status(INTERNAL_SERVER_STATUS_CODE).json({ code: STATUS.ERROR, data: [], message: error.message });
  }
};
