/** @format */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const axios = require("axios");
const nodemailer = require("nodemailer");
const User = require("../models/user_model");
const OTP = require("../models/otp_ model");
const sgMail = require("@sendgrid/mail");

// Backup Gmail transporter
let gmailTransporter = null;
if (process.env.AUTH_EMAIL && process.env.AUTH_PASS) {
  gmailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
    },
  });
  console.log("|  ✅ Gmail backup transporter configured.");
}

// let transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.AUTH_EMAIL,
//     pass: process.env.AUTH_PASS,
//   },
// });

// // Verify transporter
// transporter.verify((error) => {
//   if (error) {
//     console.error("| ❌ Transporter Error:", error);
//   } else {
//     console.log("| ✅ Transporter Ready to Send Emails");
//   }
// });


if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ SendGrid API key not found in environment variables!");
  console.log("📧 Please add SENDGRID_API_KEY to your .env file");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("|  ✅ SendGrid API key loaded successfully.");
}

if (!process.env.AUTH_EMAIL) {
  console.error("❌ AUTH_EMAIL not found in environment variables!");
  console.log("📧 Please add AUTH_EMAIL to your .env file");
} else {
  console.log("|  ✅ AUTH_EMAIL loaded successfully:", process.env.AUTH_EMAIL);
}

if (!process.env.CLICKSEND_USERNAME || !process.env.CLICKSEND_API_KEY) {
  console.error("❌ ClickSend credentials not found in environment variables!");
  console.log("📱 Please add CLICKSEND_USERNAME and CLICKSEND_API_KEY to your .env file");
} else {
  console.log("|  ✅ ClickSend credentials loaded successfully.");
}

