/** @format */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    familyId: { // NEW: Reference to family
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: false
    },

    birthdate: {
      type: Date,
      required: [true, "Birthdate is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    houseNumber: {
      type: String,
      required: [true, "House number is required"],
    },
    isRegisteredVoter: {
      type: Boolean,
      default: false,
    },
    isLoginApproved: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    alreadyAnswered: {
      type: Boolean,
      default: false,
    },
    idImage: {
      type: String,
      default:
        "https://erlpalgdzifqkcfaeqhg.supabase.co/storage/v1/object/public/bms646-app/valid-ids/admin.jpg",
    },
    idImagePublicId: {
      type: String,
      default:
        "https://erlpalgdzifqkcfaeqhg.supabase.co/storage/v1/object/public/bms646-app/valid-ids/admin.jpg",
    },
    notificationPreferences: {
      events: { type: Boolean, default: true },
      certificates: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
    },
    isHeadofFamily: {
      type: Boolean,
      default: false,
    },
    dataCollectionConsent: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: String,
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
