/** @format */

const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcement_controller");

router.post("/create", announcementController.createAnnouncement);
router.get("/all", announcementController.getAllAnnouncements);
router.get("/new", announcementController.getNewAnnouncements);
router.patch("/mark-old/:id", announcementController.markAsOld);

module.exports = router;
