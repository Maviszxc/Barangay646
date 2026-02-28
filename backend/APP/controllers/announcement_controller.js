/** @format */

const Announcement = require("../models/announcement_model");
const {
  sendAnnouncement,
} = require("../controllers/otp_controller");

const createAnnouncement = async (req, res) => {
  try {
    const { title, description, isUrgent } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required." });
    }

    const newAnnouncement = await Announcement.create({
      title,
      description,
      isUrgent: isUrgent,
      isOld: false,
    });

    if (isUrgent) {
      const message = `📢 URGENT ANNOUNCEMENT: ${title} - ${description}`;
      // await sendAnnouncementSMS(message);
      await sendAnnouncement(title, description);
    }

    res.status(201).json({
      message: "Announcement created successfully.",
      announcement: newAnnouncement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getAllAnnouncements = async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Automatically mark as old if created more than a week ago
    await Announcement.updateMany(
      { createdAt: { $lte: oneWeekAgo }, isOld: false },
      { $set: { isOld: true } }
    );

    const announcements = await Announcement.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Announcements fetched successfully",
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
    });
  }
};

const getNewAnnouncements = async (req, res) => {
  try {
    const newAnnouncements = await Announcement.find({ isOld: false }).sort({
      createdAt: -1,
    });
    res.status(200).json({ announcements: newAnnouncements });
  } catch (error) {
    console.error("Error in getNewAnnouncements:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const markAsOld = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Announcement.findByIdAndUpdate(
      id,
      { isOld: true },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Announcement not found" });

    res.status(200).json({ message: "Marked as old", announcement: updated });
  } catch (error) {
    console.error("Error in markAsOld:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getNewAnnouncements,
  markAsOld,
};
