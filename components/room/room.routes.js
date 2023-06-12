import express from "express";
import authenticationMiddleware from "../../middleware/auth.middleware.js";
import {
  addUser,
  createRoom,
  delRoomByIds,
  getRoomByIds,
  getRoomDetail,
  removeUser,
  updateRoom,
  upgradeRole,
} from "./room.controller.js";

const router = express.Router();

router.post("/create", authenticationMiddleware, createRoom);
router.put("/update", authenticationMiddleware, updateRoom);
router.post("/add-user", addUser);
router.post("/role", authenticationMiddleware, upgradeRole);
router.post("/remove-user", authenticationMiddleware, removeUser);

router.get("/detail/:roomId", authenticationMiddleware, getRoomDetail);
router.post("/list", authenticationMiddleware, getRoomByIds);
router.delete("/list/:id", authenticationMiddleware, delRoomByIds);

export default router;
