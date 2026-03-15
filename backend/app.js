/** @format */

// app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./APP/database/mongodb");
const startAnnouncementCron = require("./APP/middleware/cronjobs");

const app = express();
connectDB.mongodb(); // Connect to MongoDB
startAnnouncementCron();

const allowedOrigins = [
  "https://barangay646.vercel.app",
  "https://barangay646.com",
  "https://www.barangay646.com",
  "http://localhost:5173",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
}));


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan("dev"));

// Import Routes
const adminRoutes = require("./APP/routers/admin_router");
const userRoutes = require("./APP/routers/user_router");
const otpRoutes = require("./APP/routers/otp_router");
const certificateRoutes = require("./APP/routers/certificate_router");
const eventRoutes = require("./APP/routers/event_router");
const announceRoutes = require("./APP/routers/announcement_router");
const cencusRoutes = require("./APP/routers/cencus_router");
const residentDataRoutes = require("./APP/routers/residentData_router");
const aboutPageRoutes = require("./APP/routers/aboutPage_router");


// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/certificate", certificateRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/announcement", announceRoutes);
app.use("/api/barangay", cencusRoutes);
app.use("/api/resident-data", residentDataRoutes);
app.use("/api/about", aboutPageRoutes);

app.get("/", (req, res) => {
  res.json({ data: "Hello from server" });
});

module.exports = app;
