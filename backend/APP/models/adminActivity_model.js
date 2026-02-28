/** @format */

const mongoose = require("mongoose");

const AdminActivityLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin", // still a User model, but the role is admin
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // the affected user (approved or rejected)
    default: null,
  },
  actionType: {
    type: String,
    enum: [
      "UserApproval",
      "UserRejection",
      "CertificateApproval",
      "CertificateRejection",
      "PostEvent",
      "UpdateContent",
      "UpdateAboutPage",
      "UPDATE_BLOTTER_STATUS",
    ],
    required: true,
  },
  certificateType: {
    type: String,
    enum: ["brgy_clearance", "indigency", "bus_clearance", "e_blotter", null],
    default: null,
  },
  EventTitle: {
    type: String,
    default: null,
  },
  reason: {
    type: String, // for rejection message or notes (optional)
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AdminActivityLog", AdminActivityLogSchema);
