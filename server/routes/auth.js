import express from "express";
import { adminRegister, adminLogin, adminLogout, verifyEmail, forgotPassword, resetPassword, checkAuth, viewTenants, findTenants, addTenant, addTenantView, checkTenantAuth, tenantLogin, tenantLogout, editTenant, updateTenant, deleteTenant } from "../controllers/auth.controllers.js";
import { verifyTenantToken, verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// admins
router.get("/check-auth", verifyToken, checkAuth);
router.post("/adminRegister", adminRegister);
router.post("/adminLogin", adminLogin);
router.post("/adminLogout", adminLogout);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// tenants
router.get("/view-tenants", viewTenants);
router.post("/find-tenants", findTenants);
router.post("/addTenant", addTenant);
router.get("/addTenantView", addTenantView);
router.get('/tenant/checkAuth', verifyTenantToken, checkTenantAuth);
router.post("/tenantLogin", tenantLogin);
router.post("/tenantLogout", tenantLogout);
router.get("/editTenant/:tenant_id", editTenant);
router.post("/editTenant/:tenant_id", updateTenant);
router.delete("/deleteTenant/:tenant_id", deleteTenant);

export default router;