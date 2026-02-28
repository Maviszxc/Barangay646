/** @format */

// controllers/barangayController.js
const data = require("../data/barangay646.json");

const getBarangayStats = (req, res) => {
  try {
    return res.status(200).json(data);
  } catch (err) {
    console.error("Error retrieving barangay stats:", err);
    res.status(500).json({ message: "Failed to fetch barangay stats." });
  }
};

module.exports = { getBarangayStats };
