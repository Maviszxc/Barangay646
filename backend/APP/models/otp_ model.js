/** @format */

const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
  },
  otp: {
    type: String,
    required: [true, "OTP is required"],
  },
  verified: {
    type: Boolean,
    default: false, // Initially false until OTP is verified
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("OTP", otpSchema);
