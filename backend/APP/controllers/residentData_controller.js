// [file name]: residentData_controller.js
/** @format */

const { Census, Family } = require("../models/residentData_model"); // CHANGED
const User = require("../models/user_model");

// ✅ Save Census Data (ORIGINAL FUNCTION)
const findOrCreateFamily = async (user, lastName, houseNumber) => {
  try {
    const householdId = `${user.address}|${houseNumber}`;
    
    // Find existing family with same surname in this household
    const existingFamily = await Family.findOne({
      householdId: householdId,
      surname: lastName
    });

    if (existingFamily) {
      return existingFamily;
    }

    // Create new family
    const newFamily = new Family({
      householdId: householdId,
      surname: lastName,
      headUserId: null // Will be set when head is assigned
    });

    await newFamily.save();
    return newFamily;
  } catch (error) {
    console.error("Error in findOrCreateFamily:", error);
    throw error;
  }
};

// ✅ NEW: Get Families in Household
const getHouseholdFamilies = async (req, res) => {
  try {
    const { address, houseNumber } = req.params;

    const householdId = `${address}|${houseNumber}`;
    
    // Find all families in this household
    const families = await Family.find({ householdId })
      .populate('headUserId', 'firstName lastName phoneNumber');

    // Get members for each family
    const familiesWithMembers = await Promise.all(
      families.map(async (family) => {
        const members = await Census.find({ familyId: family._id })
          .populate('userId', 'firstName lastName birthdate phoneNumber');
        
        return {
          familyId: family._id,
          surname: family.surname,
          head: family.headUserId ? {
            userId: family.headUserId._id,
            name: `${family.headUserId.firstName} ${family.headUserId.lastName}`,
            phoneNumber: family.headUserId.phoneNumber
          } : null,
          members: members.map(member => ({
            userId: member.userId._id,
            name: member.fullName,
            age: member.age,
            occupation: member.occupation,
            isHeadOfFamily: member.isHeadOfFamily
          })),
          totalMembers: members.length
        };
      })
    );

    res.status(200).json({
      message: "Household families retrieved successfully",
      data: {
        address,
        houseNumber,
        families: familiesWithMembers,
        totalFamilies: familiesWithMembers.length,
        totalMembers: familiesWithMembers.reduce((sum, family) => sum + family.totalMembers, 0)
      }
    });
  } catch (error) {
    console.error("Get Household Families Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ NEW: Check if family already has a head
const checkFamilyHead = async (familyId) => {
  try {
    const existingHead = await Census.findOne({
      familyId: familyId,
      isHeadOfFamily: true
    });
    return existingHead;
  } catch (error) {
    console.error("Error checking family head:", error);
    throw error;
  }
};

// ✅ UPDATED: Save Census Data with Family Logic
const saveCensusData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const censusData = req.body;

    if (!censusData) {
      return res.status(400).json({
        message: "Census data is required.",
      });
    }

    const {
      placeOfBirth,
      sex,
      sexSpecify,
      civilStatus,
      citizenship,
      occupation,
      employmentStatus,
      voterStatus,
      kasambahayDetails,
      age,
      fullName,
      birthdate,
      isHeadOfFamily,
      dataCollectionConsent,
    } = censusData;

    // Validate required fields
    if (
      !placeOfBirth ||
      !sex ||
      !civilStatus ||
      !citizenship ||
      !occupation ||
      !employmentStatus ||
      !voterStatus
    ) {
      return res.status(400).json({
        message: "All required fields must be filled.",
      });
    }

    // Validate LGBTQ+ specification
    if (sex === "LGBTQ+" && !sexSpecify) {
      return res.status(400).json({
        message: "Please specify your gender identity when selecting LGBTQ+.",
      });
    }

    // Validate kasambahay details if employmentStatus is Kasambahay
    if (employmentStatus === "Kasambahay") {
      if (
        !kasambahayDetails ||
        !kasambahayDetails.educationalAttainment ||
        !kasambahayDetails.natureOfWork ||
        !kasambahayDetails.employmentArrangement ||
        !kasambahayDetails.salary ||
        !kasambahayDetails.employerName ||
        !kasambahayDetails.employerHomeAddress
      ) {
        return res.status(400).json({
          message:
            "All kasambahay details are required when employment status is Kasambahay.",
        });
      }
    }

    // Get user to calculate age and get house number
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // NEW: Find or create family based on last name
    const userLastName = user.lastName;
    const family = await findOrCreateFamily(user, userLastName, user.houseNumber);

    // NEW: Check if trying to set as head of family but family already has one
    if (isHeadOfFamily) {
      const existingHead = await checkFamilyHead(family._id);

      if (existingHead) {
        return res.status(400).json({
          message: "This family already has a head of family",
          existingHead: {
            name: existingHead.fullName,
            familySurname: family.surname,
          },
        });
      }
    }

    // Calculate age
    const birthDate = new Date(user.birthdate);
    const today = new Date();
    let computedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      computedAge--;
    }

    // Check if census data already exists
    let existingCensus = await Census.findOne({ userId });

    if (existingCensus) {
      // If updating to become head of family, check if family already has one
      if (isHeadOfFamily && !existingCensus.isHeadOfFamily) {
        const existingHead = await checkFamilyHead(family._id);

        if (existingHead) {
          return res.status(400).json({
            message: "This family already has a head of family",
            existingHead: {
              name: existingHead.fullName,
              familySurname: family.surname,
            },
          });
        }
      }

      // Update existing data with family info
      existingCensus.placeOfBirth = placeOfBirth;
      existingCensus.sex = sex;
      existingCensus.sexSpecify = sex === "LGBTQ+" ? sexSpecify : "";
      existingCensus.civilStatus = civilStatus;
      existingCensus.citizenship = citizenship;
      existingCensus.occupation = occupation;
      existingCensus.employmentStatus = employmentStatus;
      existingCensus.voterStatus = voterStatus;
      existingCensus.kasambahayDetails =
        employmentStatus === "Kasambahay" ? kasambahayDetails : {};
      existingCensus.age = computedAge;
      existingCensus.fullName = `${user.firstName} ${user.lastName}`;
      existingCensus.birthdate = user.birthdate;
      existingCensus.houseNumber = user.houseNumber;
      existingCensus.isHeadOfFamily = isHeadOfFamily;
      existingCensus.isCompleted = true;
      existingCensus.familyId = family._id; // NEW: Add family reference

      await existingCensus.save();

      // NEW: If this user is head, update the family record
      if (isHeadOfFamily) {
        await Family.findByIdAndUpdate(family._id, {
          headUserId: userId
        });
        
        // Also update user model
        await User.findByIdAndUpdate(userId, {
          isHeadofFamily: true
        });
      }
    } else {
      // Create new census data with family info
      const newCensus = new Census({
        userId,
        familyId: family._id, // NEW: Add family reference
        placeOfBirth,
        sex,
        sexSpecify: sex === "LGBTQ+" ? sexSpecify : "",
        civilStatus,
        citizenship,
        occupation,
        employmentStatus,
        voterStatus,
        kasambahayDetails:
          employmentStatus === "Kasambahay" ? kasambahayDetails : {},
        age: computedAge,
        fullName: `${user.firstName} ${user.lastName}`,
        birthdate: user.birthdate,
        houseNumber: user.houseNumber,
        isHeadOfFamily: isHeadOfFamily,
        isCompleted: true,
      });

      await newCensus.save();
      existingCensus = newCensus;

      // NEW: If this user is head, update the family record
      if (isHeadOfFamily) {
        await Family.findByIdAndUpdate(family._id, {
          headUserId: userId
        });
        
        // Also update user model
        await User.findByIdAndUpdate(userId, {
          isHeadofFamily: true
        });
      }
    }

    // NEW: Update user's family reference
    await User.findByIdAndUpdate(userId, {
      alreadyAnswered: true,
      familyId: family._id
    });

    res.status(201).json({
      message: "Census data saved successfully",
      data: existingCensus,
      family: { // NEW: Return family info
        surname: family.surname,
        id: family._id
      }
    });
  } catch (error) {
    console.error("Save Census Data Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get Census Data for User (ORIGINAL FUNCTION)
const getCensusData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const censusData = await Census.findOne({ userId }).populate(
      "userId",
      "firstName lastName birthdate houseNumber"
    );

    if (!censusData) {
      return res.status(404).json({
        message: "Census data not found",
      });
    }

    res.status(200).json({
      message: "Census data retrieved successfully",
      data: censusData,
    });
  } catch (error) {
    console.error("Get Census Data Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get Census Data Status (ORIGINAL FUNCTION)
const getCensusDataStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const censusData = await Census.findOne({ userId });

    res.status(200).json({
      message: "Census data status retrieved successfully",
      hasCompleted: !!censusData?.isCompleted,
      data: censusData,
    });
  } catch (error) {
    console.error("Get Census Data Status Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get Statistics for Admin (Age Groups) - ENHANCED
const getAgeGroupStatistics = async (req, res) => {
  try {
    const allCensusData = await Census.find().populate(
      "userId",
      "firstName lastName"
    );

    // Age groups
    const ageGroups = {
      "0-17": { count: 0, residents: [] },
      "18-24": { count: 0, residents: [] },
      "25-34": { count: 0, residents: [] },
      "35-44": { count: 0, residents: [] },
      "45-59": { count: 0, residents: [] },
      "60+": { count: 0, residents: [] },
    };

    allCensusData.forEach((census) => {
      const age = census.age;
      let group = "";

      if (age <= 17) group = "0-17";
      else if (age <= 24) group = "18-24";
      else if (age <= 34) group = "25-34";
      else if (age <= 44) group = "35-44";
      else if (age <= 59) group = "45-59";
      else group = "60+";

      if (ageGroups[group]) {
        ageGroups[group].count++;
        ageGroups[group].residents.push({
          name: `${census.fullName}`,
          age: age,
          occupation: census.occupation,
          houseNumber: census.houseNumber,
        });
      }
    });

    res.status(200).json({
      message: "Age group statistics retrieved successfully",
      statistics: ageGroups,
      totalResidents: allCensusData.length,
    });
  } catch (error) {
    console.error("Get Age Group Statistics Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get Employment Statistics (ORIGINAL FUNCTION)
const getEmploymentStatistics = async (req, res) => {
  try {
    const employmentStats = await Census.aggregate([
      {
        $group: {
          _id: "$employmentStatus",
          count: { $sum: 1 },
          residents: {
            $push: {
              name: { $concat: ["$firstName", " ", "$lastName"] },
              occupation: "$occupation",
              houseNumber: "$houseNumber",
            },
          },
        },
      },
    ]);

    res.status(200).json({
      message: "Employment statistics retrieved successfully",
      statistics: employmentStats,
    });
  } catch (error) {
    console.error("Get Employment Statistics Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get Voter Statistics (ORIGINAL FUNCTION)
const getVoterStatistics = async (req, res) => {
  try {
    const voterStats = await Census.aggregate([
      {
        $group: {
          _id: "$voterStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      message: "Voter statistics retrieved successfully",
      statistics: voterStats,
    });
  } catch (error) {
    console.error("Get Voter Statistics Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get Household Statistics (ORIGINAL FUNCTION)
const getHouseholdStatistics = async () => {
  try {
    // Get all approved users with census data
    const usersWithCensus = await User.aggregate([
      {
        $match: {
          isLoginApproved: true,
          address: { $exists: true, $ne: "" },
          houseNumber: { $exists: true, $ne: "" },
        },
      },
      {
        $lookup: {
          from: "censuses",
          localField: "_id",
          foreignField: "userId",
          as: "censusData",
        },
      },
      {
        $project: {
          address: 1,
          houseNumber: 1,
          firstName: 1,
          lastName: 1,
          phoneNumber: 1,
          isHeadofFamily: 1,
          censusData: { $arrayElemAt: ["$censusData", 0] },
        },
      },
    ]);

    // Group by unique households
    const householdMap = new Map();

    usersWithCensus.forEach((user) => {
      const householdKey = `${user.address
        .trim()
        .toLowerCase()}|${user.houseNumber.trim().toLowerCase()}`;

      if (!householdMap.has(householdKey)) {
        householdMap.set(householdKey, {
          address: user.address,
          houseNumber: user.houseNumber,
          members: [],
          headOfFamily: null,
          totalMembers: 0,
          membersWithCensus: 0,
        });
      }

      const household = householdMap.get(householdKey);
      const memberInfo = {
        userId: user._id,
        fullName: `${user.firstName} ${user.lastName}`,
        phoneNumber: user.phoneNumber,
        isHeadOfFamily: user.isHeadofFamily,
        hasCensusData: !!user.censusData,
        age: user.censusData?.age || null,
        occupation: user.censusData?.occupation || "Not specified",
        employmentStatus: user.censusData?.employmentStatus || "Not specified",
      };

      household.members.push(memberInfo);
      household.totalMembers++;

      if (memberInfo.hasCensusData) {
        household.membersWithCensus++;
      }

      if (user.isHeadofFamily && !household.headOfFamily) {
        household.headOfFamily = memberInfo;
      }
    });

    const households = Array.from(householdMap.values());

    return {
      totalHouseholds: households.length,
      totalLoggedInUsers: usersWithCensus.length, // <-- changed from totalResidents
      averageHouseholdSize:
        households.length > 0
          ? (usersWithCensus.length / households.length).toFixed(2)
          : 0,
      households: households.sort((a, b) => b.totalMembers - a.totalMembers),
    };
  } catch (error) {
    console.error("Error getting household statistics:", error);
    throw error;
  }
};

// ✅ Get Gender Statistics (ORIGINAL FUNCTION)
const getGenderStatistics = async (req, res) => {
  try {
    const genderStats = await Census.aggregate([
      {
        $group: {
          _id: "$sex",
          count: { $sum: 1 },
          residents: {
            $push: {
              name: "$fullName",
              age: "$age",
              houseNumber: "$houseNumber",
            },
          },
        },
      },
    ]);

    res.status(200).json({
      message: "Gender statistics retrieved successfully",
      statistics: genderStats,
    });
  } catch (error) {
    console.error("Get Gender Statistics Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get Filtered Statistics (ORIGINAL FUNCTION)
const getFilteredStatistics = async (req, res) => {
  try {
    const { ageGroup, employmentStatus, gender, voterStatus } = req.query;

    let query = {};

    // Age group filter
    if (ageGroup) {
      const ageRanges = {
        "0-17": { $lte: 17 },
        "18-24": { $gte: 18, $lte: 24 },
        "25-34": { $gte: 25, $lte: 34 },
        "35-44": { $gte: 35, $lte: 44 },
        "45-59": { $gte: 45, $lte: 59 },
        "60+": { $gte: 60 },
      };

      if (ageRanges[ageGroup]) {
        query.age = ageRanges[ageGroup];
      }
    }

    // Other filters
    if (employmentStatus) query.employmentStatus = employmentStatus;
    if (gender) query.sex = gender;
    if (voterStatus) query.voterStatus = voterStatus;

    const filteredData = await Census.find(query)
      .populate("userId", "firstName lastName houseNumber")
      .select("age sex employmentStatus voterStatus houseNumber fullName");

    const statistics = {
      total: filteredData.length,
      ageGroups: {
        "0-17": filteredData.filter((d) => d.age <= 17).length,
        "18-24": filteredData.filter((d) => d.age >= 18 && d.age <= 24).length,
        "25-34": filteredData.filter((d) => d.age >= 25 && d.age <= 34).length,
        "35-44": filteredData.filter((d) => d.age >= 35 && d.age <= 44).length,
        "45-59": filteredData.filter((d) => d.age >= 45 && d.age <= 59).length,
        "60+": filteredData.filter((d) => d.age >= 60).length,
      },
      employment: filteredData.reduce((acc, curr) => {
        acc[curr.employmentStatus] = (acc[curr.employmentStatus] || 0) + 1;
        return acc;
      }, {}),
      gender: filteredData.reduce((acc, curr) => {
        acc[curr.sex] = (acc[curr.sex] || 0) + 1;
        return acc;
      }, {}),
      voterStatus: filteredData.reduce((acc, curr) => {
        acc[curr.voterStatus] = (acc[curr.voterStatus] || 0) + 1;
        return acc;
      }, {}),
    };

    res.status(200).json({
      message: "Filtered statistics retrieved successfully",
      data: filteredData,
      statistics: statistics,
      filters: { ageGroup, employmentStatus, gender, voterStatus },
    });
  } catch (error) {
    console.error("Get Filtered Statistics Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Download Census Data (CSV/Excel) (ORIGINAL FUNCTION)
const downloadCensusData = async (req, res) => {
  try {
    const censusData = await Census.find()
      .populate(
        "userId",
        "firstName lastName birthdate phoneNumber address houseNumber"
      )
      .select("-__v");

    // Convert to CSV format
    const headers = [
      "Full Name",
      "Age",
      "Place of Birth",
      "Sex",
      "Civil Status",
      "Citizenship",
      "Occupation",
      "Employment Status",
      "Voter Status",
      "Phone Number",
      "Address",
      "House Number",
      "Head of Family",
    ];

    let csvContent = headers.join(",") + "\n";

    censusData.forEach((census) => {
      const row = [
        `"${census.userId.firstName} ${census.userId.lastName}"`,
        census.age,
        `"${census.placeOfBirth}"`,
        census.sex,
        census.civilStatus,
        census.citizenship,
        `"${census.occupation}"`,
        census.employmentStatus,
        census.voterStatus,
        `"${census.userId.phoneNumber}"`,
        `"${census.userId.address}"`,
        `"${census.userId.houseNumber}"`,
        census.isHeadOfFamily ? "Yes" : "No",
      ];
      csvContent += row.join(",") + "\n";
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=census-data.csv"
    );
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Download Census Data Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// In residentData_controller.js - Update getAllCensusData function
const getAllCensusData = async (req, res) => {
  try {
    const { page = 1, limit = 1000, search = "", startDate, endDate } = req.query;

    // Build base query
    let query = search
      ? {
          $or: [
            { "userId.firstName": { $regex: search, $options: "i" } },
            { "userId.lastName": { $regex: search, $options: "i" } },
            { occupation: { $regex: search, $options: "i" } },
            { houseNumber: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Add date filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z'); // Include entire end date
      }
    }

    // If no search and requesting all data, get all records
    const shouldGetAll = !search && limit === 1000;
    
    const censusData = await Census.find(query)
      .populate(
        "userId",
        "firstName lastName birthdate phoneNumber address houseNumber idImage" // Make sure idImage is included
      )
      .limit(shouldGetAll ? 0 : limit * 1) // 0 means no limit
      .skip(shouldGetAll ? 0 : (page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Census.countDocuments(query);

    res.status(200).json({
      message: "Census data retrieved successfully",
      data: censusData,
      totalPages: shouldGetAll ? 1 : Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get All Census Data Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Check if household already has a head (ORIGINAL FUNCTION)
// ✅ UPDATED: Check Household Head - Now checks by family
const checkHouseholdHead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { houseNumber } = req.body;

    if (!houseNumber) {
      return res.status(400).json({
        message: "House number is required",
      });
    }

    // Get user to determine family
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find user's family
    const family = await findOrCreateFamily(user, user.lastName, houseNumber);
    
    // Check if this family already has a head
    const existingHead = await checkFamilyHead(family._id);

    res.status(200).json({
      message: "Family head check completed",
      hasExistingHead: !!existingHead,
      existingHead: existingHead
        ? {
            name: existingHead.fullName,
            familySurname: family.surname,
          }
        : null,
      familySurname: family.surname, // NEW: Return family surname
    });
  } catch (error) {
    console.error("Check Household Head Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get Census Data for Specific User (Admin) (ORIGINAL FUNCTION)
const getCensusDataByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const censusData = await Census.findOne({ userId }).populate(
      "userId",
      "firstName lastName birthdate houseNumber phoneNumber address"
    );

    if (!censusData) {
      return res.json({
        message: "User not yet answered the census",
      });
    }

    res.status(200).json({
      message: "Census data retrieved successfully",
      data: censusData,
    });
  } catch (error) {
    console.error("Get Census Data by User ID Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get Household Members by Address and House Number (ORIGINAL FUNCTION)
const getHouseholdMembers = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    // Get the target user's address and house number
    const targetUser = await User.findById(userId).select(
      "address houseNumber"
    );

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { address, houseNumber } = targetUser;

    if (!address || !houseNumber) {
      return res.status(400).json({
        message: "User address and house number are required",
      });
    }

    // Find all users with the same address and house number
    const householdUsers = await User.find({
      address: address,
      houseNumber: houseNumber,
      isLoginApproved: true, // Only include approved users
    }).select(
      "firstName lastName phoneNumber birthdate address houseNumber idImage"
    );

    // Get census data for all household members
    const householdMembers = await Census.find({
      userId: { $in: householdUsers.map((user) => user._id) },
    })
      .populate(
        "userId",
        "firstName lastName phoneNumber birthdate address houseNumber idImage"
      )
      .select(
        "userId fullName age sex civilStatus occupation employmentStatus voterStatus isHeadOfFamily"
      );

    // Format the response with both census data and user data
    const formattedMembers = householdUsers.map((user) => {
      // Find census data for this user
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
    const headOfFamily = formattedMembers.find(
      (member) => member.isHeadOfFamily
    );

    res.status(200).json({
      message: "Household members retrieved successfully",
      address: address,
      houseNumber: houseNumber,
      headOfFamily: headOfFamily
        ? {
            userId: headOfFamily.id,
            name: headOfFamily.fullName,
            phoneNumber: headOfFamily.phoneNumber,
          }
        : null,
      members: formattedMembers,
      totalMembers: formattedMembers.length,
      membersWithCensusData: formattedMembers.filter(
        (member) => member.hasCensusData
      ).length,
    });
  } catch (error) {
    console.error("Get Household Members Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Helper function to calculate age from birthdate (ORIGINAL)
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

// ========== NEW ENHANCED FUNCTIONS ========== //

// ✅ Get Total Household Count with Growth Trends (NEW)
const getTotalHouseholds = async (req, res) => {
  try {
    const householdStats = await getHouseholdStatistics();
    const growthTrend = await calculateHouseholdGrowth();

    res.status(200).json({
      message: "Household statistics retrieved successfully",
      data: {
        totalHouseholds: householdStats.totalHouseholds,
        totalLoggedInUsers: householdStats.totalLoggedInUsers, // <-- changed
        averageHouseholdSize: householdStats.averageHouseholdSize,
        growthTrend: growthTrend,
      },
    });
  } catch (error) {
    console.error("Get Household Count Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Calculate Household Growth Trend (NEW)
const calculateHouseholdGrowth = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get current household count
    const currentStats = await getHouseholdStatistics();

    // Get household count from 30 days ago
    const oldHouseholds = await User.aggregate([
      {
        $match: {
          isLoginApproved: true,
          address: { $exists: true, $ne: "" },
          houseNumber: { $exists: true, $ne: "" },
          createdAt: { $lte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            address: "$address",
            houseNumber: "$houseNumber",
          },
        },
      },
      {
        $count: "totalHouseholds",
      },
    ]);

    const previousCount =
      oldHouseholds.length > 0
        ? oldHouseholds[0].totalHouseholds
        : currentStats.totalHouseholds;
    const growth = currentStats.totalHouseholds - previousCount;
    const growthPercentage =
      previousCount > 0 ? ((growth / previousCount) * 100).toFixed(1) : 100;

    return {
      growth: growth,
      growthPercentage: growthPercentage,
      trend: growth >= 0 ? "up" : "down",
    };
  } catch (error) {
    console.error("Growth calculation error:", error);
    return { growth: 0, growthPercentage: 0, trend: "stable" };
  }
};

// Enhanced Household Statistics with Demographic Data (NEW)
const getEnhancedHouseholdStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter if provided
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z'); // Include entire end date
      }
    }
    
    const households = await getHouseholdStatistics();

    // Add demographic breakdown with date filtering
    const demographicStats = await Census.aggregate([
      { $match: dateFilter }, // Add date filter here
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: "$userData",
      },
      {
        $group: {
          _id: {
            address: "$userData.address",
            houseNumber: "$userData.houseNumber",
          },
          members: { $push: "$$ROOT" },
          totalMembers: { $sum: 1 },
          averageAge: { $avg: "$age" },
          genderDistribution: {
            $push: {
              gender: "$sex",
              age: "$age",
            },
          },
          employmentStats: {
            $push: "$employmentStatus",
          },
        },
      },
      {
        $project: {
          address: "$_id.address",
          houseNumber: "$_id.houseNumber",
          totalMembers: 1,
          averageAge: { $round: ["$averageAge", 1] },
          genderBreakdown: {
            male: {
              $size: {
                $filter: {
                  input: "$genderDistribution",
                  as: "person",
                  cond: { $eq: ["$$person.gender", "Male"] },
                },
              },
            },
            female: {
              $size: {
                $filter: {
                  input: "$genderDistribution",
                  as: "person",
                  cond: { $eq: ["$$person.gender", "Female"] },
                },
              },
            },
            lgbtq: {
              $size: {
                $filter: {
                  input: "$genderDistribution",
                  as: "person",
                  cond: { $eq: ["$$person.gender", "LGBTQ+"] },
                },
              },
            },
          },
          employmentBreakdown: {
            employed: {
              $size: {
                $filter: {
                  input: "$employmentStats",
                  as: "status",
                  cond: { $eq: ["$$status", "Employed"] },
                },
              },
            },
            unemployed: {
              $size: {
                $filter: {
                  input: "$employmentStats",
                  as: "status",
                  cond: { $eq: ["$$status", "Unemployed"] },
                },
              },
            },
          },
        },
      },
    ]);

    res.status(200).json({
      message: "Enhanced household statistics retrieved successfully",
      data: {
        summary: households,
        demographics: demographicStats,
        growthTrend: await calculateHouseholdGrowth(),
      },
    });
  } catch (error) {
    console.error("Enhanced Household Stats Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get Interactive Household Graph Data (NEW)
const getHouseholdGraphData = async (req, res) => {
  try {
    const { street, minSize, maxSize, ageGroup, gender } = req.query;

    let matchStage = {
      "userData.isLoginApproved": true,
      "userData.address": { $exists: true, $ne: "" },
      "userData.houseNumber": { $exists: true, $ne: "" },
    };

    // Apply filters
    if (street) {
      matchStage["userData.address"] = { $regex: street, $options: "i" };
    }

    const householdData = await Census.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: "$userData",
      },
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: {
            address: "$userData.address",
            houseNumber: "$userData.houseNumber",
          },
          totalMembers: { $sum: 1 },
          members: {
            $push: {
              name: "$fullName",
              age: "$age",
              gender: "$sex",
              occupation: "$occupation",
              employmentStatus: "$employmentStatus",
              voterStatus: "$voterStatus",
              isHeadOfFamily: "$isHeadOfFamily",
              userId: "$userId",
            },
          },
          headOfFamily: {
            $push: {
              $cond: {
                if: { $eq: ["$isHeadOfFamily", true] },
                then: {
                  name: "$fullName",
                  phoneNumber: "$userData.phoneNumber",
                },
                else: null,
              },
            },
          },
        },
      },
      {
        $project: {
          address: "$_id.address",
          houseNumber: "$_id.houseNumber",
          totalMembers: 1,
          members: 1,
          headOfFamily: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$headOfFamily",
                  as: "head",
                  cond: { $ne: ["$$head", null] },
                },
              },
              0,
            ],
          },
        },
      },
    ]);

    // Apply additional filters
    let filteredData = householdData;

    if (minSize || maxSize) {
      filteredData = filteredData.filter((household) => {
        const size = household.totalMembers;
        return (
          (!minSize || size >= parseInt(minSize)) &&
          (!maxSize || size <= parseInt(maxSize))
        );
      });
    }

    if (ageGroup || gender) {
      filteredData = filteredData
        .map((household) => {
          const filteredMembers = household.members.filter((member) => {
            const ageMatch =
              !ageGroup || getDetailedAgeGroup(member.age) === ageGroup;
            const genderMatch = !gender || member.gender === gender;
            return ageMatch && genderMatch;
          });

          return {
            ...household,
            filteredMembers: filteredMembers,
            hasFilteredMembers: filteredMembers.length > 0,
          };
        })
        .filter((household) => household.hasFilteredMembers);
    }

    // Format for frontend visualization
    const graphData = filteredData.map((household, index) => ({
      id: `${household.address}-${household.houseNumber}`,
      name: `${household.address} ${household.houseNumber}`,
      value: household.totalMembers,
      color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      address: household.address,
      houseNumber: household.houseNumber,
      totalMembers: household.totalMembers,
      headOfFamily: household.headOfFamily,
      members: household.members,
    }));

    res.status(200).json({
      message: "Household graph data retrieved successfully",
      data: graphData,
      filters: {
        street,
        minSize,
        maxSize,
        ageGroup,
        gender,
      },
      totalFiltered: graphData.length,
    });
  } catch (error) {
    console.error("Household Graph Data Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Enhanced Age Distribution with Modern Grouping (NEW)
const getEnhancedAgeDistribution = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter if provided
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z'); // Include entire end date
      }
    }
    
    const censusData = await Census.find(dateFilter).populate("userId");

    // Modern age groups
    const ageGroups = [
      "0-4",
      "5-9",
      "10-14",
      "15-19",
      "20-24",
      "25-29",
      "30-34",
      "35-39",
      "40-44",
      "45-49",
      "50-54",
      "55-59",
      "60-64",
      "65-69",
      "70-74",
      "75-79",
      "80+",
    ];

    const distribution = {
      total: censusData.length,
      byGender: { Male: {}, Female: {}, "LGBTQ+": {} },
      byGroup: {},
      summary: {
        averageAge: 0,
        medianAge: 0,
        youthPercentage: 0,
        seniorPercentage: 0,
      },
    };

    // Initialize groups
    ageGroups.forEach((group) => {
      distribution.byGroup[group] = { total: 0, male: 0, female: 0, lgbtq: 0 };
      distribution.byGender.Male[group] = 0;
      distribution.byGender.Female[group] = 0;
      distribution.byGender["LGBTQ+"][group] = 0;
    });

    let ageSum = 0;
    const ages = [];

    // Process each resident
    censusData.forEach((resident) => {
      const age = resident.age;
      const gender = resident.sex || "Not Specified";
      const group = getDetailedAgeGroup(age);

      ageSum += age;
      ages.push(age);

      if (distribution.byGroup[group]) {
        distribution.byGroup[group].total++;

        if (gender === "Male") {
          distribution.byGroup[group].male++;
          distribution.byGender.Male[group]++;
        } else if (gender === "Female") {
          distribution.byGroup[group].female++;
          distribution.byGender.Female[group]++;
        } else if (gender === "LGBTQ+") {
          distribution.byGroup[group].lgbtq++;
          distribution.byGender["LGBTQ+"][group]++;
        }
      }
    });

    // Calculate summary statistics
    distribution.summary.averageAge = (ageSum / censusData.length).toFixed(1);
    distribution.summary.medianAge = calculateMedian(ages);
    distribution.summary.youthPercentage = (
      ((distribution.byGroup["0-4"].total +
        distribution.byGroup["5-9"].total +
        distribution.byGroup["10-14"].total) /
        censusData.length) *
      100
    ).toFixed(1);
    distribution.summary.seniorPercentage = (
      ((distribution.byGroup["65-69"].total +
        distribution.byGroup["70-74"].total +
        distribution.byGroup["75-79"].total +
        distribution.byGroup["80+"].total) /
        censusData.length) *
      100
    ).toFixed(1);

    // Format for frontend charts
    const chartData = ageGroups.map((group) => ({
      group,
      total: distribution.byGroup[group].total,
      male: -distribution.byGroup[group].male, // Negative for pyramid chart
      female: distribution.byGroup[group].female,
      lgbtq: distribution.byGroup[group].lgbtq,
      percentage: (
        (distribution.byGroup[group].total / censusData.length) *
        100
      ).toFixed(1),
    }));

    res.status(200).json({
      message: "Enhanced age distribution retrieved successfully",
      data: {
        chartData,
        summary: distribution.summary,
        totalResidents: await User.countDocuments({ isLoginApproved: true }),
      },
    });
  } catch (error) {
    console.error("Enhanced Age Distribution Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get Household Details for Drill-down (NEW)
const getHouseholdDetails = async (req, res) => {
  try {
    const { address, houseNumber } = req.params;

    const householdMembers = await User.aggregate([
      {
        $match: {
          address: decodeURIComponent(address),
          houseNumber: houseNumber,
          isLoginApproved: true,
        },
      },
      {
        $lookup: {
          from: "censuses",
          localField: "_id",
          foreignField: "userId",
          as: "censusData",
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          phoneNumber: 1,
          birthdate: 1,
          address: 1,
          houseNumber: 1,
          idImage: 1,
          isHeadofFamily: 1,
          censusData: { $arrayElemAt: ["$censusData", 0] },
        },
      },
    ]);

    const formattedMembers = householdMembers.map((member) => {
      const census = member.censusData || {};
      return {
        id: member._id,
        fullName: `${member.firstName} ${member.lastName}`,
        phoneNumber: member.phoneNumber,
        birthdate: member.birthdate,
        age: census.age || calculateAgeFromBirthdate(member.birthdate),
        gender: census.sex || "Not Specified",
        civilStatus: census.civilStatus || "Not Specified",
        occupation: census.occupation || "Not Specified",
        employmentStatus: census.employmentStatus || "Not Specified",
        voterStatus: census.voterStatus || "Not Specified",
        isHeadOfFamily: member.isHeadofFamily || false,
        hasCensusData: !!member.censusData,
        image: member.idImage || "https://via.placeholder.com/150",
      };
    });

    const headOfFamily = formattedMembers.find(
      (member) => member.isHeadOfFamily
    );

    res.status(200).json({
      message: "Household details retrieved successfully",
      data: {
        address: decodeURIComponent(address),
        houseNumber: houseNumber,
        headOfFamily: headOfFamily,
        members: formattedMembers,
        totalMembers: formattedMembers.length,
        membersWithCensus: formattedMembers.filter((m) => m.hasCensusData)
          .length,
        householdType: getHouseholdType(formattedMembers),
      },
    });
  } catch (error) {
    console.error("Get Household Details Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// NEW HELPER FUNCTIONS
const getDetailedAgeGroup = (age) => {
  if (age <= 4) return "0-4";
  if (age <= 9) return "5-9";
  if (age <= 14) return "10-14";
  if (age <= 19) return "15-19";
  if (age <= 24) return "20-24";
  if (age <= 29) return "25-29";
  if (age <= 34) return "30-34";
  if (age <= 39) return "35-39";
  if (age <= 44) return "40-44";
  if (age <= 49) return "45-49";
  if (age <= 54) return "50-54";
  if (age <= 59) return "55-59";
  if (age <= 64) return "60-64";
  if (age <= 69) return "65-69";
  if (age <= 74) return "70-74";
  if (age <= 79) return "75-79";
  return "80+";
};

const calculateMedian = (ages) => {
  if (ages.length === 0) return 0;

  const sorted = [...ages].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }
  return Math.round(sorted[middle]);
};

const getHouseholdType = (members) => {
  const adults = members.filter((m) => m.age >= 18).length;
  const children = members.filter((m) => m.age < 18).length;
  const seniors = members.filter((m) => m.age >= 60).length;

  if (seniors > 0 && children === 0) return "Senior Household";
  if (children > 0 && adults === 1) return "Single Parent Household";
  if (children === 0 && adults === 1) return "Single Person Household";
  if (children > 0) return "Family with Children";
  return "Adult Household";
};

// ✅ NEW: Get Complete Household Details with User and Census Data
// ✅ CORRECTED: Get Complete Household Details - Prioritize Census Data for Head of Family
const getCompleteHouseholdDetails = async (req, res) => {
  try {
    const { address, houseNumber } = req.params;
    const decodedAddress = decodeURIComponent(address);

    // Get all users in this household
    const householdUsers = await User.find({
      address: decodedAddress,
      houseNumber: houseNumber,
      isLoginApproved: true,
    }).select('firstName lastName phoneNumber birthdate address houseNumber idImage isHeadofFamily alreadyAnswered familyId');

    if (!householdUsers || householdUsers.length === 0) {
      return res.status(404).json({
        message: "No users found in this household",
      });
    }

    // Get user IDs for census lookup
    const userIds = householdUsers.map(user => user._id);

    // Get census data for all household members - THIS IS THE AUTHORITATIVE SOURCE
    const censusData = await Census.find({ userId: { $in: userIds } });

    // Get all families in this household
    const householdId = `${decodedAddress}|${houseNumber}`;
    const families = await Family.find({ householdId })
      .populate('headUserId', 'firstName lastName phoneNumber');

    // Combine user data with census data - PRIORITIZE CENSUS DATA FOR HEAD OF FAMILY
    const membersWithCompleteData = householdUsers.map(user => {
      const userCensus = censusData.find(census => 
        census.userId.toString() === user._id.toString()
      );

      // Find which family this user belongs to
      const userFamily = families.find(family => 
        family._id.toString() === user.familyId?.toString()
      );

      // ✅ PRIORITIZE CENSUS DATA for head of family determination
      // If census data exists and says they're head, they're head
      // Otherwise, check the Family model, then fall back to User model
      let isHeadOfFamily = false;
      
      if (userCensus && userCensus.isHeadOfFamily) {
        // Census data is the authoritative source
        isHeadOfFamily = true;
      } else if (userFamily && userFamily.headUserId) {
        // Check Family model as secondary source
        isHeadOfFamily = userFamily.headUserId._id.toString() === user._id.toString();
      } else {
        // Fall back to User model as last resort
        isHeadOfFamily = user.isHeadofFamily || false;
      }

      // Calculate age - prioritize census age
      const age = userCensus?.age || calculateAgeFromBirthdate(user.birthdate);

      return {
        id: user._id,
        userId: user._id,
        fullName: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        birthdate: user.birthdate,
        age: age,
        gender: userCensus?.sex || "Not Specified",
        civilStatus: userCensus?.civilStatus || "Not Specified",
        occupation: userCensus?.occupation || "Not Specified",
        employmentStatus: userCensus?.employmentStatus || "Not Specified",
        voterStatus: userCensus?.voterStatus || "Not Specified",
        isHeadOfFamily: isHeadOfFamily,
        hasCensusData: !!userCensus,
        alreadyAnswered: user.alreadyAnswered,
        image: user.idImage || "https://via.placeholder.com/150",
        address: user.address,
        houseNumber: user.houseNumber,
        familyId: user.familyId,
        familySurname: userFamily?.surname || user.lastName,
        // Include source information for debugging
        headSource: userCensus ? 'census' : (userFamily?.headUserId ? 'family' : 'user'),
        censusData: userCensus || null
      };
    });

    // Group by family (using family data from Family model)
    const familyGroups = families.map(family => {
      const familyMembers = membersWithCompleteData.filter(member => 
        member.familyId && member.familyId.toString() === family._id.toString()
      );

      // Find head of family from the members data (which now prioritizes census)
      const headOfFamily = familyMembers.find(member => 
        member.isHeadOfFamily
      );

      return {
        familyId: family._id,
        familyName: family.surname,
        headOfFamily: headOfFamily ? {
          userId: headOfFamily.id,
          name: headOfFamily.fullName,
          phoneNumber: headOfFamily.phoneNumber,
          source: headOfFamily.headSource // For debugging
        } : null,
        members: familyMembers,
        totalMembers: familyMembers.length,
        hasHead: !!headOfFamily
      };
    });

    // Also include any members without family assignments in an "Unknown" family group
    const membersWithoutFamily = membersWithCompleteData.filter(member => 
      !member.familyId
    );

    if (membersWithoutFamily.length > 0) {
      const unknownFamilyHead = membersWithoutFamily.find(member => member.isHeadOfFamily);
      
      familyGroups.push({
        familyId: null,
        familyName: "Unknown",
        headOfFamily: unknownFamilyHead ? {
          userId: unknownFamilyHead.id,
          name: unknownFamilyHead.fullName,
          phoneNumber: unknownFamilyHead.phoneNumber,
          source: unknownFamilyHead.headSource
        } : null,
        members: membersWithoutFamily,
        totalMembers: membersWithoutFamily.length,
        hasHead: !!unknownFamilyHead
      });
    }

    // Debug information
    const headsBySource = membersWithCompleteData
      .filter(m => m.isHeadOfFamily)
      .reduce((acc, head) => {
        acc[head.headSource] = (acc[head.headSource] || 0) + 1;
        return acc;
      }, {});

    console.log('Heads by source:', headsBySource);
    console.log('Total heads found:', membersWithCompleteData.filter(m => m.isHeadOfFamily).length);

    res.status(200).json({
      message: "Complete household details retrieved successfully",
      data: {
        address: decodedAddress,
        houseNumber: houseNumber,
        members: membersWithCompleteData,
        families: familyGroups,
        totalMembers: membersWithCompleteData.length,
        membersWithCensus: membersWithCompleteData.filter(m => m.hasCensusData).length,
        membersAnswered: membersWithCompleteData.filter(m => m.alreadyAnswered).length,
        householdType: getHouseholdType(membersWithCompleteData),
        summary: {
          totalFamilies: familyGroups.length,
          totalHeads: membersWithCompleteData.filter(m => m.isHeadOfFamily).length,
          headsBySource: headsBySource,
          averageAge: membersWithCompleteData.length > 0 ? 
            (membersWithCompleteData.reduce((sum, m) => sum + (m.age || 0), 0) / membersWithCompleteData.length).toFixed(1) : 0,
          employmentStats: membersWithCompleteData.reduce((stats, m) => {
            const status = m.employmentStatus;
            stats[status] = (stats[status] || 0) + 1;
            return stats;
          }, {}),
          voterStats: membersWithCompleteData.reduce((stats, m) => {
            const status = m.voterStatus;
            stats[status] = (stats[status] || 0) + 1;
            return stats;
          }, {})
        }
      }
    });
  } catch (error) {
    console.error("Get Complete Household Details Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ NEW: Admin-specific household head check
const checkHouseholdHeadAdmin = async (req, res) => {
  try {
    const { houseNumber, residentId, familySurname } = req.body;

    if (!houseNumber) {
      return res.status(400).json({
        message: "House number is required",
      });
    }

    // Get resident to determine family
    const resident = await User.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    // Use provided surname or resident's last name
    const surname = familySurname || resident.lastName;

    // Find resident's family
    const family = await findOrCreateFamily(resident, surname, houseNumber);
    
    // Check if this family already has a head (excluding current resident)
    const existingHead = await checkFamilyHeadAdmin(family._id, residentId);

    res.status(200).json({
      message: "Family head check completed",
      hasExistingHead: !!existingHead,
      existingHead: existingHead
        ? {
            id: existingHead.userId?._id || existingHead._id,
            name: existingHead.fullName || `${existingHead.firstName} ${existingHead.lastName}`,
            familySurname: family.surname,
          }
        : null,
      familySurname: family.surname,
    });
  } catch (error) {
    console.error("Admin Check Household Head Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ NEW: Admin version of checkFamilyHead that excludes current resident
const checkFamilyHeadAdmin = async (familyId, excludeResidentId = null) => {
  try {
    // First check Census collection (authoritative source)
    let existingHead = await Census.findOne({
      familyId: familyId,
      isHeadOfFamily: true
    }).populate('userId', 'firstName lastName');

    // If no head in census, check Family model
    if (!existingHead) {
      const family = await Family.findById(familyId).populate('headUserId', 'firstName lastName');
      if (family && family.headUserId) {
        existingHead = {
          userId: family.headUserId,
          fullName: `${family.headUserId.firstName} ${family.headUserId.lastName}`,
          isHeadOfFamily: true
        };
      }
    }

    // If excluding a resident and they are the current head, return null
    if (excludeResidentId && existingHead) {
      const headUserId = existingHead.userId?._id?.toString() || existingHead.userId?.toString();
      if (headUserId === excludeResidentId.toString()) {
        return null; // Current resident is already the head, so no conflict
      }
    }

    return existingHead;
  } catch (error) {
    console.error("Error checking family head (admin):", error);
    throw error;
  }
};

// ✅ NEW: Force update head of family (admin override)
const forceUpdateHeadOfFamily = async (req, res) => {
  try {
    const { residentId, houseNumber, familySurname } = req.body;

    if (!residentId || !houseNumber) {
      return res.status(400).json({
        message: "Resident ID and house number are required",
      });
    }

    // Get resident
    const resident = await User.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const surname = familySurname || resident.lastName;

    // Find family
    const family = await findOrCreateFamily(resident, surname, houseNumber);

    // Remove current head if exists
    await Census.updateMany(
      { familyId: family._id, isHeadOfFamily: true },
      { isHeadOfFamily: false }
    );

    // Update Family model
    await Family.findByIdAndUpdate(family._id, {
      headUserId: null
    });

    // Update User models in this family
    await User.updateMany(
      { familyId: family._id, isHeadofFamily: true },
      { isHeadofFamily: false }
    );

    // Set new head
    await Census.findOneAndUpdate(
      { userId: residentId },
      { isHeadOfFamily: true }
    );

    await Family.findByIdAndUpdate(family._id, {
      headUserId: residentId
    });

    await User.findByIdAndUpdate(residentId, {
      isHeadofFamily: true
    });

    res.status(200).json({
      message: "Head of family updated successfully",
      data: {
        residentId: residentId,
        familySurname: family.surname,
        houseNumber: houseNumber
      }
    });
  } catch (error) {
    console.error("Force Update Head Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ NEW: Get family heads by household
const getHouseholdHeads = async (req, res) => {
  try {
    const { address, houseNumber } = req.params;

    if (!address || !houseNumber) {
      return res.status(400).json({
        message: "Address and house number are required",
      });
    }

    const householdId = `${decodeURIComponent(address)}|${houseNumber}`;
    
    // Find all families in this household
    const families = await Family.find({ householdId })
      .populate('headUserId', 'firstName lastName phoneNumber');

    // Get census data for heads to ensure consistency
    const headsWithCensus = await Promise.all(
      families.map(async (family) => {
        if (!family.headUserId) return null;

        const censusData = await Census.findOne({
          userId: family.headUserId._id,
          familyId: family._id
        });

        return {
          familyId: family._id,
          surname: family.surname,
          head: {
            userId: family.headUserId._id,
            name: `${family.headUserId.firstName} ${family.headUserId.lastName}`,
            phoneNumber: family.headUserId.phoneNumber,
            hasCensusData: !!censusData,
            isHeadInCensus: censusData?.isHeadOfFamily || false
          }
        };
      })
    );

    const activeHeads = headsWithCensus.filter(head => head !== null);

    res.status(200).json({
      message: "Household heads retrieved successfully",
      data: {
        address: decodeURIComponent(address),
        houseNumber: houseNumber,
        heads: activeHeads,
        totalHeads: activeHeads.length,
        totalFamilies: families.length
      }
    });
  } catch (error) {
    console.error("Get Household Heads Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ NEW: Get Population Statistics from Actual User Data
const getPopulationStatistics = async (req, res) => {
  try {
    // Get all census data with user information
    const censusData = await Census.find()
      .populate('userId', 'firstName lastName birthdate address houseNumber')
      .populate('familyId');

    if (censusData.length === 0) {
      return res.status(200).json({
        message: "No census data available yet",
        data: {
          totalPopulation: 0,
          growthData: [],
          demographics: {},
          householdStats: {}
        }
      });
    }

    // Calculate total population
    const totalPopulation = censusData.length;

    // Calculate growth data (by month of registration)
    const growthData = await calculatePopulationGrowth(censusData);

    // Get demographic breakdown
    const demographics = {
      gender: calculateGenderDistribution(censusData),
      ageGroups: calculateAgeDistribution(censusData),
      employment: calculateEmploymentDistribution(censusData),
      voterStatus: calculateVoterDistribution(censusData)
    };

    // Get household statistics
    const householdStats = await getHouseholdStatistics();

    res.status(200).json({
      message: "Population statistics retrieved successfully",
      data: {
        totalPopulation,
        growthData,
        demographics,
        householdStats,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Get Population Statistics Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ NEW: Calculate Population Growth Over Time
const calculatePopulationGrowth = async (censusData) => {
  try {
    // Group by month of creation
    const monthlyData = {};
    
    censusData.forEach(record => {
      const monthYear = record.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      monthlyData[monthYear]++;
    });

    // Convert to array and calculate cumulative growth
    const months = Object.keys(monthlyData).sort();
    let cumulative = 0;
    
    const growthData = months.map(month => {
      cumulative += monthlyData[month];
      return {
        month,
        newRegistrations: monthlyData[month],
        cumulativePopulation: cumulative
      };
    });

    return growthData;
  } catch (error) {
    console.error("Growth calculation error:", error);
    return [];
  }
};

// ✅ NEW: Calculate Gender Distribution
const calculateGenderDistribution = (censusData) => {
  const distribution = {
    Male: 0,
    Female: 0,
    "LGBTQ+": 0
  };

  censusData.forEach(record => {
    if (distribution.hasOwnProperty(record.sex)) {
      distribution[record.sex]++;
    }
  });

  return {
    counts: distribution,
    percentages: Object.keys(distribution).reduce((acc, gender) => {
      acc[gender] = ((distribution[gender] / censusData.length) * 100).toFixed(1);
      return acc;
    }, {})
  };
};

// ✅ NEW: Calculate Age Distribution
const calculateAgeDistribution = (censusData) => {
  const ageGroups = {
    "0-17": { count: 0, label: "Children & Teens" },
    "18-24": { count: 0, label: "Young Adults" },
    "25-34": { count: 0, label: "Adults" },
    "35-44": { count: 0, label: "Middle Aged" },
    "45-59": { count: 0, label: "Senior Adults" },
    "60+": { count: 0, label: "Seniors" }
  };

  censusData.forEach(record => {
    const age = record.age;
    if (age <= 17) ageGroups["0-17"].count++;
    else if (age <= 24) ageGroups["18-24"].count++;
    else if (age <= 34) ageGroups["25-34"].count++;
    else if (age <= 44) ageGroups["35-44"].count++;
    else if (age <= 59) ageGroups["45-59"].count++;
    else ageGroups["60+"].count++;
  });

  // Calculate percentages
  Object.keys(ageGroups).forEach(group => {
    ageGroups[group].percentage = ((ageGroups[group].count / censusData.length) * 100).toFixed(1);
  });

  return ageGroups;
};

// ✅ NEW: Calculate Employment Distribution
const calculateEmploymentDistribution = (censusData) => {
  const distribution = {};

  censusData.forEach(record => {
    const status = record.employmentStatus;
    distribution[status] = (distribution[status] || 0) + 1;
  });

  return {
    counts: distribution,
    percentages: Object.keys(distribution).reduce((acc, status) => {
      acc[status] = ((distribution[status] / censusData.length) * 100).toFixed(1);
      return acc;
    }, {})
  };
};

// ✅ NEW: Calculate Voter Distribution
const calculateVoterDistribution = (censusData) => {
  const distribution = {
    "Registered": 0,
    "Not Registered": 0,
    "Pre-Registered": 0
  };

  censusData.forEach(record => {
    if (distribution.hasOwnProperty(record.voterStatus)) {
      distribution[record.voterStatus]++;
    }
  });

  return {
    counts: distribution,
    percentages: Object.keys(distribution).reduce((acc, status) => {
      acc[status] = ((distribution[status] / censusData.length) * 100).toFixed(1);
      return acc;
    }, {})
  };
};

// ✅ NEW: Get Real-time Population Dashboard Data
const getPopulationDashboard = async (req, res) => {
  try {
    const censusData = await Census.find()
      .populate('userId', 'firstName lastName birthdate address houseNumber')
      .populate('familyId');

    const totalPopulation = censusData.length;
    
    // Calculate monthly growth for the chart
    const monthlyGrowth = await calculateMonthlyGrowth(censusData);
    
    // Get current stats
    const currentStats = {
      totalPopulation,
      totalHouseholds: await getTotalHouseholdCount(),
      averageHouseholdSize: await getAverageHouseholdSize(),
      growthRate: await calculateGrowthRate(censusData)
    };

    // Get demographic summaries for quick stats
    const quickStats = {
      gender: getGenderSummary(censusData),
      age: getAgeSummary(censusData),
      employment: getEmploymentSummary(censusData)
    };

    res.status(200).json({
      message: "Population dashboard data retrieved successfully",
      data: {
        currentStats,
        monthlyGrowth,
        quickStats,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Get Population Dashboard Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ NEW: Calculate Monthly Growth for Charts
const calculateMonthlyGrowth = (censusData) => {
  const monthlyCounts = {};
  
  // Get last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().substring(0, 7);
    months.push(monthKey);
    monthlyCounts[monthKey] = 0;
  }

  // Count registrations per month
  censusData.forEach(record => {
    const monthKey = record.createdAt.toISOString().substring(0, 7);
    if (monthlyCounts.hasOwnProperty(monthKey)) {
      monthlyCounts[monthKey]++;
    }
  });

  // Convert to array format for charts
  return months.map(month => ({
    month: formatMonthForDisplay(month),
    population: monthlyCounts[month],
    cumulative: Object.keys(monthlyCounts)
      .filter(m => m <= month)
      .reduce((sum, m) => sum + monthlyCounts[m], 0)
  }));
};

// ✅ NEW: Helper Functions
const getTotalHouseholdCount = async () => {
  const stats = await getHouseholdStatistics();
  return stats.totalHouseholds;
};

const getAverageHouseholdSize = async () => {
  const stats = await getHouseholdStatistics();
  return parseFloat(stats.averageHouseholdSize) || 0;
};

const calculateGrowthRate = (censusData) => {
  if (censusData.length === 0) return 0;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentRegistrations = censusData.filter(record => 
    new Date(record.createdAt) > thirtyDaysAgo
  ).length;
  
  return ((recentRegistrations / censusData.length) * 100).toFixed(1);
};

const getGenderSummary = (censusData) => {
  const distribution = calculateGenderDistribution(censusData);
  const mainGender = Object.keys(distribution.counts).reduce((a, b) => 
    distribution.counts[a] > distribution.counts[b] ? a : b
  );
  return {
    main: mainGender,
    percentage: distribution.percentages[mainGender]
  };
};

const getAgeSummary = (censusData) => {
  const distribution = calculateAgeDistribution(censusData);
  const mainAgeGroup = Object.keys(distribution).reduce((a, b) => 
    distribution[a].count > distribution[b].count ? a : b
  );
  return {
    main: distribution[mainAgeGroup].label,
    percentage: distribution[mainAgeGroup].percentage
  };
};

const getEmploymentSummary = (censusData) => {
  const distribution = calculateEmploymentDistribution(censusData);
  const mainEmployment = Object.keys(distribution.counts).reduce((a, b) => 
    distribution.counts[a] > distribution.counts[b] ? a : b
  );
  return {
    main: mainEmployment,
    percentage: distribution.percentages[mainEmployment]
  };
};

const formatMonthForDisplay = (monthString) => {
  const [year, month] = monthString.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month) - 1]} ${year.substring(2)}`;
};

// Get Civil Status Statistics
const getCivilStatusStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter if provided
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }
    
    // Get civil status from users who completed census
    const civilStatusFromCensus = await Census.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$civilStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get users without census data
    const usersWithoutCensus = await User.countDocuments({
      isLoginApproved: true,
      alreadyAnswered: { $ne: true },
      ...dateFilter
    });

    // Combine results
    let combinedStats = [...civilStatusFromCensus];
    
    // Add users without census as "Not Specified"
    if (usersWithoutCensus > 0) {
      const existingNotSpecified = combinedStats.find(stat => stat._id === 'Not Specified');
      if (existingNotSpecified) {
        existingNotSpecified.count += usersWithoutCensus;
      } else {
        combinedStats.push({
          _id: 'Not Specified',
          count: usersWithoutCensus
        });
      }
    }

    // Sort by count
    combinedStats.sort((a, b) => b.count - a.count);

    console.log(`📊 Civil Status Stats: ${combinedStats.length} categories, ${usersWithoutCensus} users without census`);

    res.status(200).json({
      message: "Civil status statistics retrieved successfully",
      statistics: combinedStats,
    });
  } catch (error) {
    console.error("Civil Status Statistics Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get Occupation Statistics
const getOccupationStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter if provided
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }
    
    // Get occupation from users who completed census
    const occupationFromCensus = await Census.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$occupation",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get users without census data
    const usersWithoutCensus = await User.countDocuments({
      isLoginApproved: true,
      alreadyAnswered: { $ne: true },
      ...dateFilter
    });

    // Combine results
    let combinedStats = [...occupationFromCensus];
    
    // Add users without census as "Not Specified"
    if (usersWithoutCensus > 0) {
      const existingNotSpecified = combinedStats.find(stat => stat._id === 'Not Specified' || stat._id === 'None');
      if (existingNotSpecified) {
        existingNotSpecified.count += usersWithoutCensus;
      } else {
        combinedStats.push({
          _id: 'Not Specified',
          count: usersWithoutCensus
        });
      }
    }

    // Sort by count and take top 8
    combinedStats.sort((a, b) => b.count - a.count);

    console.log(`📊 Occupation Stats: ${combinedStats.length} categories, ${usersWithoutCensus} users without census`);

    res.status(200).json({
      message: "Occupation statistics retrieved successfully",
      statistics: combinedStats,
    });
  } catch (error) {
    console.error("Occupation Statistics Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Export all functions
module.exports = {
  // Original functions
  saveCensusData,
  getCompleteHouseholdDetails,
  getCensusData,
  getHouseholdFamilies,
  getCensusDataStatus,
  getAgeGroupStatistics,
  getEmploymentStatistics,
  getVoterStatistics,
  downloadCensusData,
  getAllCensusData,
  getHouseholdStatistics,
  getGenderStatistics,
  getFilteredStatistics,
  checkHouseholdHead,
  getCensusDataByUserId,
  getHouseholdMembers,
  // New enhanced functions
  getTotalHouseholds,
  getEnhancedHouseholdStatistics,
  getHouseholdGraphData,
  getEnhancedAgeDistribution,
  getHouseholdDetails,
   checkHouseholdHeadAdmin,
  forceUpdateHeadOfFamily,
  getHouseholdHeads,


  // ✅ NEW: Population Statistics Functions
  getPopulationStatistics,
  getPopulationDashboard,
  calculatePopulationGrowth,
  calculateGenderDistribution,
  calculateAgeDistribution,
  calculateEmploymentDistribution,
  calculateVoterDistribution,
  calculateMonthlyGrowth,
  // ✅ NEW: Civil Status and Occupation Functions
  getCivilStatusStatistics,
  getOccupationStatistics
};