// SEND OTP via SMS using Axios
const sendOTP = async (req, res) => {
  try {
    const { phoneNumber, email } = req.body;

    // ✅ Check if value is an email
    const isEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    // ✅ Check if OTP record exists for this number/email
    const existingOTP = await OTP.findOne({ phoneNumber });

    if (existingOTP) {
      if (existingOTP.verified) {
        return res.json({
          success: false,
          message: "Phone number is already linked to an account.",
        });
      } else {
        // Delete old unverified OTP
        await OTP.deleteOne({ _id: existingOTP._id });
      }
    }

    // ✅ Generate and hash new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // ✅ Save new OTP record
    const newOTP = new OTP({
      phoneNumber,
      otp: hashedOTP,
      expiresAt,
      verified: false,
    });

    await newOTP.save();

    // ✅ Send OTP via EMAIL
    if (email && isEmail(email)) {
      console.log("📧 Attempting to send OTP email to:", email);
      
      if (!process.env.SENDGRID_API_KEY) {
        console.error("❌ Cannot send email: SENDGRID_API_KEY not configured");
      } else if (!process.env.AUTH_EMAIL) {
        console.error("❌ Cannot send email: AUTH_EMAIL not configured");
      } else {
        console.log("📧 SendGrid API Key exists:", !!process.env.SENDGRID_API_KEY);
        console.log("📧 AUTH_EMAIL:", process.env.AUTH_EMAIL);
        
        try {
          const msg = {
            to: email,
            from: {
              email: process.env.AUTH_EMAIL,
              name: "Barangay 646",
            },
            subject: "Barangay 646 Verification Code",
            text: `Your verification code for Barangay 646 is: ${otpCode}. This code is valid for 5 minutes.`,
            html: `<p>Your verification code for <strong>Barangay 646</strong> is: <strong>${otpCode}</strong>.</p><p>This code is valid for <strong>5 minutes</strong>.</p>`,
          };

          await sgMail.send(msg);
          console.log("✅ OTP email sent successfully via SendGrid to:", email);
        } catch (emailError) {
          console.error("❌ SendGrid error:", emailError.response?.body || emailError.message);
          
          // Try backup Gmail service
          if (gmailTransporter) {
            try {
              console.log("📧 Attempting backup Gmail service...");
              const backupMsg = {
                from: `"Barangay 646" <${process.env.AUTH_EMAIL}>`,
                to: email,
                subject: "Barangay 646 Verification Code",
                text: `Your verification code for Barangay 646 is: ${otpCode}. This code is valid for 5 minutes.`,
                html: `<p>Your verification code for <strong>Barangay 646</strong> is: <strong>${otpCode}</strong>.</p><p>This code is valid for <strong>5 minutes</strong>.</p>`,
              };
              
              await gmailTransporter.sendMail(backupMsg);
              console.log("✅ OTP email sent successfully via Gmail backup to:", email);
            } catch (gmailError) {
              console.error("❌ Gmail backup also failed:", gmailError.message);
              console.log("📧 Both email services failed, continuing with SMS only");
            }
          } else {
            console.log("📧 Gmail backup not configured, continuing with SMS only");
          }
        }
      }
    } else {
      console.log("📧 Email not provided or invalid, skipping email sending");
    }

    // ✅ Send OTP via SMS (if phone number is provided)
    if (phoneNumber) {
      console.log("📱 SMS SENDING PROCESS STARTED");
      console.log("📱 Phone number received:", phoneNumber);
      console.log("📱 ClickSend Username:", process.env.CLICKSEND_USERNAME);
      console.log("📱 ClickSend API Key exists:", !!process.env.CLICKSEND_API_KEY);
      
      if (!process.env.CLICKSEND_USERNAME || !process.env.CLICKSEND_API_KEY) {
        console.error("❌ SMS FAILED: ClickSend credentials not configured");
        console.error("❌ Missing:", !process.env.CLICKSEND_USERNAME ? "CLICKSEND_USERNAME" : "CLICKSEND_API_KEY");
      } else {
        // Test ClickSend credentials first
        console.log("📱 Step 1: Testing ClickSend credentials...");
        try {
          const testResponse = await axios.get("https://rest.clicksend.com/v3/account", {
            auth: {
              username: process.env.CLICKSEND_USERNAME,
              password: process.env.CLICKSEND_API_KEY,
            },
          });
          console.log("✅ Step 1 PASSED: ClickSend credentials valid");
          console.log("📱 Account info:", JSON.stringify(testResponse.data, null, 2));
        } catch (authError) {
          console.error("❌ Step 1 FAILED: ClickSend authentication failed");
          console.error("❌ Auth Error Details:", authError.response?.data || authError.message);
          console.error("❌ Status Code:", authError.response?.status);
          console.error("❌ Please check your CLICKSEND_USERNAME and CLICKSEND_API_KEY");
          // Don't proceed with SMS if auth fails
          return;
        }
        
        console.log("📱 Step 2: Preparing SMS message...");
        try {
          // Validate phone number format
          if (!phoneNumber.startsWith('09') || phoneNumber.length !== 11) {
            console.error("❌ Step 2 FAILED: Invalid phone number format");
            console.error("❌ Expected: 09XXXXXXXX (11 digits starting with 09)");
            console.error("❌ Received:", phoneNumber);
            return;
          }
          
          const formattedNumber = `+63${phoneNumber.slice(1)}`;
          console.log("📱 Step 2 PASSED: Phone number formatted to:", formattedNumber);
          
          const smsMessage = {
            messages: [
              {
                source: "nodejs",
                body: `Your OTP is ${otpCode}. It will expire in 5 minutes.`,
                to: formattedNumber,
                from: "Barangay646",
              },
            ],
          };
          
          console.log("📱 Step 3: Sending SMS to ClickSend API...");
          console.log("📱 SMS Message payload:", JSON.stringify(smsMessage, null, 2));

          const response = await axios.post("https://rest.clicksend.com/v3/sms/send", smsMessage, {
            auth: {
              username: process.env.CLICKSEND_USERNAME,
              password: process.env.CLICKSEND_API_KEY,
            },
            headers: { "Content-Type": "application/json" },
          });
          
          console.log("✅ Step 3 PASSED: ClickSend API responded successfully");
          console.log("📱 Full API Response:", JSON.stringify(response.data, null, 2));
          
          // Check if SMS was actually accepted
          if (response.data.data && response.data.data.messages) {
            const messageStatus = response.data.data.messages[0];
            console.log("📱 Message Status:", messageStatus.status);
            console.log("📱 Message ID:", messageStatus.message_id);
            
            if (messageStatus.status === 'SUCCESS') {
              console.log("✅ SMS SUCCESS: OTP SMS submitted successfully to:", phoneNumber);
            } else {
              console.error("⚠️ SMS WARNING: Message not submitted. Status:", messageStatus.status);
            }
          } else {
            console.error("⚠️ SMS WARNING: Unexpected response format");
          }
          
        } catch (smsError) {
          console.error("❌ Step 3 FAILED: SMS sending failed");
          console.error("❌ Error Type:", smsError.name);
          console.error("❌ Error Message:", smsError.message);
          console.error("❌ Response Data:", smsError.response?.data);
          console.error("❌ Response Status:", smsError.response?.status);
          console.error("❌ Response Headers:", smsError.response?.headers);
          console.error("❌ Full Error Object:", JSON.stringify(smsError, null, 2));
          
          // Specific error handling
          if (smsError.response?.status === 401) {
            console.error("❌ SPECIFIC: Authentication failed - check username/API key");
          } else if (smsError.response?.status === 402) {
            console.error("❌ SPECIFIC: Payment required - insufficient credits");
          } else if (smsError.response?.status === 400) {
            console.error("❌ SPECIFIC: Bad request - check phone number format");
          } else if (smsError.response?.status === 429) {
            console.error("❌ SPECIFIC: Rate limit exceeded - too many requests");
          }
        }
      }
    } else {
      console.log("📱 SMS NOT SENT: No phone number provided");
    }

    // ✅ Return success response
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully via email and SMS.",
      otpForTesting: otpCode, // ⚠️ remove this in production
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      message: "Server error while sending OTP",
      error: error.message,
    });
  }
};

const forgotPassSendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // ✅ Check if user exists
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.json({ message: "User not found." });
    }

    // ✅ Remove any old OTP
    const existingOTP = await OTP.findOne({ phoneNumber });
    if (existingOTP) {
      await OTP.deleteOne({ _id: existingOTP._id });
    }

    // ✅ Generate and hash new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // ✅ Save new OTP
    const newOTP = new OTP({
      phoneNumber,
      otp: hashedOTP,
      expiresAt,
      verified: false,
    });
    await newOTP.save();

    // ✅ Decide Email vs SMS
    const isEmail = /\S+@\S+\.\S+/.test(phoneNumber);

    if (isEmail) {
      // 📧 Send via Email
      const msg = {
        to: phoneNumber,
        from: {
          email: process.env.AUTH_EMAIL, // must match your verified SendGrid sender
          name: "Barangay 646",
        },
        subject: "Barangay 646 Verification Code",
        text: `Your verification code for Barangay 646 is: ${otpCode}. It is valid for 5 minutes. Use this code to verify your account.`,
        html: `<p>Your verification code for <strong>Barangay 646</strong> is: <strong>${otpCode}</strong>.</p><p>This code is valid for <strong>5 minutes</strong>.</p>`,
      };

      await sgMail
        .send(msg)
        .then(() => console.log(`✅ OTP email sent to ${phoneNumber}`))
        .catch((err) =>
          console.error(
            "❌ Error sending OTP email:",
            err.response?.body || err
          )
        );
    } else {
      // 📱 Send via SMS (ClickSend)
      const formattedNumber = `+63${phoneNumber.slice(1)}`;
      const smsMessage = {
        messages: [
          {
            source: "nodejs",
            body: `Your OTP is ${otpCode}. It will expire in 5 minutes.`,
            to: formattedNumber,
            from: "Barangay646",
          },
        ],
      };

      await axios.post("https://rest.clicksend.com/v3/sms/send", smsMessage, {
        auth: {
          username: process.env.CLICKSEND_USERNAME,
          password: process.env.CLICKSEND_API_KEY,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
      otpForTesting: otpCode, // 🔥 Remove in production
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      message: "Server error while sending OTP",
      error: error.message,
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res
        .status(400)
        .json({ message: "Phone number and OTP are required." });
    }

    const otpRecord = await OTP.findOne({ phoneNumber });
    if (!otpRecord) {
      return res.json({
        error: true,
        message: "OTP not found. Please request a new one.",
      });
    }

    if (otpRecord.verified) {
      return res.status(200).json({
        error: false,
        message: "Phone number already verified.",
        phoneNumber: otpRecord.phoneNumber,
        verified: true,
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Incorrect OTP. Please try again.",
      });
    }

    // ✅ OTP matched — mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully!",
      phoneNumber: otpRecord.phoneNumber,
      verified: otpRecord.verified,
    });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const sendAnnouncement = async (title, description) => {
  const approvedUsers = await User.find({
    isLoginApproved: true,
    "notificationPreferences.announcements": true, // ✅ filter here
  });

  if (!approvedUsers.length) return;

  const smsMessages = [];

  await Promise.all(
    approvedUsers.map(async (user) => {
      // ✅ If it's an email
      if (user.phoneNumber.includes("@")) {
        const msg = {
          to: user.phoneNumber,
          from: {
            email: process.env.AUTH_EMAIL,
            name: "Barangay 646",
          },
          subject: `📢 URGENT ANNOUNCEMENT: ${title}`,
          text: description,
          html: `
              <h3>📢 Barangay 646 Announcement</h3>
              <p><strong>${title}</strong></p>
              <p>${description}</p>
              <br />
              <p>Stay safe and informed.<br />Barangay 646</p>
            `,
        };

        await sgMail
          .send(msg)
          .then(() =>
            console.log(`✅ Announcement email sent to ${user.phoneNumber}`)
          )
          .catch((err) =>
            console.error(
              `❌ Error sending email to ${user.phoneNumber}:`,
              err.response?.body || err.message
            )
          );
      } else {
        // ✅ If it's a phone number → prepare SMS
        smsMessages.push({
          source: "nodejs",
          body: `📢 Barangay Announcement: ${title}\n\n${description}`,
          to: `+63${user.phoneNumber.slice(1)}`,
          from: "Barangay646",
        });
      }
    })
  );

  // ✅ Send SMS in bulk (only if there are phone users)
  if (smsMessages.length > 0) {
    await axios.post(
      "https://rest.clicksend.com/v3/sms/send",
      { messages: smsMessages },
      {
        auth: {
          username: process.env.CLICKSEND_USERNAME,
          password: process.env.CLICKSEND_API_KEY,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

const sendEventEmail = async (title, description) => {
  // ✅ Only get approved users who allow event notifications
  const approvedUsers = await User.find({
    isLoginApproved: true,
    "notificationPreferences.events": true,
  });

  if (!approvedUsers.length) return;

  await Promise.all(
    approvedUsers.map(async (user) => {
      const recipient = user.phoneNumber;

      // ✅ If recipient is email → send email
      if (recipient.includes("@")) {
        const msg = {
          to: recipient,
          from: {
            email: process.env.AUTH_EMAIL,
            name: "Barangay 646",
          },
          subject: `📅 NEW BARANGAY EVENT: ${title}`,
          text: description,
          html: `
              <h3>📅 New Barangay 646 Event</h3>
              <p><strong>${title}</strong></p>
              <p>${description}</p>
              <br />
              <p>See you there!<br />Barangay 646</p>
            `,
        };

        await sgMail
          .send(msg)
          .then(() => console.log(`✅ Event email sent to ${recipient}`))
          .catch((err) =>
            console.error(
              `❌ Error sending email to ${recipient}:`,
              err.response?.body || err.message
            )
          );
      } else {
        // ✅ If recipient is number → format + send SMS
        let formattedNumber = recipient;
        if (formattedNumber.startsWith("0")) {
          formattedNumber = `+63${formattedNumber.slice(1)}`;
        } else if (formattedNumber.startsWith("9")) {
          formattedNumber = `+63${formattedNumber}`;
        }

        const smsMessage = {
          messages: [
            {
              source: "nodejs",
              body: description,
              to: formattedNumber,
              from: "Barangay646",
            },
          ],
        };

        await axios.post("https://rest.clicksend.com/v3/sms/send", smsMessage, {
          auth: {
            username: process.env.CLICKSEND_USERNAME,
            password: process.env.CLICKSEND_API_KEY,
          },
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    })
  );
};

const sendRequestUpdate = async (title, description, userId) => {
  const user = await User.findById(userId);

  if (!user) return; // user not found

  // ✅ Check if user is eligible
  const isTargetUser =
    user.isLoginApproved && user.notificationPreferences.certificates;

  if (!isTargetUser) return;

  // Check if user has email and send email notification
  if (user.email) {
    // Email path
    const msg = {
      to: user.email,
      from: {
        email: process.env.AUTH_EMAIL,
        name: "Barangay 646",
      },
      subject: `📜 Certificate Request Update: ${title}`,
      text: description,
      html: `
          <h3>📜 Certificate Request Update</h3>
          <p>${description}</p>
          <br>
          <p>Thank you,<br>Barangay 646 Management</p>
        `,
    };

    try {
      await sgMail.send(msg);
      console.log("✅ Certificate update email sent successfully to:", user.email);
    } catch (emailError) {
      console.error("❌ Error sending certificate update email:", emailError.response?.body || emailError.message);
    }
  }

  // Send SMS notification if user has phone number
  if (user.phoneNumber) {
    try {
      const formattedNumber = `+63${user.phoneNumber.slice(1)}`;
      
      const smsMessage = {
        messages: [
          {
            source: "nodejs",
            body: `📜 Certificate Request Update: ${title}\n\n${description}`,
            to: formattedNumber,
            from: "Barangay646",
          },
        ],
      };

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${process.env.CLICKSEND_USERNAME}:${process.env.CLICKSEND_API_KEY}`).toString("base64")}`,
      };

      const response = await axios.post(
        "https://rest.clicksend.com/v3/sms/send",
        smsMessage,
        { headers }
      );

      if (response.data.data && response.data.data.messages && response.data.data.messages.length > 0) {
        const messageStatus = response.data.data.messages[0];
        
        if (messageStatus.status === 'SUCCESS') {
          console.log("✅ Certificate update SMS sent successfully to:", user.phoneNumber);
        } else {
          console.error("⚠️ Certificate update SMS not submitted. Status:", messageStatus.status);
        }
      }
    } catch (smsError) {
      console.error("❌ Error sending certificate update SMS:", smsError.response?.data || smsError.message);
    }
  }
};

module.exports = {
  sendOTP,
  forgotPassSendOTP,
  verifyOTP,
  sendAnnouncement,
  sendEventEmail,
  sendRequestUpdate,
};
