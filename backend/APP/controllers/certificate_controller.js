/** @format */

const CertificateRequest = require("../models/certificate_model");
const User = require("../models/user_model");
const Approval = require("../models/approval_model");
const path = require("path");
require("dotenv").config();
const AdminActivityLog = require("../models/adminActivity_model");
const fs = require("fs");
const { getSupabaseClient } = require("../database/supabaseConfig");
const { PDFDocument } = require("pdf-lib");
const {
  sendRequestUpdate,
} = require("../controllers/otp_controller");

const formatFancyDate = (date) => {
  const day = date.getDate();
  const suffix = ["th", "st", "nd", "rd"][
    day % 10 > 3 || (day % 100 >= 11 && day % 100 <= 13) ? 0 : day % 10
  ];
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  return `${day}${suffix} of ${month}, ${year}`;
};

const formatTime = (timeString) => {
  if (!timeString) return "Not provided";

  try {
    // Handle different time formats
    if (timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours);
      const period = hour >= 12 ? "PM" : "AM";
      const formattedHour = hour % 12 || 12;

      return `${formattedHour}:${minutes} ${period}`;
    }
    return timeString;
  } catch (error) {
    return timeString;
  }
};

// Update the requestCertificate function in certificate_controller.js
const requestCertificate = async (req, res) => {
  try {
    const {
      certificateType,
      purpose,
      userId,
      isForSelf,
      forPerson,
      certificateData,
    } = req.body;

    const requestUserId = userId || req.user.userId;

    if (!certificateType || !purpose) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const userExists = await User.findById(requestUserId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found." });
    }

    // Validate forPerson data if requesting for someone else
    if (
      isForSelf === false &&
      (!forPerson || !forPerson.firstName || !forPerson.lastName)
    ) {
      return res.status(400).json({
        message: "Person information is required when requesting for others.",
      });
    }

    // Validate certificate-specific data based on certificate type
    let validatedCertificateData = {};

    if (certificateData) {
      switch (certificateType) {
        case "indigency":
          if (
            !certificateData.monthlyIncome ||
            !certificateData.familyMembers
          ) {
            return res.status(400).json({
              message:
                "Monthly income and family members are required for indigency certificate.",
            });
          }
          validatedCertificateData = {
            indigency: {
              monthlyIncome: certificateData.monthlyIncome,
              familyMembers: certificateData.familyMembers,
              sourceOfIncome: certificateData.sourceOfIncome || "",
              propertiesOwned: certificateData.propertiesOwned || [],
              hasSSS: certificateData.hasSSS || false,
              hasPhilhealth: certificateData.hasPhilhealth || false,
            },
          };
          break;

        case "e_blotter":
          // Validate required fields for e-blotter
          if (
            !certificateData.complainantName ||
            !certificateData.incidentDate ||
            !certificateData.incidentDetails
          ) {
            return res.status(400).json({
              message:
                "Complainant name, incident date, and details are required for e-blotter.",
            });
          }
          validatedCertificateData = {
            eBlotter: {
              // Complainant information
              complainantName: certificateData.complainantName || "",
              complainantAddress: certificateData.complainantAddress || "",
              complainantContact: certificateData.complainantContact || "",
              complainantAge: certificateData.complainantAge || "",

              // Respondent information
              respondentName: certificateData.respondentName || "",
              respondentAddress: certificateData.respondentAddress || "",
              respondentContact: certificateData.respondentContact || "",
              respondentAge: certificateData.respondentAge || "",

              // Incident information
              incidentDate: certificateData.incidentDate,
              incidentTime: certificateData.incidentTime || "",
              incidentLocation: certificateData.incidentLocation || "",
              incidentDetails: certificateData.incidentDetails,

              // Witness information
              witnessName: certificateData.witnessName || "",
              witnessAddress: certificateData.witnessAddress || "",
              witnessContact: certificateData.witnessContact || "",

              // Additional fields
              complaint: certificateData.complaint || "",
              narrative: certificateData.narrative || "",
            },
          };
          break;

        case "brgy_clearance":
        case "bus_clearance":
          validatedCertificateData = {};
          break;

        default:
          validatedCertificateData = {};
      }
    }

    const newRequest = new CertificateRequest({
      userId: requestUserId,
      certificateType,
      purpose,
      isForSelf: isForSelf !== false,
      forPerson: isForSelf === false ? forPerson : undefined,
      certificateData: validatedCertificateData,
    });

    await newRequest.save();

    res.status(201).json({
      message: `${certificateType} certificate request submitted.`,
      request: {
        _id: newRequest._id,
        certificateType: newRequest.certificateType,
        purpose: newRequest.purpose,
        status: newRequest.status,
        submittedAt: newRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in requestCertificate:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const checkUserStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const approval = await Approval.findOne({ userId });
    if (!approval) {
      return res.status(200).json({
        success: false,
        status: "unregistered",
        message: "Unregistered",
      });
    }

    if (approval.status === "rejected") {
      return res.status(200).json({
        success: false,
        status: "rejected",
        rejectionMessage: approval.rejectionMessage,
      });
    }

    if (approval.status === "pending") {
      return res.status(200).json({ success: false, status: "pending" });
    }

    return res.status(200).json({ success: true, status: approval.status });
  } catch (error) {
    console.error("Error checking user status:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const approveCertificateRequest = async (req, res) => {
  try {
    console.log('=== DEBUGGING CERTIFICATE APPROVAL ===');
    console.log('req.params:', req.params);
    console.log('req.user:', req.user);
    
    const { requestId } = req.params;
    const adminId = req.user.userId;

    console.log('Extracted requestId:', requestId);
    console.log('Extracted adminId:', adminId);

    const request = await CertificateRequest.findById(requestId).populate(
      "userId"
    );
    
    console.log('Found request:', request);
    console.log('Request userId:', request?.userId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status === "Approved") {
      return res.status(400).json({ message: "Request already approved" });
    }

    // Mark as approved first
    request.status = "Approved";

    const certificateMap = {
      brgy_clearance: {
        file: "brgy_clearance.pdf", // for user
        adminFile: "admin_brgy_clearance.pdf", // for admin
        fields: ["fullName", "purpose", "date"],
      },
      indigency: {
        file: "indigency.pdf",
        adminFile: "admin_indigency.pdf",
        fields: ["fullName", "purpose", "date"],
      },
      bus_clearance: {
        file: "bus_clearance.pdf",
        adminFile: "admin_bus_clearance.pdf",
        fields: ["fullName", "business", "date"],
      },
      e_blotter: {
        file: "e_blotter.pdf",
        adminFile: "admin_e_blotter.pdf",
        fields: [
          "date",
          "fullName_nagrereklamo",
          "tirahan_nagrereklamo",
          "contact_nagrereklamo",
          "edad_nagrereklamo",
          "fullName_nireklamo",
          "tirahan_nireklamo",
          "contact_nireklamo",
          "edad_nireklamo",
          "reklamo",
          "date_pangyayari",
          "oras_pangyayari",
          "lugar_pangyayari",
          "salaysay",
          "fullName_testigo",
          "tirahan_testigo",
          "contact_testigo",
        ],
      },
    };

    const config = certificateMap[request.certificateType];
    if (!config)
      return res.status(400).json({ message: "Unknown certificate type." });

    // Use the appropriate name based on whether it's for self or others
    const fullName = request.isForSelf
      ? `${request.userId.firstName} ${request.userId.lastName}`
      : `${request.forPerson.firstName} ${request.forPerson.lastName}`;

    // Get user address and contact info from user profile
    const userAddress = request.userId.address || "Not provided";
    const userContact = request.userId.phoneNumber || "Not provided";
    const userAge = request.userId.birthdate
      ? `${Math.floor(
          (new Date() - new Date(request.userId.birthdate)) /
            (365.25 * 24 * 60 * 60 * 1000)
        )} years old`
      : "Not provided";

    // Prepare field values
    let fieldValues = {
      fullName,
      purpose: request.purpose,
      business: request.businessName || request.purpose,
      date: formatFancyDate(new Date()),
    };
    
    console.log(`📋 Certificate Type: ${request.certificateType}`);
    console.log(`📋 Required Fields:`, config.fields);
    console.log(`📋 Field Values:`, fieldValues);

    // Add E-Blotter specific field values
    if (
      request.certificateType === "e_blotter" &&
      request.certificateData?.eBlotter
    ) {
      const eBlotterData = request.certificateData.eBlotter;

      // Use complainant data from form, fallback to user data if not provided
      const complainantName = eBlotterData.complainantName || fullName;
      const complainantAddress = eBlotterData.complainantAddress || userAddress;
      const complainantContact = eBlotterData.complainantContact || userContact;
      const complainantAge = eBlotterData.complainantAge || userAge;

      // In approveCertificateRequest function, update the E-Blotter field mapping:
      fieldValues = {
        ...fieldValues,
        // Current date (for the report date)
        date: formatFancyDate(new Date()),

        // Complainant information (nagrereklamo)
        fullName_nagrereklamo: complainantName,
        tirahan_nagrereklamo: complainantAddress,
        contact_nagrereklamo: complainantContact,
        edad_nagrereklamo: complainantAge,

        // Respondent information (nireklamo)
        fullName_nireklamo: eBlotterData.respondentName || "Not provided",
        tirahan_nireklamo: eBlotterData.respondentAddress || "Not provided",
        contact_nireklamo: eBlotterData.respondentContact || "Not provided",
        edad_nireklamo: eBlotterData.respondentAge || "Not provided",

        // Complaint and incident details
        reklamo:
          eBlotterData.complaint ||
          eBlotterData.incidentDetails ||
          "No complaint details provided",
        date_pangyayari: eBlotterData.incidentDate
          ? formatFancyDate(new Date(eBlotterData.incidentDate))
          : "Not provided",
        oras_pangyayari: eBlotterData.incidentTime
          ? formatTime(eBlotterData.incidentTime)
          : "Not provided",
        lugar_pangyayari: eBlotterData.incidentLocation || "Not provided",
        salaysay:
          eBlotterData.narrative ||
          eBlotterData.incidentDetails ||
          "No narrative provided",

        // Witness information (testigo)
        fullName_testigo: eBlotterData.witnessName || "Not provided",
        tirahan_testigo: eBlotterData.witnessAddress || "Not provided",
        contact_testigo: eBlotterData.witnessContact || "Not provided",
      };
    }

    // Function to generate and upload PDF
    const generateAndUploadPDF = async (templateFileName, fileNameSuffix) => {
      try {
        const templatePath = path.join(
          __dirname,
          "../templates",
          templateFileName
        );
        
        console.log(`🔍 Looking for template at: ${templatePath}`);
        
        if (!fs.existsSync(templatePath)) {
          throw new Error(`Template file not found: ${templateFileName}`);
        }
        
        const pdfBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        
        console.log(`📋 Available fields in ${templateFileName}:`);
        const fields = form.getFields();
        fields.forEach(field => {
          console.log(`  - ${field.getName()}: ${field.constructor.name}`);
        });

        // Fill all PDF fields
        for (const field of config.fields) {
          const textField = form.getTextField(field);
          if (textField) {
            // Set text or empty string if undefined
            const fieldValue = fieldValues[field] || "";
            console.log(`📝 Setting field ${field} to: "${fieldValue}"`);
            textField.setText(fieldValue);
          } else {
            console.log(`⚠️ Field ${field} not found in PDF form`);
          }
        }

        form.flatten();
        const finalPdf = await pdfDoc.save();

        const fileName = `certificate-${
          request.userId._id
        }-${Date.now()}-${fileNameSuffix}.pdf`;

        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error('Supabase client not available');
        }
        
        const { data, error } = await supabase.storage
          .from("bms646-app")
          .upload(`certificates/${fileName}`, finalPdf, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (error) {
          console.error("Supabase upload error:", error);
          throw new Error(
            `Failed to upload ${fileNameSuffix} PDF: ${error.message}`
          );
        }

        const { data: publicUrlData, error: urlError } = supabase.storage
          .from("bms646-app")
          .getPublicUrl(`certificates/${fileName}`);

        if (urlError || !publicUrlData?.publicUrl) {
          console.error("Supabase public URL error:", urlError);
          throw new Error(
            `Failed to retrieve public URL for ${fileNameSuffix}: ${urlError?.message}`
          );
        }

        return publicUrlData.publicUrl;
      } catch (error) {
        console.error(`❌ Error generating ${fileNameSuffix} PDF:`, error);
        throw error;
      }
    };

    // Generate both user and admin versions
    const [userFileUrl, adminFileUrl] = await Promise.all([
      generateAndUploadPDF(config.file, "user"),
      generateAndUploadPDF(config.adminFile, "admin"),
    ]);

    // Save both URLs to the database
    request.generatedFile = userFileUrl;
    request.adminGeneratedFile = adminFileUrl;

    const description = `Your ${request.certificateType} request has been approved and the certificate is ready.`;
    await request.save();
    await sendRequestUpdate(
      "Certificate of " + request.certificateType,
      description,
      request.userId
    );

    await AdminActivityLog.create({
      adminId,
      userId: request.userId,
      actionType: "CertificateApproval",
      certificateType: request.certificateType,
    });

    res.status(200).json({
      message: `${request.certificateType} request approved and certificates generated.`,
      request,
      fileUrl: userFileUrl,
      adminFileUrl: adminFileUrl,
    });
  } catch (error) {
    console.error("approveCertificateRequest:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const rejectCertificateRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionMessage } = req.body;
    const adminId = req.user.userId;

    if (!rejectionMessage) {
      return res.status(400).json({ message: "Rejection message is required" });
    }

    const request = await CertificateRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status === "Approved") {
      return res.status(400).json({ message: "Request already approved" });
    }

    request.status = "Rejected";
    request.rejectionMessage = rejectionMessage;
    await request.save();
    const description = `Your ${request.certificateType} request has been rejected. Open your account to see more info`;
    await request.save();
    await sendRequestUpdate(
      "Certificate of " + request.certificateType,
      description,
      request.userId
    );

    await AdminActivityLog.create({
      adminId: adminId,
      userId: request.userId,
      actionType: "CertificateRejection",
      certificateType: request.certificateType,
      reason: rejectionMessage,
    });

    res.status(200).json({
      message: `${request.certificateType} request rejected.`,
      request,
    });
  } catch (error) {
    console.error("rejectCertificateRequest:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const pendingRequests = await CertificateRequest.find({ status: "Pending" })
      .populate("userId", "firstName lastName address") // fetch basic user info
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json({
      message: "Pending certificate requests fetched successfully.",
      count: pendingRequests.length,
      requests: pendingRequests,
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllCertificateRequestIds = async (req, res) => {
  try {
    const requests = await CertificateRequest.find({})
      .populate("userId", "firstName lastName address phoneNumber birthdate")
      .select(
        "certificateType purpose status createdAt generatedFile adminGeneratedFile rejectionMessage isForSelf forPerson certificateData userId"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "All certificate requests fetched successfully.",
      requests,
    });
  } catch (error) {
    console.error("Error fetching certificate request IDs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserCertificatesByStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    // First get all requests sorted by createdAt (newest first)
    const allRequests = await CertificateRequest.find({
      userId,
      status,
    })
      .sort({ createdAt: -1 })
      .populate("userId");

    if (!allRequests || allRequests.length === 0) {
      return res.json({
        message: `No ${status.toLowerCase()} requests found.`,
        requests: [],
        count: 0,
      });
    }

    let filteredRequests = allRequests;

    // If status is Approved, filter to only keep the latest of each certificate type
    if (status === "Approved") {
      const uniqueTypes = new Map();

      allRequests.forEach((request) => {
        if (!uniqueTypes.has(request.certificateType)) {
          uniqueTypes.set(request.certificateType, request);
        }
      });

      filteredRequests = Array.from(uniqueTypes.values());
    }

    const formatted = filteredRequests.map((req) => ({
      id: req._id,
      certificateType: req.certificateType,
      createdAt: req.createdAt,
      status: req.status,
      rejectionMessage: req.status === "Rejected" ? req.rejectionMessage : null,
      file: req.status === "Approved" ? req.generatedFile : null,
    }));

    res.status(200).json({
      count: formatted.length,
      requests: formatted,
      message:
        status === "Approved"
          ? "Showing only latest approved document for each type"
          : undefined,
    });
  } catch (error) {
    console.error("Certificate Status Fetch Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateBlotterStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const adminId = req.user.userId;

    // Validate status
    if (!["Pending", "Approved", "Resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be Pending, Approved, or Resolved",
      });
    }

    const request = await CertificateRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Verify this is an e-blotter request
    if (request.certificateType !== "e_blotter") {
      return res.status(400).json({
        success: false,
        message: "This is not an e-blotter request",
      });
    }

    // Update status
    request.status = status;
    
    // Generate PDF if status is being set to Approved or Resolved and PDF doesn't exist yet
    if ((status === "Approved" || status === "Resolved") && !request.adminGeneratedFile) {
      console.log(`📄 Generating PDF for e-blotter ${requestId} - Status: ${status}`);
      
      // Get certificate configuration
      const certificateMap = {
        e_blotter: {
          file: "e_blotter.pdf",
          adminFile: "admin_e_blotter.pdf",
          fields: [
            "date",
            "fullName_nagrereklamo",
            "tirahan_nagrereklamo",
            "contact_nagrereklamo",
            "edad_nagrereklamo",
            "fullName_nireklamo",
            "tirahan_nireklamo",
            "contact_nireklamo",
            "edad_nireklamo",
            "reklamo",
            "date_pangyayari",
            "oras_pangyayari",
            "lugar_pangyayari",
            "salaysay",
            "fullName_testigo",
            "tirahan_testigo",
            "contact_testigo",
          ],
        },
      };
      
      const config = certificateMap[request.certificateType];
      
      // Prepare field values (reuse existing logic)
      const fullName = request.isForSelf
        ? `${request.userId.firstName} ${request.userId.lastName}`
        : `${request.forPerson.firstName} ${request.forPerson.lastName}`;
      
      const userAddress = request.userId.address || "Not provided";
      const userContact = request.userId.phoneNumber || "Not provided";
      const userAge = request.userId.birthdate
        ? `${Math.floor((new Date() - new Date(request.userId.birthdate)) / (365.25 * 24 * 60 * 60 * 1000))} years old`
        : "Not provided";
      
      let fieldValues = {
        fullName,
        purpose: request.purpose,
        business: request.businessName || request.purpose,
        date: formatFancyDate(new Date()),
      };
      
      // Add E-Blotter specific field values
      if (request.certificateType === "e_blotter" && request.certificateData?.eBlotter) {
        const eBlotterData = request.certificateData.eBlotter;
        const complainantName = eBlotterData.complainantName || fullName;
        const complainantAddress = eBlotterData.complainantAddress || userAddress;
        const complainantContact = eBlotterData.complainantContact || userContact;
        const complainantAge = eBlotterData.complainantAge || userAge;

        fieldValues = {
          ...fieldValues,
          date: formatFancyDate(new Date()),
          fullName_nagrereklamo: complainantName,
          tirahan_nagrereklamo: complainantAddress,
          contact_nagrereklamo: complainantContact,
          edad_nagrereklamo: complainantAge,
          fullName_nireklamo: eBlotterData.respondentName || "Not provided",
          tirahan_nireklamo: eBlotterData.respondentAddress || "Not provided",
          contact_nireklamo: eBlotterData.respondentContact || "Not provided",
          edad_nireklamo: eBlotterData.respondentAge || "Not provided",
          reklamo: eBlotterData.complaint || eBlotterData.incidentDetails || "No complaint details provided",
          date_pangyayari: eBlotterData.incidentDate ? formatFancyDate(new Date(eBlotterData.incidentDate)) : "Not provided",
          oras_pangyayari: eBlotterData.incidentTime ? formatTime(eBlotterData.incidentTime) : "Not provided",
          lugar_pangyayari: eBlotterData.incidentLocation || "Not provided",
          salaysay: eBlotterData.narrative || eBlotterData.incidentDetails || "No narrative provided",
          fullName_testigo: eBlotterData.witnessName || "Not provided",
          tirahan_testigo: eBlotterData.witnessAddress || "Not provided",
          contact_testigo: eBlotterData.witnessContact || "Not provided",
        };
      }
      
      // Function to generate and upload PDF (reuse existing logic)
      const generateAndUploadPDF = async (templateFileName, fileNameSuffix) => {
        try {
          const templatePath = path.join(__dirname, "../templates", templateFileName);
          
          if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templateFileName}`);
          }
          
          const pdfBytes = fs.readFileSync(templatePath);
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const form = pdfDoc.getForm();
          
          // Fill all PDF fields
          for (const field of config.fields) {
            const textField = form.getTextField(field);
            if (textField) {
              const fieldValue = fieldValues[field] || "";
              textField.setText(fieldValue);
            }
          }
          
          // Save the PDF
          const pdfBytesModified = await pdfDoc.save();
          
          // Upload to Supabase
          const supabase = getSupabaseClient();
          const fileName = `${request.certificateType}_${requestId}_${fileNameSuffix}_${Date.now()}.pdf`;
          
          const { data, error } = await supabase.storage
            .from("bms646-app")
            .upload(`certificates/${fileName}`, pdfBytesModified, {
              contentType: "application/pdf",
              upsert: true,
            });
          
          if (error) throw error;
          
          const { data: publicUrlData } = supabase.storage
            .from("bms646-app")
            .getPublicUrl(`certificates/${fileName}`);
          
          return publicUrlData.publicUrl;
        } catch (error) {
          console.error("PDF generation error:", error);
          throw error;
        }
      };
      
      // Generate both user and admin versions
      const [userFileUrl, adminFileUrl] = await Promise.all([
        generateAndUploadPDF(config.file, "user"),
        generateAndUploadPDF(config.adminFile, "admin"),
      ]);
      
      // Save both URLs to the database
      request.generatedFile = userFileUrl;
      request.adminGeneratedFile = adminFileUrl;
      
      console.log(`✅ PDF generated successfully for e-blotter ${requestId}`);
    }
    
    await request.save();

    // Log admin activity
    await AdminActivityLog.create({
      adminId,
      actionType: "UPDATE_BLOTTER_STATUS",
      details: `Updated e-blotter ${requestId} status to ${status}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `E-Blotter status updated to ${status}`,
      data: request,
    });
  } catch (error) {
    console.error("Error updating blotter status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  requestCertificate,
  approveCertificateRequest,
  rejectCertificateRequest,
  getPendingRequests,
  getAllCertificateRequestIds,
  getUserCertificatesByStatus,
  checkUserStatus,
  updateBlotterStatus,
};
