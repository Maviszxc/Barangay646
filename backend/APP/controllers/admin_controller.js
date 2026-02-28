/** @format */

const bcrypt = require("bcryptjs");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin_model");
const Approval = require("../models/approval_model");
const User = require("../models/user_model");
const AdminActivityLog = require("../models/adminActivity_model");
const CertificateRequest = require("../models/certificate_model");
const OTP = require("../models/otp_ model");
const { Census } = require("../models/residentData_model"); // FIXED

const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Incorrect credentials" });
    }

    const token = jwt.sign(
      { userId: admin._id },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      role: admin.role,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const addAdmin = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({
      username,
      password: hashedPassword,
      role,
    });

    await newAdmin.save();

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        _id: newAdmin._id,
        username: newAdmin.username,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const addResident = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      password,
      birthdate,
      address,
      houseNumber, // ADD THIS
      gender,
    } = req.body;

    // Validate required fields - UPDATE THIS
    if (
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !password ||
      !birthdate ||
      !address ||
      !houseNumber || // ADD THIS
      !gender
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check for existing user
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Phone number already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&].{8,}$/;
    
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
      });
    }

    // Save new user (automatically approved) - UPDATE THIS
    const newUser = new User({
      firstName,
      lastName,
      phoneNumber,
      password: hashedPassword,
      birthdate: new Date(birthdate),
      address,
      houseNumber, // ADD THIS
      gender,
      isRegisteredVoter: false,
      isLoginApproved: true, // Automatically approved
      isVerified: true,
      idImage:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6osZxTf5OTMbYfm1MPFdArBKQsVltUu-Re_JPAd7IPiVx8NjCioLBqU8DIv_PgIUwwig&usqp=CAU", // Default placeholder image
      idImagePublicId: "placeholder", // Default placeholder
    });

    await newUser.save();

    // ✅ Create OTP record (dummy since no verification needed)
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry
    await OTP.create({
      phoneNumber,
      otp: "000000", // Dummy OTP
      verified: true,
      expiresAt: otpExpiry,
    });

    // ✅ Create Approval record (auto-approved)
    await Approval.create({
      userId: newUser._id,
      status: "approved",
      rejectionMessage: [], // No rejection message
    });

    res.status(201).json({
      success: true,
      message: "Resident added successfully",
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phoneNumber: newUser.phoneNumber,
        address: newUser.address,
        houseNumber: newUser.houseNumber, // ADD THIS
      },
    });
  } catch (error) {
    console.error("Error in addResident:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllResidences = async (req, res) => {
  try {
    const approvedUsers = await User.find({ isLoginApproved: true })
      .select("-password") // exclude password
      .sort({ createdAt: -1 }); // optional: newest first

    res.status(200).json({
      message: "Approved residents retrieved successfully",
      count: approvedUsers.length,
      data: approvedUsers,
    });
  } catch (error) {
    console.error("Error fetching approved residents:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPendingApprovals = async (req, res) => {
  // Changed
  try {
    const approvals = await Approval.aggregate([
      {
        $match: { status: "pending" },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $sort: { submittedAt: -1 },
      },
    ]);

    res.status(200).json({
      message: "Pending approvals retrieved successfully",
      count: approvals.length,
      data: approvals,
    });
  } catch (error) {
    console.error("Error getting pending approvals:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const approveUserRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ 
        message: "Authentication required. Please login as admin." 
      });
    }

    console.log("adminId", userId);
    
    // Find approval
    const approval = await Approval.findById(id);
    if (!approval) {
      return res.json({ message: "Approval request not found" });
    }

    // Approve user login
    await User.findByIdAndUpdate(approval.userId, {
      isLoginApproved: true,
    });

    // Update approval status
    approval.status = "approved";
    await approval.save();
    await AdminActivityLog.create({
      adminId: userId, // assuming admin is authenticated
      userId: approval.userId, // user who was rejected
      actionType: "UserApproval",
    });

    res.status(200).json({ message: "User request approved successfully" });
  } catch (error) {
    console.error("Error approving user request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.json({ success: false, message: "All fields are required." });
    }

    if (newPassword !== confirmNewPassword) {
      return res.json({
        success: false,
        message: "New passwords do not match.",
      });
    }

    const user = await Admin.findById(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const rejectUserRequest = async (req, res) => {
  try {
    const { id } = req.params; // approval document ID
    const { rejectionMessages } = req.body; // expect array of reasons
    const adminId = req.user.userId;

    if (!Array.isArray(rejectionMessages) || rejectionMessages.length === 0) {
      return res.json({
        message: "At least one rejection reason is required.",
      });
    }

    // Find the approval document
    const approval = await Approval.findById(id);
    if (!approval) {
      return res.json({ message: "Approval request not found" });
    }

    const user = await User.findById(approval.userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found for this approval" });
    }

    const userNumber = await OTP.findOne({ phoneNumber: user.phoneNumber });
    if (!userNumber) {
      return res.json({ message: "number not found" });
    }

    if (approval.status === "rejected") {
      return res.json({ message: "User request is already rejected." });
    }

    // Update status and reasons
    approval.status = "rejected";
    approval.rejectionMessage = rejectionMessages;
    await approval.save();

    userNumber.verified = false;
    await userNumber.save();

    // Log the admin action
    await AdminActivityLog.create({
      adminId,
      userId: approval.userId,
      actionType: "UserRejection",
      reason: rejectionMessages.join(", "), // Optional: store joined string
    });

    res.status(200).json({
      message: "User request rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting user request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAdminActivityLogs = async (req, res) => {
  try {
    const logs = await AdminActivityLog.find()
      .sort({ createdAt: -1 }) // recent first
      .populate("adminId", "role") // populate only the role of the admin
      .populate("userId", "firstName lastName"); // populate user's name

    const formattedLogs = await Promise.all(
      logs.map(async (log) => {
        const { actionType, certificateType, EventTitle, reason, createdAt } =
          log;
        const adminRole = log.adminId?.role || "Admin";
        const userName = log.userId
          ? `${log.userId.firstName} ${log.userId.lastName}`
          : "Unknown User";
        const formattedDate = new Date(createdAt).toLocaleDateString("en-US");

        let message = "";

        switch (actionType) {
          case "UserApproval":
            message = `${adminRole} approved ${userName}'s signup `;
            break;
          case "UserRejection":
            message = `${adminRole} has rejected ${userName}'s signup `;
            break;
          case "CertificateApproval":
            message = `${adminRole} has approved the certificate request of ${certificateType} for ${userName} `;
            break;
          case "CertificateRejection":
            message = `${adminRole} has rejected the certificate request of ${certificateType} for ${userName} `;
            break;
          case "PostEvent":
            message = `${adminRole} has posted an event: ${EventTitle} `;
            break;
          case "UPDATE_BLOTTER_STATUS":
            message = `${adminRole} has updated e-blotter status for ${userName} `;
            break;
          case "UPDATE_CONTENT":
            message = `${adminRole} has updated content `;
            break;
          case "UpdateAboutPage":
            message = `${adminRole} has updated about page `;
            break;
          default:
            message = `${adminRole} performed an action for ${userName} `;
        }

        return {
          // actionType,
          // userName,
          // adminRole,
          // certificateType: certificateType || null,
          // reason: reason || null,
          // date: formattedDate,
          message,
          createdAt: log.createdAt, // Changed
        };
      })
    );

    res.status(200).json({
      message: "Successfully fetched admin activity logs",
      count: formattedLogs.length,
      data: formattedLogs,
    });
  } catch (error) {
    console.error("Error fetching admin logs:", error);
    res.status(500).json({
      message: "Server error fetching admin activity logs",
      error: error.message,
    });
  }
};

const getRecentRequest = async (req, res) => {
  try {
    const request = await CertificateRequest.find().populate(
      "userId",
      "firstName lastName"
    );

    const formattedRequests = request.map((request) => {
      const timeElapsed = dayjs().to(dayjs(request.createdAt), true);

      return {
        certificateType: request.certificateType,
        status: request.status,
        timeElapsed: timeElapsed,
        user:
          request.userId?.firstName + " " + request.userId?.lastName ||
          "Unknown",
      };
    });

    res.status(200).json({
      message: "Certificate requests fetched successfully",
      data: formattedRequests,
    });
  } catch (error) {
    console.error("Error fetching recent requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAdminProfile = async (req, res) => {
  // Changed
  try {
    const adminId = req.user.userId;
    const admin = await Admin.findById(adminId).select("-password");

    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        name: admin.username,
        email: admin.username + "@bms646.gov.ph", // Mock email based on username
        role: admin.role,
        permissions: [
          "Manage Residents",
          "Approve Requests",
          "Generate Reports",
          "Manage Events",
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateAdminProfile = async (req, res) => {
  // Changed
  try {
    const adminId = req.user.userId;
    const { name } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    // Update only the username field for now
    admin.username = name;
    await admin.save();

    res.status(200).json({
      success: true,
      data: {
        name: admin.username,
        email: admin.username + "@bms646.gov.ph", // Mock email based on username
        role: admin.role,
        permissions: [
          "Manage Residents",
          "Approve Requests",
          "Generate Reports",
          "Manage Events",
        ],
      },
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateAccountStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accountStatus } = req.body;

    console.log('=== DEBUGGING ACCOUNT STATUS UPDATE ===');
    console.log('Full req.params:', req.params);
    console.log('Full req.body:', req.body);
    console.log('Extracted userId:', userId);
    console.log('Extracted accountStatus:', accountStatus);
    console.log('Type of accountStatus:', typeof accountStatus);

    // Validate input
    const validStatuses = ["Active", "Inactive", "Deceased"];
    console.log('Valid statuses:', validStatuses);
    console.log('Is valid:', validStatuses.includes(accountStatus));
    
    if (!validStatuses.includes(accountStatus)) {
      console.log('Validation failed for status:', accountStatus);
      return res.status(400).json({
        success: false,
        message: 'Invalid account status. Must be "Active", "Inactive", or "Deceased"',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update account status
    user.accountStatus = accountStatus;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Account status updated to ${accountStatus}`,
      data: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error("Error updating account status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update account status",
    });
  }
};

// Update resident data
const updateResident = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert birthdate to Date object if provided
    if (updateData.birthdate) {
      updateData.birthdate = new Date(updateData.birthdate);
    }

    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phoneNumber: updateData.phoneNumber,
        birthdate: updateData.birthdate,
        address: updateData.address,
        gender: updateData.gender,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update census data
    const updatedCensus = await Census.findOneAndUpdate(
      { userId: id },
      {
        fullName: `${updateData.firstName} ${updateData.lastName}`,
        birthdate: updateData.birthdate,
        sex: updateData.gender,
        civilStatus: updateData.civilStatus,
        occupation: updateData.occupation,
        employmentStatus: updateData.employmentStatus,
        voterStatus: updateData.voterStatus,
        isHeadOfFamily: updateData.isHeadOfFamily,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Resident updated successfully",
      data: {
        user: updatedUser,
        census: updatedCensus,
      },
    });
  } catch (error) {
    console.error("Error updating resident:", error);
    res.status(500).json({
      success: false,
      message: "Error updating resident",
      error: error.message,
    });
  }
};

// Delete resident
const deleteResident = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user first
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Store phoneNumber for OTP deletion
    const userPhoneNumber = user.phoneNumber;

    // Delete user
    await User.findByIdAndDelete(id);

    // Delete associated census data
    await Census.findOneAndDelete({ userId: id });

    // Delete associated approvals
    await Approval.findOneAndDelete({ userId: id });

    // Delete associated OTP records
    await OTP.findOneAndDelete({ phoneNumber: userPhoneNumber });

    // Optional: Delete any certificate requests
    await CertificateRequest.deleteMany({ userId: id });

    res.json({
      success: true,
      message: "Resident and all associated records deleted successfully",
      data: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
      },
    });
  } catch (error) {
    console.error("Error deleting resident:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting resident",
      error: error.message,
    });
  }
};

// Get resident details with census data
const getResidentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const censusData = await Census.findOne({ userId: id });

    res.json({
      success: true,
      data: {
        user: user,
        census: censusData,
      },
    });
  } catch (error) {
    console.error("Error fetching resident details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching resident details",
      error: error.message,
    });
  }
};

const getMonthlyRequests = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Aggregate certificate requests by month for the current year
    const monthlyData = await CertificateRequest.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Create a map of all months with default count 0
    const allMonths = [
      { month: "Jan", count: 0 },
      { month: "Feb", count: 0 },
      { month: "Mar", count: 0 },
      { month: "Apr", count: 0 },
      { month: "May", count: 0 },
      { month: "Jun", count: 0 },
      { month: "Jul", count: 0 },
      { month: "Aug", count: 0 },
      { month: "Sep", count: 0 },
      { month: "Oct", count: 0 },
      { month: "Nov", count: 0 },
      { month: "Dec", count: 0 },
    ];

    // Update counts for months that have data
    monthlyData.forEach((item) => {
      const monthIndex = item._id - 1; // MongoDB months are 1-12
      if (monthIndex >= 0 && monthIndex < 12) {
        allMonths[monthIndex].count = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: allMonths,
    });
  } catch (error) {
    console.error("Error fetching monthly requests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching monthly requests data",
      error: error.message,
    });
  }
};

const getMonthlyRequestsByYear = async (req, res) => {
  try {
    const year = parseInt(req.params.year);

    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid year provided",
      });
    }

    const monthlyData = await CertificateRequest.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const allMonths = [
      { month: "Jan", count: 0 },
      { month: "Feb", count: 0 },
      { month: "Mar", count: 0 },
      { month: "Apr", count: 0 },
      { month: "May", count: 0 },
      { month: "Jun", count: 0 },
      { month: "Jul", count: 0 },
      { month: "Aug", count: 0 },
      { month: "Sep", count: 0 },
      { month: "Oct", count: 0 },
      { month: "Nov", count: 0 },
      { month: "Dec", count: 0 },
    ];

    monthlyData.forEach((item) => {
      const monthIndex = item._id - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        allMonths[monthIndex].count = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: allMonths,
      year: year,
    });
  } catch (error) {
    console.error("Error fetching monthly requests by year:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching monthly requests data",
      error: error.message,
    });
  }
};

// Helper function to log admin activities
const logAdminActivity = async (adminId, message) => {
  try {
    await AdminActivityLog.create({
      adminId,
      actionType: "UpdateContent",
      reason: message,
    });
  } catch (error) {
    console.error("Error logging admin activity:", error);
  }
};

module.exports = {
  loginAdmin,
  addAdmin,
  getAllResidences,
  getPendingApprovals,
  approveUserRequest,
  rejectUserRequest,
  getAdminActivityLogs,
  changePassword,
  getRecentRequest,
  addResident,
  getAdminProfile, // Changed
  updateAdminProfile, // Changed
  updateAccountStatus,
  updateResident, // Add this
  deleteResident, // Add this
  getResidentDetails, // Add this
  getMonthlyRequests,
  getMonthlyRequestsByYear,
  logAdminActivity,
};
