/** @format */

const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const upload = require("../database/multer");
const userController = require("../controllers/user_controller");

router.post("/user-login", userController.loginUser);
// router.post(
//   "/user-register",
//   uploadValidId.single("valid-id"),
//   handleUploadErrors,
//   userController.registerUser
// );
router.post(
  "/user-register",
  upload.single("validId"),
  userController.registerUser
);

router.post(
  "/submit-id",
  authenticateToken, // ✅ ensures req.user.userId is available
  upload.single("validId"),
  userController.submitID
);

router.get("/all-users", authenticateToken, userController.getAllUsers);

router.put(
  "/change-password",
  authenticateToken,
  userController.changePassword
);

router.get("/profile", authenticateToken, userController.getUserProfile);

router.put("/forgot-password", userController.forgotChangePassword);
router.post("/forgot-password", userController.forgotPassword);
router.get(
  "/user-logs",
  authenticateToken,
  userController.getUserCertificateActivity
);

router.delete("/delete-user", authenticateToken, userController.deleteUser);
router.put(
  "/notification-preferences",
  authenticateToken,
  userController.updateNotificationPreferences
);

router.get("/cencus", authenticateToken, userController.userCencus);

// Add this endpoint for fetching household info for the logged-in user
router.get(
  "/household",
  authenticateToken,
  userController.getUserHouseholdInfo
);

router.get("/check-head-of-family", userController.checkHeadOfFamily);

router.post(
  "/add-household-member",
  authenticateToken,
  userController.addHouseholdMember
);

// Debug endpoint to test authentication
router.get(
  "/debug-auth",
  authenticateToken,
  (req, res) => {
    res.json({ 
      success: true, 
      user: req.user,
      message: "Authentication working" 
    });
  }
);

router.put(
  "/update-household-member/:memberId",
  authenticateToken,
  userController.updateHouseholdMember
);

router.delete(
  "/delete-household-member/:memberId",
  authenticateToken,
  userController.deleteHouseholdMember
);

router.put(
  "/data-collection-consent",
  authenticateToken,
  userController.updateDataCollectionConsent
);

module.exports = router;
