/** @format */

require("dotenv").config();
const { getSupabaseClient } = require("../database/supabaseConfig");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user_model");
const Approval = require("../models/approval_model");
// const OTP = require("../models/otp_ model"); // Temporarily commented out to debug
const Certificate = require("../models/certificate_model");
const { Census } = require("../models/residentData_model"); // FIXED

// Add this new function for checking head of family
const checkHeadOfFamily = async (req, res) => {
  try {
    const { houseNumber, lastName } = req.query;

    if (!houseNumber) {
      return res.status(400).json({
        success: false,
        message: "House number is required",
      });
    }

    if (!lastName) {
      return res.status(400).json({
        success: false,
        message: "Last name is required",
      });
    }

    // Find if there's already a head for this family in the household
    const existingHead = await User.findOne({
      houseNumber: houseNumber.trim(),
      lastName: lastName.trim(),
      isHeadofFamily: true,
    });

    res.status(200).json({
      success: true,
      exists: !!existingHead,
      familySurname: lastName, // Return the family surname for clarity
    });
  } catch (error) {
    console.error("Error checking head of family:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.json({ message: "Please enter all fields" });
    }

    // Check if input is email or phone number
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(phoneNumber);
    
    // Find user by email or phone number
    let user;
    if (isEmail) {
      user = await User.findOne({ email: phoneNumber });
    } else {
      user = await User.findOne({ phoneNumber });
    }

    if (!user) {
      return res.json({ error: true, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ error: true, message: "Incorrect credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const registerUser = async (req, res) => {
  try {
    console.log("🔍 USER REGISTRATION DEBUG:");
    console.log("📝 Request body:", req.body);
    console.log("📁 Request file:", req.file);
    
    const {
      firstName,
      lastName,
      phoneNumber,
      password,
      birthdate,
      address,
      houseNumber,
      isHeadofFamily,
      email,
    } = req.body;

    console.log("📋 Extracted fields:");
    console.log("  firstName:", firstName);
    console.log("  lastName:", lastName);
    console.log("  phoneNumber:", phoneNumber);
    console.log("  email:", email);
    console.log("  password:", password ? "***" : "missing");
    console.log("  birthdate:", birthdate);
    console.log("  address:", address);
    console.log("  houseNumber:", houseNumber);
    console.log("  isHeadofFamily:", isHeadofFamily);

    // ✅ Validate required fields
    if (
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !password ||
      !birthdate ||
      !address ||
      !houseNumber ||
      !email
    ) {
      console.error("❌ VALIDATION FAILED - Missing fields:");
      console.error("  firstName:", !!firstName);
      console.error("  lastName:", !!lastName);
      console.error("  phoneNumber:", !!phoneNumber);
      console.error("  password:", !!password);
      console.error("  birthdate:", !!birthdate);
      console.error("  address:", !!address);
      console.error("  houseNumber:", !!houseNumber);
      console.error("  email:", !!email);
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check for existing user
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser && existingUser.isLoginApproved) {
      return res.json({ message: "Phone number already registered" });
    }

    if (existingUser) {
      const relatedApproval = await Approval.findOne({
        userId: existingUser._id,
      });

      if (relatedApproval && relatedApproval.status === "rejected") {
        await Approval.findByIdAndDelete(relatedApproval._id);
        await User.findByIdAndDelete(existingUser._id);
      }
    }

      // ✅ UPDATED: Check if head of family already exists for this FAMILY
    if (isHeadofFamily === "true" || isHeadofFamily === true) {
      const existingHeadOfFamily = await User.findOne({
        houseNumber: houseNumber.trim(),
        lastName: lastName.trim(), // NEW: Check by last name too
        isHeadofFamily: true,
      });

      if (existingHeadOfFamily) {
        return res.status(400).json({
          message: `The ${lastName} family in this household already has a registered head of the family`,
        });
      }
    }

    // ✅ REQUIRE image for registration
    if (!req.file) {
      console.error("❌ No image file provided - registration requires ID image");
      return res.status(400).json({ 
        success: false,
        message: "ID image is required for registration. Please upload a valid ID." 
      });
    }

    let imageUrl = null;
    let supabasePath = null;
    let imageUploadSuccess = false;
    
    console.log("📁 Image file detected, attempting upload...");
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.error("❌ Supabase client not available");
      return res.status(500).json({ 
        success: false,
        message: "Image upload service is not available. Please try again later or contact support." 
      });
    } else {
      try {
        const fileExt = path.extname(req.file.originalname);
        supabasePath = `valid-ids/id-${phoneNumber}-${Date.now()}${fileExt}`;

        console.log("📦 Attempting to upload to bucket: bms646-app");
        console.log("📦 File path:", supabasePath);

        const { error: uploadError } = await supabase.storage
          .from("bms646-app")
          .upload(supabasePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true,
          });

        if (uploadError) {
          console.error("Supabase Upload Error:", uploadError);
          console.error("❌ Error details:", JSON.stringify(uploadError, null, 2));
          
          // Check if it's a bucket not found error
          if (uploadError.message && uploadError.message.includes("Bucket not found")) {
            return res.status(500).json({ 
              success: false,
              message: "Storage bucket not configured. Please contact administrator to set up Supabase storage." 
            });
          } else if (uploadError.message && uploadError.message.includes("Invalid JWT")) {
            return res.status(500).json({ 
              success: false,
              message: "Invalid Supabase credentials. Please check configuration." 
            });
          } else {
            return res.status(500).json({ 
              success: false,
              message: "Failed to upload ID image: " + (uploadError.message || "Unknown error") 
            });
          }
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("bms646-app")
            .getPublicUrl(supabasePath);

          imageUrl = publicUrlData?.publicUrl;
          imageUploadSuccess = true;
          console.log("✅ Image uploaded successfully:", imageUrl);
        }
      } catch (uploadError) {
        console.error("❌ Image upload failed:", uploadError.message);
        console.error("❌ Full error:", uploadError);
        return res.status(500).json({ 
          success: false,
          message: "Image upload failed: " + (uploadError.message || "Unknown error") 
        });
      }
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Save new user
    const newUser = new User({
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword,
      birthdate: new Date(birthdate),
      address,
      houseNumber: houseNumber.trim(),
      idImage: imageUrl,
      idImagePublicId: supabasePath || null,
      isRegisteredVoter: false,
      isLoginApproved: false,
      isVerified: true,
      isHeadofFamily: isHeadofFamily === "true" || isHeadofFamily === true,
      alreadyAnswered: false,
    });

    await newUser.save();

    // ✅ Only create approval if ID was uploaded
    if (req.file) {
      const newApproval = new Approval({
        userId: newUser._id,
        status: "pending",
      });

      await newApproval.save();
    }

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.status(201).json({
      success: true,
      message: "Registration successful. Wait for admin approval.",
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phoneNumber: newUser.phoneNumber,
        email: newUser.email,
        isLoginApproved: newUser.isLoginApproved,
        isRegisteredVoter: newUser.isRegisteredVoter,
        isVerified: newUser.isVerified,
        isHeadOfFamily: newUser.isHeadOfFamily,
        alreadyAnswered: newUser.alreadyAnswered,
      },
      token,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
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

    const user = await User.findById(userId);
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

const forgotChangePassword = async (req, res) => {
  try {
    const { phoneNumber, newPassword, confirmNewPassword } = req.body;

    if (!phoneNumber || !newPassword || !confirmNewPassword) {
      return res.json({ success: false, message: "All fields are required." });
    }

    if (newPassword !== confirmNewPassword) {
      return res.json({
        success: false,
        message: "New passwords do not match.",
      });
    }

    const user = await User.findOne({ phoneNumber });

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

const forgotPassword = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // ✅ Call OTP sender and pass user's email
    const result = await sendOTPforgot({ phoneNumber });

    if (result.success) {
      return res.status(200).json({
        message: "OTP sent successfully (SMS temporarily disabled).",
        otpForTesting: result.otpCode, // remove in production
      });
    } else {
      return res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const getUserCertificateActivity = async (req, res) => {
  try {
    const userId = req.user.userId;

    const activity = await Certificate.find({ userId }).sort({
      createdAt: -1,
    });

    // Map enum values to full certificate names
    const certificateTypeMap = {
      clearance: "Barangay Clearance",
      residency: "Certificate of Residency",
      indigency: "Certificate of Indigency",
    };

    // Format each activity
    const formattedActivity = activity.map((item) => {
      const formattedDate = new Date(item.createdAt).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      // Get the full certificate name or fallback to original if not in map
      const certificateName =
        certificateTypeMap[item.certificateType.toLowerCase()] ||
        item.certificateType;

      const description = `for ${item.purpose}`;

      return {
        _id: item._id,
        certificateType: certificateName, // Now returns full name
        dateRequested: formattedDate, // "May 10, 2023"
        status: item.status, // "Pending", "Approved", "Rejected"
        description: description, // "Barangay Clearance for employment"
      };
    });

    res.status(200).json({ activity: formattedActivity });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware

    const user = await User.findById(userId).select(
      "firstName lastName phoneNumber email address houseNumber birthdate createdAt notificationPreferences isVerified alreadyAnswered isHeadofFamily idImage"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Date formatting options: "July 8, 2025"
    const formatOptions = { year: "numeric", month: "long", day: "numeric" };

    res.json({
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      contact: user.phoneNumber,
      address: user.address,
      houseNumber: user.houseNumber,
      birthdate: user.birthdate
        ? new Date(user.birthdate).toLocaleDateString("en-US", formatOptions)
        : null,
      registrationDate: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", formatOptions)
        : null,
      notificationPreferences: user.notificationPreferences || {
        events: true,
        certificates: true,
        announcements: true,
      },
      isVerified: user.isVerified,
      alreadyAnswered: user.alreadyAnswered,
      isHeadofFamily: user.isHeadofFamily,
      idImage: user.idImage,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find user first
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    // Delete related Approval record
    await Approval.findOneAndDelete({ userId });

    // Delete related OTP record (based on phone number)
    await OTP.findOneAndDelete({ phoneNumber: user.phoneNumber });

    res.status(200).json({
      success: true,
      message: "User account and related records deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting resident:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: preferences },
      { new: true, select: "notificationPreferences" }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ preferences: user.notificationPreferences });
  } catch (error) {
    console.error("Update Notification Error:", error);
    res
      .status(500)
      .json({ message: "Server error while updating preferences" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        "firstName lastName phoneNumber birthdate address houseNumber isRegisteredVoter isLoginApproved isVerified idImage createdAt isHeadofFamily"
      )
      .sort({ createdAt: -1 });

    // Format the data for admin view
    const formattedUsers = users.map((user) => ({
      _id: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      phoneNumber: user.phoneNumber,
      birthdate: user.birthdate,
      address: user.address,
      houseNumber: user.houseNumber,
      isHeadofFamily: user.isHeadofFamily,
      isRegisteredVoter: user.isRegisteredVoter,
      isLoginApproved: user.isLoginApproved,
      isVerified: user.isVerified,
      idImage: user.idImage,
      registrationDate: user.createdAt,
      status: user.isLoginApproved ? "Approved" : "Pending",
    }));

     const totalCensusCount = await Census.countDocuments();

    res.status(200).json({
      success: true,
      totalCensusCount, // ADD THIS LINE
      users: formattedUsers,
      total: users.length,
      
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

const submitID = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ pulled from JWT middleware

    if (!req.file) {
      return res.status(400).json({ message: "ID image is required" });
    }

    // ✅ Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Remove previous approvals for this user
    await Approval.deleteMany({ userId });

    // ✅ Upload new image to Supabase
    const fileExt = path.extname(req.file.originalname);
    const supabasePath = `valid-ids/id-${userId}-${Date.now()}${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("bms646-app")
      .upload(supabasePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError.message);
      return res.status(500).json({ message: "Failed to upload ID image" });
    }

    const { data: publicUrlData } = supabase.storage
      .from("bms646-app")
      .getPublicUrl(supabasePath);

    const imageUrl = publicUrlData?.publicUrl;

    // ✅ Create new approval record
    const newApproval = new Approval({
      userId,
      status: "pending",
      idImage: imageUrl,
      idImagePublicId: supabasePath,
    });

    await newApproval.save();

    // ✅ Update user status instantly (optional but useful for frontend)
    user.idImage = imageUrl;
    user.idImagePublicId = supabasePath;
    await user.save();

    res.status(201).json({
      success: true,
      message: "ID submitted successfully. Waiting for admin approval.",
      approval: newApproval,
    });
  } catch (error) {
    console.error("Error in submitID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch household info for the logged-in user (head and members)
const getUserHouseholdInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("address houseNumber");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { address, houseNumber } = user;
    if (!address || !houseNumber) {
      return res
        .status(400)
        .json({ message: "User address and house number are required" });
    }

    // Find all users in the same household (approved only)
    const householdUsers = await User.find({
      address,
      houseNumber,
      isLoginApproved: true,
    }).select(
      "firstName lastName phoneNumber birthdate address houseNumber idImage"
    );

    // Get census data for all household members
    const householdMembers = await Census.find({
      userId: { $in: householdUsers.map((u) => u._id) },
    })
      .populate(
        "userId",
        "firstName lastName phoneNumber birthdate address houseNumber idImage"
      )
      .select(
        "userId fullName age sex civilStatus occupation employmentStatus voterStatus isHeadOfFamily"
      );

    // Format members
    const formattedMembers = householdUsers.map((user) => {
      const censusData = householdMembers.find(
        (member) => member.userId._id.toString() === user._id.toString()
      );
      return {
        id: user._id,
        fullName: censusData?.fullName || `${user.firstName} ${user.lastName}`,
        age: censusData?.age || calculateAgeFromBirthdate(user.birthdate),
        sex: censusData?.sex || "Not Specified",
        civilStatus: censusData?.civilStatus || "Not Specified",
        occupation: censusData?.occupation || "Not Specified",
        employmentStatus: censusData?.employmentStatus || "Not Specified",
        voterStatus: censusData?.voterStatus || "Not Specified",
        isHeadOfFamily: censusData?.isHeadOfFamily || false,
        phoneNumber: user.phoneNumber,
        birthdate: user.birthdate,
        address: user.address,
        houseNumber: user.houseNumber,
        image: user.idImage || "https://via.placeholder.com/150",
        hasCensusData: !!censusData,
      };
    });

    // Find head of family
    const headOfFamily = formattedMembers.find((m) => m.isHeadOfFamily);

    res.status(200).json({
      message: "Household info retrieved successfully",
      address,
      houseNumber,
      headOfFamily: headOfFamily
        ? {
            userId: headOfFamily.id,
            name: headOfFamily.fullName,
            phoneNumber: headOfFamily.phoneNumber,
          }
        : null,
      members: formattedMembers,
      totalMembers: formattedMembers.length,
      membersWithCensusData: formattedMembers.filter((m) => m.hasCensusData)
        .length,
    });
  } catch (error) {
    console.error("Get User Household Info Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to calculate age from birthdate
const calculateAgeFromBirthdate = (birthdate) => {
  if (!birthdate) return "N/A";
  const birthDate = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

const userCencus = async (req, res) => {
  res.status(200).json({ message: "Not implemented" });
};

const addHouseholdMember = async (req, res) => {
  try {
    console.log("=== ADD HOUSEHOLD MEMBER START ===");
    console.log("Raw request body:", req.body);
    console.log("Request body keys:", Object.keys(req.body));
    
    const userId = req.user.userId;
    console.log("User ID:", userId);
    
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      birthdate,
      sex,
      civilStatus,
      occupation,
      employmentStatus,
      voterStatus
    } = req.body;
    
    console.log("Destructured values:", { 
      firstName: firstName ? `"${firstName}"` : 'undefined',
      lastName: lastName ? `"${lastName}"` : 'undefined', 
      email: email ? `"${email}"` : 'undefined',
      phoneNumber: phoneNumber ? `"${phoneNumber}"` : 'undefined',
      birthdate: birthdate ? `"${birthdate}"` : 'undefined',
      sex: sex ? `"${sex}"` : 'undefined',
      civilStatus: civilStatus ? `"${civilStatus}"` : 'undefined',
      occupation: occupation ? `"${occupation}"` : 'undefined',
      employmentStatus: employmentStatus ? `"${employmentStatus}"` : 'undefined',
      voterStatus: voterStatus ? `"${voterStatus}"` : 'undefined'
    });
    console.log("Email value received:", email);
    console.log("Email type:", typeof email);
    console.log("Email is truthy:", !!email);

    console.log("Finding current user...");
    const currentUser = await User.findById(userId);
    console.log("Current user found:", currentUser ? "YES" : "NO");
    
    if (!currentUser) {
      console.log("ERROR: User not found");
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if current user is head of family
    if (!currentUser.isHeadofFamily) {
      console.log("ERROR: User is not head of family");
      return res.status(403).json({
        success: false,
        message: "Only head of family can add household members"
      });
    }

    if (!firstName || !lastName || !email || !phoneNumber || !birthdate) {
      console.log("ERROR: Missing required fields");
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, phone number, and birthdate are required"
      });
    }

    console.log("Checking for existing user with phone number...");
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      console.log("ERROR: Phone number already registered");
      return res.status(400).json({
        success: false,
        message: "Phone number already registered"
      });
    }

    console.log("Checking for existing user with email...");
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log("ERROR: Email already registered");
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    console.log("Generating password and hashing...");
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    console.log("Creating new user...");
    const newMember = new User({
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword,
      birthdate: new Date(birthdate),
      address: currentUser.address,
      houseNumber: currentUser.houseNumber,
      isHeadofFamily: false,
      isLoginApproved: true, 
      isVerified: true,
      isRegisteredVoter: voterStatus === "Registered",
      alreadyAnswered: false,
      notificationPreferences: {
        events: true,
        certificates: true,
        announcements: true,
      },
    });

    console.log("Saving new user...");
    await newMember.save();
    console.log("New user saved successfully");

    console.log("Creating census record...");
    const newCensus = new Census({
      userId: newMember._id,
      fullName: `${firstName} ${lastName}`,
      age: calculateAgeFromBirthdate(birthdate),
      placeOfBirth: "Not Specified", // Default value for household members
      sex: sex || "Male", // Use valid enum value as default
      civilStatus: civilStatus || "Single",
      citizenship: "Filipino", // Default citizenship
      occupation: occupation || "Not Specified",
      employmentStatus: employmentStatus || "Unemployed",
      voterStatus: voterStatus || "Not Registered",
      isHeadOfFamily: false,
      address: currentUser.address,
      houseNumber: currentUser.houseNumber,
      birthdate: new Date(birthdate), // Add birthdate to census
    });

    console.log("Saving census record...");
    await newCensus.save();
    console.log("Census record saved successfully");

    console.log("=== ADD HOUSEHOLD MEMBER SUCCESS ===");
    res.status(201).json({
      success: true,
      message: "Household member added successfully",
      member: {
        id: newMember._id,
        fullName: `${firstName} ${lastName}`,
        phoneNumber,
        tempPassword, 
        address: currentUser.address,
        houseNumber: currentUser.houseNumber,
      },
    });
  } catch (error) {
    console.error("=== ADD HOUSEHOLD MEMBER ERROR ===");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const updateHouseholdMember = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { memberId } = req.params;
    const {
      firstName,
      lastName,
      phoneNumber,
      birthdate,
      sex,
      civilStatus,
      occupation,
      employmentStatus,
      voterStatus
    } = req.body;

    // Check if current user is head of family
    const currentUser = await User.findById(userId);
    if (!currentUser || !currentUser.isHeadofFamily) {
      return res.status(403).json({
        success: false,
        message: "Only head of family can update household members"
      });
    }

    // Validate required fields
    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and phone number are required"
      });
    }

    // Check if member exists and is in the same household
    const memberToUpdate = await User.findById(memberId);
    if (!memberToUpdate) {
      return res.status(404).json({
        success: false,
        message: "Household member not found"
      });
    }

    // Check if member is in the same household
    if (memberToUpdate.address !== currentUser.address || 
        memberToUpdate.houseNumber !== currentUser.houseNumber) {
      return res.status(403).json({
        success: false,
        message: "You can only update members of your household"
      });
    }

    // Check if phone number is already used by another user
    const existingUser = await User.findOne({ 
      phoneNumber, 
      _id: { $ne: memberId } 
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered to another user"
      });
    }

    // Update user information
    memberToUpdate.firstName = firstName;
    memberToUpdate.lastName = lastName;
    memberToUpdate.phoneNumber = phoneNumber;
    if (birthdate) {
      memberToUpdate.birthdate = new Date(birthdate);
    }
    memberToUpdate.isRegisteredVoter = voterStatus === "Registered";
    
    await memberToUpdate.save();

    // Update census information
    const Census = require("../models/residentData_model").Census;
    const censusData = await Census.findOne({ userId: memberId });
    
    if (censusData) {
      censusData.fullName = `${firstName} ${lastName}`;
      if (birthdate) {
        censusData.age = calculateAgeFromBirthdate(birthdate);
      }
      censusData.sex = sex || censusData.sex;
      censusData.civilStatus = civilStatus || censusData.civilStatus;
      censusData.occupation = occupation || censusData.occupation;
      censusData.employmentStatus = employmentStatus || censusData.employmentStatus;
      censusData.voterStatus = voterStatus || censusData.voterStatus;
      
      await censusData.save();
    }

    res.status(200).json({
      success: true,
      message: "Household member updated successfully",
      member: {
        id: memberToUpdate._id,
        fullName: `${firstName} ${lastName}`,
        phoneNumber,
        address: memberToUpdate.address,
        houseNumber: memberToUpdate.houseNumber,
      },
    });
  } catch (error) {
    console.error("Error updating household member:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteHouseholdMember = async (req, res) => {
  try {
    console.log("DELETE HOUSEHOLD MEMBER - Request received");
    console.log("Params:", req.params);
    console.log("User ID:", req.user.userId);
    
    const userId = req.user.userId;
    const { memberId } = req.params;

    // Check if current user is head of family
    const currentUser = await User.findById(userId);
    if (!currentUser || !currentUser.isHeadofFamily) {
      return res.status(403).json({
        success: false,
        message: "Only head of family can delete household members"
      });
    }

    // Check if member exists and is in the same household
    const memberToDelete = await User.findById(memberId);
    if (!memberToDelete) {
      return res.status(404).json({
        success: false,
        message: "Household member not found"
      });
    }

    // Check if member is in the same household
    if (memberToDelete.address !== currentUser.address || 
        memberToDelete.houseNumber !== currentUser.houseNumber) {
      return res.status(403).json({
        success: false,
        message: "You can only delete members of your household"
      });
    }

    // Prevent deleting the head of family
    if (memberToDelete.isHeadofFamily) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the head of family"
      });
    }

    // Delete census data
    const Census = require("../models/residentData_model").Census;
    await Census.deleteOne({ userId: memberId });

    // Delete user
    await User.findByIdAndDelete(memberId);

    res.status(200).json({
      success: true,
      message: "Household member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting household member:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const updateDataCollectionConsent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { consent } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update user's data collection consent
    user.dataCollectionConsent = consent;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Data collection consent updated successfully",
      consent: consent
    });
  } catch (error) {
    console.error("Error updating data collection consent:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

module.exports = {
  loginUser,
  registerUser,
  changePassword,
  forgotChangePassword,
  forgotPassword,
  getUserProfile,
  getUserCertificateActivity,
  deleteUser,
  updateNotificationPreferences,
  getAllUsers,
  submitID,
  userCencus, 
  checkHeadOfFamily,
  getUserHouseholdInfo,
  addHouseholdMember,
  updateHouseholdMember,
  deleteHouseholdMember,
  updateDataCollectionConsent,
};
