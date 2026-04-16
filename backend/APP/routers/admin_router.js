const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin_controller");
const {authenticateToken} = require("../middleware/auth");

router.post("/admin-login", adminController.loginAdmin);
router.post("/admin-add", adminController.addAdmin);
router.get("/all-residences", adminController.getAllResidences);
router.get("/pending-approvals", adminController.getPendingApprovals);
router.put("/approve-request/:id",authenticateToken, adminController.approveUserRequest);
router.put("/reject-request/:id",authenticateToken, adminController.rejectUserRequest);
router.put("/change-password",authenticateToken, adminController.changePassword);
router.get("/admin-logs", adminController.getAdminActivityLogs);
router.get("/recent-request", adminController.getRecentRequest);
router.get("/profile", authenticateToken, adminController.getAdminProfile);
router.put("/edit-profile", authenticateToken, adminController.updateAdminProfile);
router.post("/add-resident", authenticateToken, adminController.addResident);
router.put('/:userId/account-status', adminController.updateAccountStatus);
// Add these routes to your existing router
router.get('/resident/:id', authenticateToken, adminController.getResidentDetails);
router.put('/resident/:id', authenticateToken, adminController.updateResident);
router.delete('/resident/:id', authenticateToken, adminController.deleteResident);

router.get("/monthly-requests", adminController.getMonthlyRequests);
router.get("/monthly-requests/:year", adminController.getMonthlyRequestsByYear);

module.exports = router;