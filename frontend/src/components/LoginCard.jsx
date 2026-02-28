/** @format */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../components/auth/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import brgylogo from "../assets/BrgyLogo.png";

const LoginCard = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post("/admin/admin-login", {
        username,
        password,
      });

      if (response.data.success) {
        localStorage.setItem("adminToken", response.data.token);
        // Refresh the page before navigating to dashboard
      navigate("/admin/dashboard");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative w-full max-w-md">
      {loading && (
        <div className="absolute inset-0 bg-white/50 bg-opacity-80 z-10 flex items-center justify-center rounded-lg">
          <Loader />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 w-full max-w-md transition-all duration-500 transform preserve-3d">
        <div className="flex justify-center mb-4">
          <div className="flex items-center">
            <img
              src={brgylogo}
              alt="BMS646 Logo"
              className="h-10 sm:h-12"
            />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2">
          Sign in Admin to continue
        </h2>
        <p className="text-sm sm:text-base text-gray-500 text-center mb-6">
          Please sign in your admin account start your session
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 mb-4 focus-within:border-black">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Username"
                className="w-full caret-black outline-none text-sm sm:text-base"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 mb-4 focus-within:border-black">
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
{/* 
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="mr-2 rounded text-gray-700 focus:ring-gray-900"
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Remember me
              </label>
            </div>
          </div> */}

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors mb-4 text-sm sm:text-base"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginCard;
