// [file name]: residentData_router.js
// ENHANCED ROUTES WITH NEW ENDPOINTS

/** @format */

const express = require("express");
const router = express.Router();
const residentData = require("../controllers/residentData_controller");
const { authenticateToken } = require("../middleware/auth");

// ✅ User Routes
router.post("/save", authenticateToken, residentData.saveCensusData);
router.get("/", authenticateToken, residentData.getCensusData);
router.get("/status", authenticateToken, residentData.getCensusDataStatus);

// ✅ Admin Routes - Enhanced
router.get(
  "/admin/total-households",
  authenticateToken,
  residentData.getTotalHouseholds
);
router.get(
  "/admin/enhanced-households",
  authenticateToken,
  residentData.getEnhancedHouseholdStatistics
);
router.get(
  "/admin/household-graph",
  authenticateToken,
  residentData.getHouseholdGraphData
);
router.get(
  "/admin/enhanced-age-distribution",
  authenticateToken,
  residentData.getEnhancedAgeDistribution
);
router.get(
  "/admin/household/:address/:houseNumber",
  authenticateToken,
  residentData.getHouseholdDetails
);

// Existing admin routes
router.get(
  "/admin/age-groups",
  authenticateToken,
  residentData.getAgeGroupStatistics
);
router.get(
  "/admin/employment",
  authenticateToken,
  residentData.getEmploymentStatistics
);
router.get("/admin/voter", authenticateToken, residentData.getVoterStatistics);
router.get(
  "/admin/households",
  authenticateToken,
  residentData.getHouseholdStatistics
);
router.get(
  "/admin/gender",
  authenticateToken,
  residentData.getGenderStatistics
);
router.get(
  "/admin/filtered",
  authenticateToken,
  residentData.getFilteredStatistics
);
router.get(
  "/admin/download",
  authenticateToken,
  residentData.downloadCensusData
);
router.get("/admin/all", authenticateToken, residentData.getAllCensusData);

router.post(
  "/check-household-head",
  authenticateToken,
  residentData.checkHouseholdHead
);
router.get(
  "/admin/user/:userId",
  authenticateToken,
  residentData.getCensusDataByUserId
);
router.get(
  "/admin/household/:userId",
  residentData.getHouseholdMembers
);

router.get(
  "/admin/household-families/:address/:houseNumber",
  authenticateToken,
  residentData.getHouseholdFamilies
);

router.get(
  "/admin/complete-household/:address/:houseNumber",
  authenticateToken,
  residentData.getCompleteHouseholdDetails
);


// ✅ NEW: Admin household head management routes
router.post(
  "/admin/check-household-head",
  authenticateToken,
  residentData.checkHouseholdHeadAdmin
);

router.post(
  "/admin/force-update-head",
  authenticateToken,
  residentData.forceUpdateHeadOfFamily
);

router.get(
  "/admin/household-heads/:address/:houseNumber",
  authenticateToken,
  residentData.getHouseholdHeads
);

// ✅ NEW: Population Statistics Routes
router.get(
  "/population/statistics",
  authenticateToken,
  residentData.getPopulationStatistics
);

router.get(
  "/population/dashboard",
  authenticateToken,
  residentData.getPopulationDashboard
);

// ✅ NEW: Civil Status and Occupation Routes
router.get(
  "/admin/civil-status",
  authenticateToken,
  residentData.getCivilStatusStatistics
);

router.get(
  "/admin/occupation",
  authenticateToken,
  residentData.getOccupationStatistics
);


module.exports = router;
