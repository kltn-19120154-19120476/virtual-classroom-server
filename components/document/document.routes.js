import express from "express";
import authenticationMiddleware from "../../middleware/auth.middleware.js";
import {
  createDocument,
  deletePres,
  getDocumentByPresIds,
} from "./document.controller.js";
const router = express.Router();

router.post("/create", authenticationMiddleware, createDocument);
router.post("/list", authenticationMiddleware, getDocumentByPresIds);
router.delete("/delete", authenticationMiddleware, deletePres);
export default router;
