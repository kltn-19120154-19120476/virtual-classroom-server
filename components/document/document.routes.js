import express from "express";
import authenticationMiddleware from "../../middleware/auth.middleware.js";
import { createDocument, getDocumentByPresIds } from "./document.controller.js";
const router = express.Router();

router.post("/create", authenticationMiddleware, createDocument);
router.post("/list", authenticationMiddleware, getDocumentByPresIds);

export default router;
