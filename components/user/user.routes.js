import express from "express";
import { USER_ROUTE } from "../../constants/routes.js";
import authenticationMiddleware from "../../middleware/auth.middleware.js";
import {
  adminDeleteUser,
  adminGetUserList,
  adminResetUserPassword,
  adminUpdateUser,
  getCurrentUser,
  getUserByIds,
  sendVerificationEmail,
  updateUser,
} from "./user.controller.js";
const router = express.Router();

router.get(USER_ROUTE.CURRENT_USER, authenticationMiddleware, getCurrentUser);

router.put(USER_ROUTE.UPDATE_USER, authenticationMiddleware, updateUser);

router.post(
  USER_ROUTE.GET_USERS_BY_IDS,
  authenticationMiddleware,
  getUserByIds
);

router.post(
  USER_ROUTE.SEND_VERIFY_EMAIL,
  authenticationMiddleware,
  sendVerificationEmail
);

// ADMIN APIS
router.get("/admin/user/list", authenticationMiddleware, adminGetUserList);
router.put("/admin/user/update", authenticationMiddleware, adminUpdateUser);
router.delete("/admin/user/delete", authenticationMiddleware, adminDeleteUser);
router.get(
  "/admin/user/reset-password",
  authenticationMiddleware,
  adminResetUserPassword
);

export default router;
