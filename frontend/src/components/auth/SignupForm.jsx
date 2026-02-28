import { useState, useRef } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Calendar,
  MapPin,
  Upload,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { toast } from "react-toastify";

const SignupForm = ({ onBack, onSignupComplete }) => {
  const [step, setStep] = useState(1);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [idImage, setIdImage] = useState(null);
  const [idPreview, setIdPreview] = useState("");
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    phone: "",
    birthdate: "",
    address: "",
    gender: "",
    otp: "",
    email: "",
  });

  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showConfirmPasswordField, setShowConfirmPasswordField] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSendOtp = () => {
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
    toast.success(`OTP sent to ${formData.phone}`);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (step === 1) {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords don't match!");
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          toast.error("Password must be at least 6 characters long");
          setIsLoading(false);
          return;
        }
      }

      if (step === 3 && !formData.otp) {
        toast.error("Please enter the OTP");
        setIsLoading(false);
        return;
      }

      if (step === 4 && !idImage) {
        toast.error("Please upload your ID image");
        setIsLoading(false);
        return;
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (step < 4) {
        if (step === 2) {
          handleSendOtp();
        }
        setStep(step + 1);
        toast.success("Step completed successfully!");
      } else {
        // Complete signup
        console.log("Complete signup data:", {
          ...formData,
          idImage: idImage.name,
        });
        toast.success("Account registration submitted! Please wait for approval.");
        onSignupComplete("pending");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
              <Phone className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="tel"
                name="phone"
                placeholder="Contact Number"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={formData.phone}
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
                onClick={() => setShowPasswordField(!showPasswordField)}
                className="text-gray-400 focus:outline-none"
              >
                {showPasswordField ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

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
                onClick={() =>
                  setShowConfirmPasswordField(!showConfirmPasswordField)
                }
                className="text-gray-400 focus:outline-none"
              >
                {showConfirmPasswordField ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="mb-4 space-y-4">
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 relative focus-within:border-black">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="date"
                name="birthdate"
                className={`w-full caret-black outline-none text-sm sm:text-base ${
                  !formData.birthdate ? "text-transparent" : "text-gray-500"
                }`}
                value={formData.birthdate}
                onChange={handleInputChange}
                required
              />
              {!formData.birthdate && (
                <span className="absolute left-10 text-gray-400 pointer-events-none">
                  Birthdate
                </span>
              )}
            </div>

            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <MapPin className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                name="address"
                placeholder="Address"
                className="w-full caret-black outline-none text-sm sm:text-base text-gray-500"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Gender field removed from here */}
          </div>
        );
      case 3:
        return (
          <div className="mb-4 space-y-4">
            <p className="text-sm text-gray-500 text-center mb-4">
              We've sent a verification code to {formData.phone}
            </p>

            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <Lock className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={formData.otp}
                onChange={handleInputChange}
                maxLength={6}
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
                  onClick={handleSendOtp}
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
                    <p className="text-xs text-gray-500 mt-2">
                      Click to change image
                    </p>
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
    <div className="bg-white rounded-lg p-6 sm:p-8 w-full h-full flex flex-col">
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="mr-3 p-1 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex justify-center flex-1">
          <img
            src="/BrgyLogo.png"
            alt="BMS646 Logo"
            className="h-10 sm:h-12"
          />
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2">
        Create Account - Step {step} of 4
      </h2>
      <p className="text-sm sm:text-base text-gray-500 text-center mb-7">
        {step === 1 && "Enter your personal information"}
        {step === 2 && "Complete your profile details"}
        {step === 3 && "Verify your phone number"}
        {step === 4 && "Upload your identification document"}
      </p>

      <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
        {renderSignupStep()}

        <div className="flex justify-between space-x-3 mt-auto">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gray-900 text-white py-2 rounded-md hover:bg-black transition-colors disabled:opacity-50"
          >
            {isLoading ? "Processing..." : step === 4 ? "Submit Application" : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;