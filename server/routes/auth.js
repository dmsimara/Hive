import express from "express";
import { adminRegister, adminLogin, adminLogout, verifyEmail, forgotPassword, resetPassword, checkAuth, viewTenants, findTenants, addTenant, addTenantView, checkTenantAuth, tenantLogin, tenantLogout, deleteTenant, viewAdmins, viewUnits, findUnits, addUnitView, addUnit, deleteUnit, getOccupiedUnits, editTenant, updateTenant, findDashTenants, addEvent, viewEvents, editEvent, deleteEvent } from "../controllers/auth.controllers.js";
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
router.get("/view-units", viewUnits);
router.post("/find-units", findUnits);
router.post("/find-tenants", findDashTenants);
router.get("/addUnitView", addUnitView);
router.post("/addUnit", addUnit);
router.delete("/deleteUnit/:room_id", deleteUnit);
router.get("/occupied-units", getOccupiedUnits);
router.post("/add/event", addEvent);
router.get("/view/events", viewEvents);
router.post("/edit/event", editEvent);
router.delete("/delete/event/:eventId", deleteEvent);


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
router.get("/view-admins", viewAdmins);
// router.post("/edit/adminAccount", editAdminAccount);

export default router;
