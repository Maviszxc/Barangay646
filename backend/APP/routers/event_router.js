/** @format */

const express = require("express");
const router = express.Router();
const eventController = require("../controllers/event_controller");
const upload = require("../database/multer");
const { authenticateToken } = require("../middleware/auth");


router.post(
  "/create",
  upload.single("event-image"), authenticateToken,
  eventController.createEvent
);

router.get("/all",eventController.getAllEvents);
router.put(
  "/update/:id",
  upload.single("event-image"),
  eventController.updateEvent
);
router.delete("/delete/:id",eventController.deleteEvent);

module.exports = router;
