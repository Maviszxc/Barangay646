/** @format */

const express = require("express");
const router = express.Router();
const { upload, uploadToSupabase } = require("../database/supabaseConfig");
const {
  getAboutContent,
  updateAboutContent,
  updateAboutSection,
  addOfficial,
  updateOfficial,
  deleteOfficial,
} = require("../controllers/aboutPage_controller");
const { authenticateToken } = require("../middleware/auth");

// Public routes
router.get("/", getAboutContent);

// Admin only routes
router.put("/", authenticateToken, updateAboutContent);
router.put("/:section", authenticateToken, updateAboutSection);

// Officials management
router.post("/officials/:type", authenticateToken, upload.single('image'), addOfficial); // type: 'officials' or 'kagawads'
router.put("/officials/:type/:index", authenticateToken, upload.single('image'), updateOfficial);
router.delete("/officials/:type/:index", authenticateToken, deleteOfficial);

module.exports = router;
