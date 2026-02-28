/** @format */

const multer = require("multer");

// Store in memory instead of local disk
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
