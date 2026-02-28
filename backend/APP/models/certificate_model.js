/** @format */

const mongoose = require("mongoose");

const CertificateRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  certificateType: {
    type: String,
    enum: ["brgy_clearance", "bus_clearance", "indigency", "e_blotter"],
    required: true,
  },
  purpose: {
    type: String,
    required: [true, "Purpose is required"],
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Resolved"],
    default: "Pending",
  },
  rejectionMessage: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  generatedFile: {
    type: String,
  },
  adminGeneratedFile: {
    type: String, // new field for admin version
  },
  isForSelf: {
    type: Boolean,
    default: true,
  },
  forPerson: {
    firstName: String,
    lastName: String,
    address: String,
    birthDate: Date,
    relation: String,
  },

  certificateData: {
    brgyClearance: {
      residencyDuration: String,
    },

    busClearance: {
      businessName: String,
      businessType: String,
      businessAddress: String,
      businessStartDate: Date,
    },

    indigency: {
      monthlyIncome: {
        type: String,
        enum: [
          "under_10000",
          "10000_15000",
          "15000_20000",
          "20000_25000",
          "25000_30000",
          "30000_40000",
          "40000_50000",
          "above_50000",
        ],
      },
      familyMembers: Number,
      sourceOfIncome: String,
      propertiesOwned: [String],
      hasSSS: Boolean,
      hasPhilhealth: Boolean,
    },

    eBlotter: {
      // Complainant information
      complainantName: String,
      complainantAddress: String,
      complainantContact: String,
      complainantAge: String,

      // Respondent information
      respondentName: String,
      respondentAddress: String,
      respondentContact: String,
      respondentAge: String,

      // Incident information
      incidentDate: Date,
      incidentTime: String,
      incidentLocation: String,
      incidentDetails: String,

      // Witness information
      witnessName: String,
      witnessAddress: String,
      witnessContact: String,

      // Additional fields
      complaint: String,
      narrative: String,
    },
  },
});

module.exports = mongoose.model("CertificateRequest", CertificateRequestSchema);
