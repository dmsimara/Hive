import express from "express";
import { adminRegister, adminLogin, adminLogout, verifyEmail, forgotPassword, resetPassword, checkAuth, viewTenants, findTenants, addTenant, addTenantView, checkTenantAuth, tenantLogin, tenantLogout, deleteTenant, viewAdmins, viewUnits, addUnitView, addUnit, deleteUnit, getOccupiedUnits, editTenant, updateTenant, addEvent, viewEvents, editEvent, deleteEvent, getEvents, updateEvent, viewNotices, pinnedNotices, permanentNotices, addNotice, togglePinned, togglePermanent, deleteNotice, getAvailableRooms, getNotices, searchTenants, searchRooms, deleteAdmin } from "../controllers/auth.controllers.js";
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
router.get("/addUnitView", addUnitView);
router.post("/addUnit", addUnit);
router.delete("/deleteUnit/:room_id", deleteUnit);
router.get("/occupied-units", getOccupiedUnits);
router.post("/add/event", addEvent);
router.get("/view/events", viewEvents);
router.post("/edit/event", editEvent);
router.delete("/delete/event/:eventId", deleteEvent);
router.get("/get/events", getEvents);
router.get("/get/notices", getNotices);
router.post("/update/event/:eventId", updateEvent);
router.get("/view/notices", viewNotices);
router.get("/view/notices/pinned", pinnedNotices);
router.get("/view/notices/permanent", permanentNotices);
router.post("/view/notices/add", addNotice);
router.patch("/view/notices/:noticeId/toggle_pinned", togglePinned);
router.patch("/view/notices/:noticeId/toggle_permanent", togglePermanent);
router.delete("/view/notices/:noticeId/delete", deleteNotice);
router.get("/getAvailableRooms", getAvailableRooms);
router.get("/search", searchTenants);
router.get("/searchRooms", searchRooms);
router.get("/searchTenants", findTenants);
router.delete("/deleteAdmin/:admin_id", deleteAdmin);


// tenants
router.get("/view-tenants", viewTenants);
router.post("/addTenant", addTenant);
router.get("/addTenantView", addTenantView);
router.get('/tenant/checkAuth', verifyTenantToken, checkTenantAuth);
router.post("/tenantLogin", tenantLogin);
router.post("/tenantLogout", tenantLogout);
router.get("/editTenant/:tenant_id", editTenant);
router.post("/editTenant/:tenant_id", updateTenant);
router.delete("/deleteTenant/:tenant_id", deleteTenant);
router.get("/view-admins", viewAdmins);

export default router;
