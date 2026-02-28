/** @format */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");
const Event = require("../models/event_model");
const AdminActivityLog = require("../models/adminActivity_model");
const {
  sendAnnouncementSMS,
  sendAnnouncementEmail,
  sendEventEmail,
} = require("../controllers/otp_controller");

const supabase = createClient(
  process.env.SUPABASE_URI,
  process.env.SUPABASE_SERVICE_ROLE
);

// ✅ Create Event
const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, color } = req.body;

    if (!title || !description || !date || !time || !color) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    let imageData = null;
    if (req.file) {
      const fileExt = path.extname(req.file.originalname);
      const fileName = `event-${Date.now()}${fileExt}`;
      const filePath = `events/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("bms646-app")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return res.status(500).json({
          message: "Image upload failed",
          error: uploadError.message,
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from("bms646-app")
        .getPublicUrl(filePath);

      imageData = {
        public_id: filePath,
        url: publicUrlData.publicUrl,
      };
    }

    const newEvent = new Event({
      title,
      description,
      date,
      time,
      color,
      image: imageData,
    });

    // ✅ Convert to readable formats
    const eventDateTime = new Date(`${date}T${time}`);
    const formattedDate = eventDateTime.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const formattedTime = eventDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const message = `
📅 New Event Scheduled!

Title: ${title}
Date: ${formattedDate}
Time: ${formattedTime}

Details:
${description}
`;

    await newEvent.save();
    await sendEventEmail(title, message);

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ✅ Get All Events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: "Events retrieved successfully",
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Get Events Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update Event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, color } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 🖼 Replace the image if new file uploaded
    if (req.file) {
      // 🧼 Delete old image from Supabase
      if (event.image?.public_id) {
        await supabase.storage
          .from("bms646-app")
          .remove([event.image.public_id]);
      }

      // 📤 Upload new image to Supabase
      const fileExt = path.extname(req.file.originalname);
      const fileName = `event-${Date.now()}${fileExt}`;
      const filePath = `events/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("bms646-app")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadError.message });
      }

      const { data: publicUrlData } = supabase.storage
        .from("bms646-app")
        .getPublicUrl(filePath);

      event.image = {
        url: publicUrlData.publicUrl,
        public_id: filePath,
      };
    }

    // Update the other fields
    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.time = time || event.time;
    event.color = color || event.color;

    await event.save();

    res.status(200).json({ message: "Event updated successfully", event });
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete Event
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 🧼 Delete image from Supabase Storage
    if (event.image?.public_id) {
      const { error: deleteError } = await supabase.storage
        .from("bms646-app")
        .remove([event.image.public_id]);

      if (deleteError) {
        console.error(
          "Failed to delete image from Supabase:",
          deleteError.message
        );
        // Not returning here—still proceed to delete the event
      }
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete Event Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  updateEvent,
  deleteEvent,
};
