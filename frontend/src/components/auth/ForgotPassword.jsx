import { useState } from "react";
import { Lock, Eye, EyeOff, Phone, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

const ForgotPassword = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1: phone, 2: otp, 3: reset password
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`OTP sent to ${phone}`);
      setStep(2);
      startOtpCountdown();
    } catch (error) {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startOtpCountdown = () => {
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
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // For demo purposes, accept any 6-digit OTP
      if (otp.length === 6) {
        toast.success("OTP verified successfully");
        setStep(3);
      } else {
        toast.error("Invalid OTP. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Password reset successfully! You can now login with your new password.");
      onBack();
    } catch (error) {
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <Phone className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="tel"
                placeholder="Enter your phone number"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-black transition-colors disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-500 text-center mb-4">
              We've sent a verification code to {phone}
            </p>
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <Lock className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
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
                  onClick={() => {
                    handleSendOtp({ preventDefault: () => {} });
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Resend OTP
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-black transition-colors disabled:opacity-50"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <Lock className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-gray-400 focus:outline-none"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
              <Lock className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-black transition-colors disabled:opacity-50"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
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
        {step === 1 && "Reset Password"}
        {step === 2 && "Verify OTP"}
        {step === 3 && "Set New Password"}
      </h2>
      <p className="text-sm sm:text-base text-gray-500 text-center mb-7">
        {step === 1 && "Enter your phone number to receive an OTP"}
        {step === 2 && "Enter the verification code sent to your phone"}
        {step === 3 && "Create a new password for your account"}
      </p>

      {renderStep()}
    </div>
  );
};

export default ForgotPassword;