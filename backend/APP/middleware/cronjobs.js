/** @format */

// backend/utils/announcementCron.js
const cron = require("node-cron");
const Announcement = require("../models/announcement_model");

// Export the task-starting function
const startAnnouncementCron = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      await Announcement.updateMany(
        { createdAt: { $lte: oneWeekAgo }, isOld: false },
        { isOld: true }
      );

      console.log("✅ Old announcements updated.");
    } catch (error) {
      console.error("❌ Cron job error:", error);
    }
  });
};

module.exports = startAnnouncementCron;
