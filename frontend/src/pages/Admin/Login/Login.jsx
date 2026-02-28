/** @format */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "../../../components/LoginCard";
import Loader from "../../../components/Loader";

const Login = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const adminToken = localStorage.getItem("adminToken");

   useEffect(() => {
      if (adminToken) {
        navigate("/admin/dashboard");
      } else {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
      }
    }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-grow dotted-bg relative rounded-lg mx-4 my-4 lg:mx-8 lg:my-6">
        <div className="container mx-auto px-4 py-12 md:py-24 lg:py-36 flex items-center justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full max-w-7xl">
            {/* Left side - Barangay System text */}
            <div className="z-20 px-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="block">Barangay 646,</span>
                <span className="block mt-4 text-gray-400">Zone 67</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-4">
                Barangay Management System
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-6 max-w-2xl">
                A comprehensive solution for managing barangay operations,
                resident information, document processing, and community
                services. Streamline administrative tasks and improve service
                delivery to residents.
              </p>
            </div>

            {/* Right side - Login form */}
            <div className="z-20 w-full max-w-md mx-auto px-4">
              <LoginCard />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
