import express from "express";
import { adminRegister, adminLogin, adminLogout, verifyEmail, forgotPassword, resetPassword, checkAuth } from "../controllers/auth.controllers.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);
router.post("/adminRegister", adminRegister);
router.post("/adminLogin", adminLogin);
router.post("/adminLogout", adminLogout);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;