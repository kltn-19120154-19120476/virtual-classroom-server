import express from "express";
import authenticationMiddleware from "../../middleware/auth.middleware.js";
import {
  createInviteLink,
  createRoom,
  delRoomByIds,
  getRoomByIds,
  getRoomDetail,
  inviteByLink,
  removeMember,
  sendEmailInvite,
  upgradeRole,
} from "./room.controller.js";

const router = express.Router();

// POST: Interact with member
router.post("/create", authenticationMiddleware, createRoom);
router.post("/link", authenticationMiddleware, createInviteLink);
router.post("/invite", inviteByLink);
router.post("/send-invite-email", sendEmailInvite);
router.post("/role", authenticationMiddleware, upgradeRole);
router.post("/remove", authenticationMiddleware, removeMember);

// GET: Member and room data
router.get("/detail/:groupId", authenticationMiddleware, getRoomDetail);
router.post("/list", authenticationMiddleware, getRoomByIds);
router.delete("/list/:id", authenticationMiddleware, delRoomByIds);

export default router;
