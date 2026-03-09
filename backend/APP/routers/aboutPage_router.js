/** @format */

const express = require("express");
const router = express.Router();
const { upload, uploadToSupabase } = require("../database/supabaseConfig");
const {
  getAboutContent,
  updateAboutContent,
  updateAboutSection,
  updateHeroImage,
  addOfficial,
  updateOfficial,
  deleteOfficial,
} = require("../controllers/aboutPage_controller");
const { authenticateToken } = require("../middleware/auth");

// Public routes
router.get("/", getAboutContent);

// Admin only routes
router.put("/", authenticateToken, upload.single('image'), updateAboutContent); // Now supports hero image upload
router.put("/hero-image", upload.single('image'), updateHeroImage); // Temporarily removed auth for testing

// Test route for debugging
router.post("/test-upload", upload.single('image'), (req, res) => {
  console.log('=== TEST UPLOAD DEBUG ===');
  console.log('Request received');
  console.log('Headers:', req.headers);
  console.log('File:', req.file);
  console.log('Body:', req.body);
  console.log('========================');
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file received",
    });
  }
  
  res.status(200).json({
    success: true,
    message: "Test upload successful",
    file: {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  });
});

// Officials management (specific routes first)
router.post("/officials/:type", authenticateToken, upload.single('image'), addOfficial); // type: 'officials' or 'kagawads'
router.put("/officials/:type/:index", authenticateToken, upload.single('image'), updateOfficial);
router.delete("/officials/:type/:index", authenticateToken, deleteOfficial);

// General section route (must come after specific routes)
router.put("/:section", authenticateToken, updateAboutSection);

module.exports = router;
