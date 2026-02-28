/** @format */

import { useState, useRef, useEffect } from "react";
import Modal from "./ui/Modal";
import { useNavigate } from "react-router-dom";
import brgylogo from "../assets/BrgyLogo.png";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Calendar,
  MapPin,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import "../../src/CardFlip.css";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import axiosInstance from "./auth/axiosInstance";

const UserLoginCard = () => {
  // Login form state
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [isStatusFlipped, setIsStatusFlipped] = useState(false);
  const [accountStatus, setAccountStatus] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Phone, 2: OTP, 3: New Password
  const [forgotPasswordData, setForgotPasswordData] = useState({
    phone: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetOtpCountdown, setResetOtpCountdown] = useState(0);
  const [showResetPasswords, setShowResetPasswords] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  // Signup form state
  const [step, setStep] = useState(1);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [idImage, setIdImage] = useState(null);
  const [idPreview, setIdPreview] = useState("");
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    phone: "",
    birthdate: "",
    address: "",
    houseNumber: "",
    otp: "",
    email: "",
    isHeadOfFamily: false,
  });

  const [showIdModal, setShowIdModal] = useState(false);
  const [headOfFamilyExists, setHeadOfFamilyExists] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  const navigate = useNavigate();
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showConfirmPasswordField, setShowConfirmPasswordField] =
    useState(false);

  // Real-time signup password validation with useEffect
  useEffect(() => {
    validateSignupPasswords(formData);
  }, [formData.password, formData.confirmPassword]);

  // Real-time forgot password validation with useEffect
  const [signupPasswordErrors, setSignupPasswordErrors] = useState({
    length: false,
    specialChar: false,
    match: false
  });

  const [signupPasswordFieldErrors, setSignupPasswordFieldErrors] = useState({
    length: '',
    specialChar: '',
    match: ''
  });

  const validateSignupPasswords = (data) => {
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    
    const isLengthValid = data.password.length >= 6;
    const hasSpecialChar = specialCharRegex.test(data.password);
    const passwordsMatch = data.password === data.confirmPassword && data.password.length > 0;
    
    const newErrors = {
      length: isLengthValid,
      specialChar: hasSpecialChar,
      match: passwordsMatch
    };
    
    setSignupPasswordErrors(newErrors);

    // Set field-specific error messages
    setSignupPasswordFieldErrors({
      length: data.password.length > 0 && !isLengthValid ? 'Password must be at least 6 characters long' : '',
      specialChar: data.password.length > 0 && !hasSpecialChar ? 'Password must contain at least one special character' : '',
      match: data.confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : ''
    });

    return newErrors.length && newErrors.specialChar && newErrors.match;
  };

  // Check if signup password meets basic requirements (for step progression)
  const isSignupPasswordRequirementsMet = () => {
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    const isLengthValid = formData.password.length >= 6;
    const hasSpecialChar = specialCharRegex.test(formData.password);
    
    return isLengthValid && hasSpecialChar;
  };

  // Street options
  const streetOptions = [
    "J. Nepomuceno",
    "N. Padilla",
    "Mithi",
    "Espinosa",
    "P. Casal",
    "General Solano",
  ];

  // Function to check head of family
  const checkHeadOfFamily = async (houseNumber, lastName) => {
    if (!houseNumber.trim() || !lastName) {
      setHeadOfFamilyExists(false);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/user/check-head-of-family?houseNumber=${encodeURIComponent(
          houseNumber.trim()
        )}&lastName=${encodeURIComponent(lastName)}`
      );
      setHeadOfFamilyExists(response.data.exists);
    } catch (error) {
      console.error("Error checking head of family:", error);
      setHeadOfFamilyExists(false);
    }
  };

  const validateBirthdate = (dateString) => {
    // Check MM/DD/YYYY format
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;

    if (!regex.test(dateString)) {
      return false;
    }

    // Parse the date to check if it's valid
    const parts = dateString.split("/");
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Create date object (months are 0-indexed in JavaScript)
    const date = new Date(year, month - 1, day);

    // Check if the date is valid and matches the input
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };
  const handleSendOtp = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address");
      return;
    }
    
    if (!formData.phone) {
      toast.error("Please enter your phone number");
      return;
    }
    
    setLoading(true);
    setOtpCountdown(60);

    const timer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const response = await axiosInstance.post("/otp/send", {
        phoneNumber: formData.phone,
        email: formData.email,
      });

      if (response.data.success) {
        toast.success("OTP sent to your email and phone");
        setStep(step + 1);
      } else if (response.data.success === false) {
        toast.error(response.data.message);
        return;
      } else {
        toast.info(response.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setOtpCountdown(60);

    const timer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const response = await axiosInstance.post("/otp/send", {
        phoneNumber: formData.phone,
        email: formData.email,
      });

      if (response.data.success) {
        toast.success("OTP resent to your email and phone");
      } else if (response.data.success === false) {
        toast.error(response.data.message);
        return;
      } else {
        toast.info(response.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSendOtp = async () => {
    setLoading(true);
    setOtpCountdown(60);

    const timer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const response = await axiosInstance.post("/otp/forgot-send", {
        phoneNumber: formData.phone,
      });

      if (response.data.success) {
        toast.success("OTP sent to your phone ");
        setForgotPasswordStep(forgotPasswordStep + 1);
      } else if (response.data.success === false) {
        toast.error(response.data.message);
        return;
      } else {
        toast.info(response.data.message);
      }
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post("/user/user-login", {
        phoneNumber: phone,
        password,
      });

      if (response.data.success) {
        localStorage.setItem("userToken", response.data.token);
        navigate("/dashboard");
      } else if (response.data.error) {
        toast.error(response.data.message);
      } else if (!response.data.isApproved) {
        setAccountStatus(response.data.status);
        setRejectionReasons(response.data.reasons);
        setIsStatusFlipped(true);
        setShowStatus(true);
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.put("/user/forgot-password", {
        phoneNumber: formData.phone,
        newPassword: forgotPasswordData.newPassword,
        confirmNewPassword: forgotPasswordData.confirmPassword,
      });

      if (response.data.success) {
        toast.success("Password changed successfully.");
        setIsResettingPassword(false);
        setShowForgotPassword(false);
        setForgotPasswordStep(1);
        setForgotPasswordData({
          phone: "",
          otp: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else if (response.data.success === false) {
        toast.error(response.data.message);
        return false;
      }
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setIsResettingPassword(true);

    if (forgotPasswordStep === 1) {
      // Send OTP to phone
      const success = await handleForgotSendOtp();

      if (!success) {
        setIsResettingPassword(false);
        return;
      }
    } else if (forgotPasswordStep === 2) {
      // Verify OTP
      if (!formData.otp) {
        toast.info("Please enter the OTP");
        setIsResettingPassword(false);
        return;
      }

      const success = await forgotverifyOtp();

      if (!success) {
        setIsResettingPassword(false);
        return;
      }
    } else if (forgotPasswordStep === 3) {
      // Reset password
      if (
        forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword
      ) {
        toast.error("Passwords don't match!");
        setIsResettingPassword(false);
        return;
      }
      if (forgotPasswordData.newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        setIsResettingPassword(false);
        return;
      }

      handleChangePassword();
    }
  };

  const handleSendResetOtp = () => {
    console.log("Reset OTP sent to:", forgotPasswordData.phone);
    setResetOtpCountdown(60);

    const timer = setInterval(() => {
      setResetOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleForgotPasswordInputChange = (e) => {
    const { name, value } = e.target;
    setForgotPasswordData({
      ...forgotPasswordData,
      [name]: value,
    });
  };

  const toggleResetPasswordVisibility = (field) => {
    setShowResetPasswords({
      ...showResetPasswords,
      [field]: !showResetPasswords[field],
    });
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();

    // Validate email and phone are provided
    if (!formData.email) {
      toast.error("Email address is required");
      return;
    }

    if (!formData.phone) {
      toast.error("Phone number is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate phone format (should start with 09 and be 11 digits)
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Please enter a valid phone number (09XXXXXXXX)");
      return;
    }

    // Validate birthdate format when on step 2 or beyond
    if (
      step >= 2 &&
      formData.birthdate &&
      isNaN(Date.parse(formData.birthdate))
    ) {
      toast.error("Please enter a valid birthdate.");
      return;
    }

    if (step === 1) {
      // Check if password meets basic requirements for step progression
      if (!isSignupPasswordRequirementsMet()) {
        toast.error("Password must be at least 6 characters long and contain a special character");
        return;
      }
      
      // Also check if passwords match when both are filled
      if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    if (step === 3) {
      verifyOtp();
      return;
    }

    if (step === 4 && !idImage) {
      setShowIdModal(true);
      return;
    }

    if (step < 4) {
      if (step === 1) {
        setStep(step + 1);
      } else if (step === 2) {
        handleSendOtp();
      }
    } else {
      registerUser();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleBirthdateChange = (e) => {
    setFormData({
      ...formData,
      birthdate: e.target.value,
    });
  };

  // Add onBlur validation
  const handleBirthdateBlur = () => {
    if (formData.birthdate && !validateBirthdate(formData.birthdate)) {
      toast.error("Please enter a valid birthdate in MM/DD/YYYY format");
    }
  };

  const forgotverifyOtp = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/otp/verify", {
        phoneNumber: formData.phone,
        otp: formData.otp,
      });

      if (response.data.success) {
        toast.success("OTP verified successfully");
        setForgotPasswordStep(forgotPasswordStep + 1);
      } else if (response.data.success === false) {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error(response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/otp/verify", {
        phoneNumber: formData.phone,
        otp: formData.otp,
      });

      if (response.data.success) {
        toast.success("OTP verified successfully");
        setStep(step + 1);
      } else if (response.data.success === false) {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error(response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async () => {
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("phoneNumber", formData.phone);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.confirmPassword);
      formDataToSend.append("birthdate", formData.birthdate);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("houseNumber", formData.houseNumber);
      formDataToSend.append(
        "isHeadofFamily",
        formData.isHeadOfFamily ? "true" : "false"
      );

      if (idImage) {
        formDataToSend.append("validId", idImage);
      }

      const response = await axiosInstance.post(
        "/user/user-register",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        console.log("User registered successfully");
        localStorage.setItem("userToken", response.data.token);
        navigate("/dashboard");
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }
      setIdImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const togglePasswordFieldVisibility = () => {
    setShowPasswordField(!showPasswordField);
  };

  const toggleConfirmPasswordFieldVisibility = () => {
    setShowConfirmPasswordField(!showConfirmPasswordField);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Special handling for birthdate to allow proper editing
    if (name === "birthdate") {
      setFormData({
        ...formData,
        [name]: value,
      });
      return;
    }

    if (name === "houseNumber") {
      setFormData({
        ...formData,
        [name]: value,
      });
      // Pass both houseNumber and lastName to the check
      checkHeadOfFamily(value, formData.lastName);
    } else if (name === "lastName") {
      setFormData({
        ...formData,
        [name]: value,
      });
      // Also check when lastName changes if houseNumber is already filled
      if (formData.houseNumber) {
        checkHeadOfFamily(formData.houseNumber, value);
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleAddressSelect = (street) => {
    setFormData({
      ...formData,
      address: street,
    });
    setShowAddressDropdown(false);
  };

  const handleApplyAgain = () => {
    setIsStatusFlipped(false);
    setTimeout(() => {
      setShowStatus(false);
      setIsFlipped(true);
      setStep(1);
      setFormData({
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
        phone: "",
        birthdate: "",
        address: "",
        houseNumber: "",
        otp: "",
        email: "",
        isHeadOfFamily: false,
      });
      setIdImage(null);
      setIdPreview("");
      setHeadOfFamilyExists(false);
    }, 300);
  };

  const handleReturnToLogin = () => {
    setIsStatusFlipped(false);
    setTimeout(() => {
      setShowStatus(false);
      setIsFlipped(false);
      setStep(1);
      setFormData({
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
        phone: "",
        birthdate: "",
        address: "",
        houseNumber: "",
        otp: "",
        email: "",
        isHeadOfFamily: false,
      });
      setIdImage(null);
      setIdPreview("");
      setHeadOfFamilyExists(false);
    }, 300);
  };

  const renderSignupStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="mb-4 space-y-4">
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <Phone className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number (09XXXXXXXX)"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <Mail className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <Lock className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type={showPasswordField ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                onClick={togglePasswordFieldVisibility}
                className="text-gray-400 focus:outline-none"
              >
                {showPasswordField ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {formData.password.length > 0 && signupPasswordFieldErrors.length && (
              <div className="text-xs text-red-600 mt-1 ml-3">
                {signupPasswordFieldErrors.length}
              </div>
            )}
            {formData.password.length > 0 && signupPasswordFieldErrors.specialChar && (
              <div className="text-xs text-red-600 mt-1 ml-3">
                {signupPasswordFieldErrors.specialChar}
              </div>
            )}

            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <Lock className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type={showConfirmPasswordField ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordFieldVisibility}
                className="text-gray-400 focus:outline-none"
              >
                {showConfirmPasswordField ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {formData.confirmPassword.length > 0 && signupPasswordFieldErrors.match && (
              <div className="text-xs text-red-600 mt-1 ml-3">
                {signupPasswordFieldErrors.match}
              </div>
            )}

            {/* Password Requirements
            <div className="bg-gray-50 rounded-md p-3 space-y-2">
              <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
              <div className="space-y-1">
                <div className="flex items-center text-xs">
                  <span className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                    signupPasswordErrors.length ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {signupPasswordErrors.length ? '✓' : ''}
                  </span>
                  <span className={signupPasswordErrors.length ? 'text-green-700' : 'text-gray-600'}>
                    At least 6 characters long
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                    signupPasswordErrors.specialChar ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {signupPasswordErrors.specialChar ? '✓' : ''}
                  </span>
                  <span className={signupPasswordErrors.specialChar ? 'text-green-700' : 'text-gray-600'}>
                    Contains special character (!@#$%^&* etc.)
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                    signupPasswordErrors.match ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {signupPasswordErrors.match ? '✓' : ''}
                  </span>
                  <span className={signupPasswordErrors.match ? 'text-green-700' : 'text-gray-600'}>
                    Passwords match
                  </span>
                </div>
              </div>
            </div> */}
          </div>
        );
      case 2:
        return (
          <div className="mb-4 space-y-4">
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 relative focus-within:border-black">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <DatePicker
                selected={formData.birthdate ? new Date(formData.birthdate) : null}
                onChange={(date) => handleInputChange({ target: { name: 'birthdate', value: date } })}
                placeholderText="Birthdate"
                className="w-full caret-black outline-none text-sm sm:text-base"
                dateFormat="MM/dd/yyyy"
                isClearable={false}
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                required
              />
            </div>

            {/* Address Dropdown */}
            <div className="relative">
              <div
                className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black cursor-pointer"
                onClick={() => setShowAddressDropdown(!showAddressDropdown)}
              >
                <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                <span
                  className={`flex-1 text-left ${
                    formData.address ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {formData.address || "Select Street"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    showAddressDropdown ? "rotate-180" : ""
                  }`}
                />
              </div>

              {showAddressDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 shadow-lg z-10 max-h-60 overflow-y-auto">
                  {streetOptions.map((street, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleAddressSelect(street)}
                    >
                      {street}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <MapPin className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                name="houseNumber"
                placeholder="House Number"
                className="w-full caret-black outline-none text-sm sm:text-base text-gray-500"
                value={formData.houseNumber}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="mb-4 space-y-4">
            <p className="text-sm text-gray-500 text-center mb-4">
              We've sent a verification code to {formData.email} and {formData.phone}
            </p>

            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <Lock className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                className={`w-full caret-black outline-none text-sm sm:text-base ${
                  formData.otp ? "text-black" : "text-gray-500"
                }`}
                value={formData.otp}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="text-center">
              {otpCountdown > 0 ? (
                <p className="text-xs text-gray-500">
                  Resend OTP in {otpCountdown} seconds
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="mb-4 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Please upload a clear photo of your government-issued ID
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={triggerFileInput}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {idPreview ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={idPreview}
                      alt="ID Preview"
                      className="h-40 object-contain border rounded-md"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Click to upload ID photo
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      (JPEG, PNG, max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="scene">
      <div
        className={`card ${isFlipped ? "is-flipped" : ""} ${
          showStatus ? "status-mode" : ""
        }`}
      >
        {/* Front Face - Login Form */}
        {!showStatus && !showForgotPassword && (
          <div className="card__face card__face--front">
            {loading && (
              <div className="absolute inset-0 bg-white/50 bg-opacity-80 z-10 flex items-center justify-center rounded-lg">
                <Loader />
              </div>
            )}

            <div className="bg-white rounded-lg p-6 sm:p-8 w-full h-full flex flex-col">
              <div className="flex justify-center mb-4">
                <img
                  src={brgylogo}
                  alt="BMS646 Logo"
                  className="h-10 sm:h-12"
                />
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2">
                Sign in to continue
              </h2>
              <p className="text-sm sm:text-base text-gray-500 text-center mb-7">
                Please sign in to start your session
              </p>

              <form
                onSubmit={handleLoginSubmit}
                className="flex-grow flex flex-col"
              >
                <div className="mb-4">
                  <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 mb-4 focus-within:border-black">
                    <Phone className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                      type="tel"
                      placeholder="Email or Phone Number"
                      className="w-full caret-black outline-none text-sm sm:text-base"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
                    <Lock className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="w-full caret-black outline-none text-sm sm:text-base"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="text-gray-400 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end mb-4">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors mb-4 text-sm sm:text-base"
                >
                  Login
                </button>
              </form>

              <div className="text-center mt-auto">
                <p className="text-sm text-gray-600">Don't have an account? </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(true);
                    setStep(1);
                    setFormData({
                      firstName: "",
                      lastName: "",
                      password: "",
                      confirmPassword: "",
                      phone: "",
                      birthdate: "",
                      address: "",
                      houseNumber: "",
                      otp: "",
                      email: "",
                      isHeadOfFamily: false,
                    });
                    setIdImage(null);
                    setIdPreview("");
                    setHeadOfFamilyExists(false);
                  }}
                  className="text-xs font-medium mt-2 text-gray-900 underline cursor-pointer hover:text-gray-700"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Forgot Password Form */}
        {showForgotPassword && (
          <div className="card__face card__face--front">
            {loading && (
              <div className="absolute inset-0 bg-white/50 bg-opacity-80 z-10 flex items-center justify-center rounded-lg">
                <Loader />
              </div>
            )}
            <div className="bg-white rounded-lg p-6 sm:p-8 w-full h-full flex flex-col">
              <div className="flex justify-center mb-4">
                <img
                  src={brgylogo}
                  alt="BMS646 Logo"
                  className="h-10 sm:h-12"
                />
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2">
                {forgotPasswordStep === 1 && "Forgot Password"}
                {forgotPasswordStep === 2 && "Verify OTP"}
                {forgotPasswordStep === 3 && "Reset Password"}
              </h2>
              <p className="text-sm sm:text-base text-gray-500 text-center mb-7">
                {forgotPasswordStep === 1 &&
                  "Enter your phone number to reset your password"}
                {forgotPasswordStep === 2 &&
                  `We've sent a verification code to ${forgotPasswordData.phone}`}
                {forgotPasswordStep === 3 && "Enter your new password"}
              </p>

              <form
                onSubmit={handleForgotPasswordSubmit}
                className="flex-grow flex flex-col"
              >
                <div className="mb-8 space-y-4">
                  {forgotPasswordStep === 1 && (
                    <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
                      <Phone className="w-5 h-5 text-gray-400 mr-2" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Email or Phone Number"
                        className="w-full caret-black outline-none text-sm sm:text-base"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}

                  {forgotPasswordStep === 2 && (
                    <>
                      <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
                        <Lock className="w-5 h-5 text-gray-400 mr-2" />
                        <input
                          type="text"
                          name="otp"
                          placeholder="Enter OTP"
                          className="w-full caret-black outline-none text-sm sm:text-base"
                          value={formData.otp}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="text-center">
                        {resetOtpCountdown > 0 ? (
                          <p className="text-xs text-gray-500">
                            Resend OTP in {resetOtpCountdown} seconds
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendResetOtp}
                            className="text-xs text-gray-900 hover:text-gray-700"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {forgotPasswordStep === 3 && (
                    <>
                      <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
                        <Lock className="w-5 h-5 text-gray-400 mr-2" />
                        <input
                          type={
                            showResetPasswords.newPassword ? "text" : "password"
                          }
                          name="newPassword"
                          placeholder="New Password"
                          className="w-full caret-black outline-none text-sm sm:text-base"
                          value={forgotPasswordData.newPassword}
                          onChange={handleForgotPasswordInputChange}
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            toggleResetPasswordVisibility("newPassword")
                          }
                          className="text-gray-400 focus:outline-none"
                        >
                          {showResetPasswords.newPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
                        <Lock className="w-5 h-5 text-gray-400 mr-2" />
                        <input
                          type={
                            showResetPasswords.confirmPassword
                              ? "text"
                              : "password"
                          }
                          name="confirmPassword"
                          placeholder="Confirm New Password"
                          className="w-full caret-black outline-none text-sm sm:text-base"
                          value={forgotPasswordData.confirmPassword}
                          onChange={handleForgotPasswordInputChange}
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            toggleResetPasswordVisibility("confirmPassword")
                          }
                          className="text-gray-400 focus:outline-none"
                        >
                          {showResetPasswords.confirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordStep(1);
                    setForgotPasswordData({
                      phone: "",
                      otp: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setForgotPasswordMessage("");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 mb-2"
                >
                  ← Back to Login
                </button>

                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className={`w-full bg-black text-white py-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors mb-4 text-sm sm:text-base ${
                    isResettingPassword ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isResettingPassword
                    ? forgotPasswordStep === 1
                      ? "Sending OTP..."
                      : forgotPasswordStep === 2
                      ? "Verifying..."
                      : "Resetting..."
                    : forgotPasswordStep === 1
                    ? "Send OTP"
                    : forgotPasswordStep === 2
                    ? "Verify OTP"
                    : "Reset Password"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Back Face - Multi-step Signup Form */}
        {!showStatus && !showForgotPassword && (
          <div className="card__face card__face--back overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-white/50 bg-opacity-80 z-10 flex items-center justify-center rounded-lg">
                <Loader />
              </div>
            )}
            <div className="bg-white rounded-lg p-6 sm:p-8 w-full h-full flex flex-col">
              <div className="flex justify-center mb-4">
                <img
                  src={brgylogo}
                  alt="BMS646 Logo"
                  className="h-10 sm:h-12"
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2">
                Create Account
              </h2>
              <p className="text-sm sm:text-base text-gray-500 text-center mb-6">
                {step === 1 && "Basic Information"}
                {step === 2 && "Additional Information"}
                {step === 3 && "Verify Your Phone"}
                {step === 4 && "ID Verification"}
              </p>

              <form
                onSubmit={handleSignupSubmit}
                className="flex-grow flex flex-col"
              >
                {renderSignupStep()}

                {step > 1 && step < 4 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="text-xs text-gray-500 hover:text-gray-700 mb-2"
                  >
                    ← Back
                  </button>
                )}

                <button
                  type="submit"
                  disabled={step === 1 && !isSignupPasswordRequirementsMet()}
                  className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors mb-4 text-sm sm:text-base mt-auto disabled:opacity-50"
                >
                  {step === 1
                    ? "Next"
                    : step === 2
                    ? "Send OTP"
                    : step === 3
                    ? "Verify Account"
                    : "Complete Registration"}
                </button>
              </form>

              {/* Modal for ID not uploaded */}
              {/* Modal for ID not uploaded */}
              {showIdModal && (
                <Modal onClose={() => setShowIdModal(false)}>
                  <div className="text-center">
                    <div className="flex justify-center mb-7">
                      <img
                        src={brgylogo}
                        alt="BMS646 Logo"
                        className="h-10 sm:h-17"
                      />
                    </div>

                    <h3 className="text-2xl font-semibold mb-6 text-white">
                      No ID Uploaded
                    </h3>
                    <p className="mb-4 text-white">
                      If you don't upload your ID, you won't be able to request
                      documents.
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
                        onClick={() => setShowIdModal(false)}
                      >
                        Upload ID
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-black cursor-pointer"
                        onClick={() => {
                          registerUser();
                        }}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </Modal>
              )}

              <div className="text-center mt-auto">
                <p className="text-sm text-gray-600">
                  Already have an account?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setStep(1);
                    setFormData({
                      firstName: "",
                      lastName: "",
                      password: "",
                      confirmPassword: "",
                      phone: "",
                      birthdate: "",
                      address: "",
                      houseNumber: "",
                      otp: "",
                      email: "",
                      isHeadOfFamily: false,
                    });
                    setIdImage(null);
                    setIdPreview("");
                    setHeadOfFamilyExists(false);
                  }}
                  className="text-xs font-medium mt-2 text-gray-900 underline cursor-pointer hover:text-gray-700"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Face - Account Status */}
        {showStatus && (
          <div
            className={`card__face card__face--status ${
              isStatusFlipped ? "is-flipped" : ""
            }`}
          >
            <div className="bg-white rounded-lg p-6 sm:p-8 w-full h-full flex flex-col">
              <div className="flex justify-center mb-4">
                <img
                  src={brgylogo}
                  alt="BMS646 Logo"
                  className="h-10 sm:h-12"
                />
              </div>

              <div className="flex-grow flex flex-col items-center justify-center text-center">
                {accountStatus === "pending" && (
                  <>
                    <Clock className="w-16 h-16 text-yellow-500 mb-4" />
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                      Application Pending
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Your account is under review. Please wait for approval.
                    </p>
                  </>
                )}

                {accountStatus === "rejected" && (
                  <>
                    <XCircle className="w-16 h-16 text-red-500 mb-4" />
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                      Application Rejected
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Your application has been rejected for the following
                      reasons:
                    </p>
                    <ul className="text-sm text-gray-600 mb-6 text-left">
                      {rejectionReasons.map((reason, index) => (
                        <li key={index} className="mb-1">
                          • {reason}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {accountStatus === "approved" && (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                      Application Approved
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Your account has been approved. You can now log in.
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-3">
                {accountStatus === "rejected" && (
                  <button
                    onClick={handleApplyAgain}
                    className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors text-sm sm:text-base"
                  >
                    Apply Again
                  </button>
                )}
                <button
                  onClick={handleReturnToLogin}
                  className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors text-sm sm:text-base"
                >
                  {accountStatus === "rejected"
                    ? "Return to Login"
                    : "Back to Login"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserLoginCard;
