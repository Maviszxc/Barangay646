/** @format */

const mongoose = require("mongoose");

const aboutPageSchema = new mongoose.Schema({
  // Hero Section
  heroTitle: {
    type: String,
    default: "About Our Barangay",
  },
  heroDescription: {
    type: String,
    default: "Learn about our community, leadership, and the principles that guide our service to residents",
  },
  heroImageUrl: {
    type: String,
    default: "",
  },

  // History Section
  historyTitle: {
    type: String,
    default: "Barangay History",
  },
  historyContent: {
    type: [String],
    default: [
      "Barangay 646 Zone 67 is one of the 12 barangays situated in San Miguel of District VI, Manila, a neighborhood of Malacañang Palace.",
      "The name San Miguel was added by the Augustinian missionaries who selected Michael the Archangel as the patron saint of the area. St. Michael, the Archangel commemorates the spirit warrior in the battle of good and evil. He is considered a champion of justice, a healer of the sick, and the guardian of the Church. September 29 is the \"Feast of St. Michael and the Archangels\".",
      "Barangay 646 is one of the 896 barangays of the City of Manila within the administrative district of San Miguel, Zone 67, District VI.",
    ],
  },

  // Vision & Mission
  vision: {
    type: String,
    default: "To promote efficiency and transparency in government with regards to the manner of transacting with the public Citizens.",
  },
  mission: {
    type: String,
    default: "To ensure quality public service by local government to citizens.",
  },

  // Officials Section
  officials: {
    type: [
      {
        name: String,
        position: String,
        imageUrl: String,
      },
    ],
    default: [
      {
        name: "Roel S. Floro",
        position: "Barangay Captain",
        imageUrl: "/src/assets/chairman.jpg",
      },
      {
        name: "Raquel F. Villanueva",
        position: "Barangay Secretary",
        imageUrl: "/src/assets/Raquel.png",
      },
      {
        name: "Ma. Elena A. Xavier",
        position: "Barangay Treasurer",
        imageUrl: "/src/assets/Ma.Elena.png",
      },
    ],
  },

  // Kagawads Section
  kagawads: {
    type: [
      {
        name: String,
        committee: String,
        position: String,
        imageUrl: String,
      },
    ],
    default: [
      {
        name: "Charito T. Flores",
        committee: "Health & Sanitation Committee",
        position: "Kagawad – 1",
        imageUrl: "/src/assets/Charito.png",
      },
      {
        name: "Raymundo M. Floro",
        committee: "Health & Sanitation Committee",
        position: "Kagawad – 2",
        imageUrl: "/src/assets/Raymundo.png",
      },
      {
        name: "Olimpio F. Vidallo Jr.",
        committee: "Education Committee",
        position: "Kagawad – 3",
        imageUrl: "/src/assets/Olimpio.png",
      },
      {
        name: "Kastine F. Villanueva",
        committee: "Social Services Committee",
        position: "Kagawad – 4",
        imageUrl: "/src/assets/Kastine.png",
      },
      {
        name: "Jessel P. Jarilla",
        committee: "Infrastructure Committee",
        position: "Kagawad – 5",
        imageUrl: "/src/assets/Jessel.png",
      },
      {
        name: "Conchita P. Barretto",
        committee: "Women & Family Welfare Committee",
        position: "Kagawad – 6",
        imageUrl: "/src/assets/Chonchita.png",
      },
      {
        name: "Tomas S. Tecson",
        committee: "Youth & Sports Development Committee",
        position: "Kagawad – 7",
        imageUrl: "/src/assets/Tomas.png",
      },
    ],
  },

  // Core Values
  coreValues: {
    type: [
      {
        title: String,
        description: String,
        icon: String, // SVG path or icon name
      },
    ],
    default: [
      {
        title: "Integrity",
        description: "We uphold honesty, accountability, and transparency in all our actions and decisions to maintain public trust.",
        icon: "shield",
      },
      {
        title: "Service",
        description: "We prioritize the welfare of our constituents through quality, efficient, and effective service delivery to improve quality of life.",
        icon: "users",
      },
      {
        title: "Progress",
        description: "We commit to continuous improvement, sustainable development, and creating a self-reliant community with empowered citizens.",
        icon: "trending-up",
      },
    ],
  },

  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
});

// Create a singleton pattern - only one document should exist
aboutPageSchema.statics.getAboutContent = async function () {
  let content = await this.findOne();
  if (!content) {
    content = await this.create({});
  }
  return content;
};

module.exports = mongoose.model("AboutPage", aboutPageSchema);
