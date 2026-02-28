/** @format */

// routes/barangayRoutes.js
const express = require("express");
const router = express.Router();
const { getBarangayStats } = require("../controllers/cencus_controller");

router.get("/stats", getBarangayStats);

module.exports = router;
