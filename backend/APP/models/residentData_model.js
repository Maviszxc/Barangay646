// [file name]: residentData_model.js
/** @format */

const mongoose = require("mongoose");

// Add Family Schema
const familySchema = new mongoose.Schema({
  householdId: {
    type: String, // Combination of address + houseNumber
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  headUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false // Allow null initially
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const residentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    familyId: { // NEW: Reference to family
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: false
    },
    fullName: {
      type: String,
      required: false,
    },
    birthdate: {
      type: Date,
      required: false,
    },
    houseNumber: {
      type: String,
      required: true,
    },
    // ... ALL YOUR EXISTING FIELDS REMAIN THE SAME
    placeOfBirth: {
      type: String,
      required: [true, "Place of birth is required"],
    },
    sex: {
      type: String,
      enum: ["Male", "Female", "LGBTQ+"],
      required: [true, "Sex is required"],
    },
    sexSpecify: {
      type: String,
      required: false,
    },
    civilStatus: {
      type: String,
      enum: ["Single", "Married", "Widowed", "Separated", "Divorced"],
      required: [true, "Civil status is required"],
    },
    citizenship: {
      type: String,
      required: [true, "Citizenship is required"],
      default: "Filipino",
    },
    isHeadOfFamily: {
      type: Boolean,
      default: false,
    },
    occupation: {
      type: String,
      required: [true, "Occupation is required"],
    },
    employmentStatus: {
      type: String,
      enum: [
        "Employed",
        "Unemployed",
        "PWD",
        "OFW",
        "Solo Parent",
        "Out-of-School Youth",
        "Out-of-School Children",
        "Kasambahay",
      ],
      required: [true, "Employment status is required"],
    },
    voterStatus: {
      type: String,
      enum: ["Registered", "Not Registered"],
      required: [true, "Voter status is required"],
    },
    kasambahayDetails: {
      educationalAttainment: {
        type: String,
        enum: [
          "Elementary",
          "High School",
          "Vocational",
          "College",
          "Post-Graduate",
        ],
      },
      natureOfWork: String,
      employmentArrangement: {
        type: String,
        enum: ["Live-in", "Live-out", "Part-time"],
      },
      salary: Number,
      memberships: {
        sss: Boolean,
        philhealth: Boolean,
        pagibig: Boolean,
        pat: Boolean,
      },
      employerName: String,
      employerHomeAddress: String,
      workAddress: String,
      age: Number,
    },
    age: {
      type: Number,
      required: true,
    },
    voterStatus: {
      type: String,
      enum: ["Registered", "Not Registered", "Pre-Registered"],
      required: [true, "Voter status is required"],
    },
    isCompleted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
residentSchema.index({ userId: 1 });
residentSchema.index({ employmentStatus: 1 });
residentSchema.index({ age: 1 });
residentSchema.index({ voterStatus: 1 });
residentSchema.index({ houseNumber: 1, isHeadOfFamily: 1 });
residentSchema.index({ familyId: 1 }); // NEW index

// Create models
const Census = mongoose.model("Census", residentSchema);
const Family = mongoose.model("Family", familySchema);

// Export both models
module.exports = {
  Census,
  Family
};