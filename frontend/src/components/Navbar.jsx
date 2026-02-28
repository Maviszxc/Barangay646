import React from "react";
import { User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import brgylogo from "../assets/BrgyLogo.png";

const navLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/requests", label: "Requests" },
  { to: "/faqs", label: "FAQs" },
  { to: "/About", label: "About" },
];

const Navbar = () => {
  const location = useLocation();

  // Mock user data - replace with actual user data from context/props
  const user = {
    name: "John Doe",
    avatar: null, // Set to null to show initials
  };

  // Function to get user initials
  const getUserInitials = (name) => {
    if (!name) return "JD";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-6">
      {/* Navbar */}
      <nav className="bg-white bg-opacity-80 backdrop-blur-lg rounded-full max-w-7xl mx-auto px-6 py-3 shadow-2xl">
        <div className="flex justify-between items-center">
          <Link
            to="/dashboard"
            className="text-xl font-bold text-gray-800 flex items-center gap-2 cursor-pointer"
          >
            <img src={brgylogo} alt="BMS646 Logo" className="h-8" />
          </Link>
          <div className="flex space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-4 py-2 text-sm font-medium rounded-full flex items-center gap-1 transition-colors cursor-pointer
                    ${isActive ? "text-black" : "text-gray-800"}
                    group
                  `}
                >
                  {link.label}
                  {/* underline effect */}
                  <span
                    className={`
                      absolute left-4 right-4 -bottom-1 h-[2px] rounded-full transition-all duration-300
                      ${
                        isActive
                          ? "bg-black w-[calc(100%-32px)]"
                          : "bg-black w-0 group-hover:w-[calc(100%-32px)]"
                      }
                    `}
                    style={{
                      transitionProperty: "width,background-color",
                    }}
                  />
                </Link>
              );
            })}
          </div>
          <Link
            to="/profile"
            className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400 transition-colors"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-medium text-gray-700">
                <img
                  src="https://icons.veryicon.com/png/o/miscellaneous/two-color-webpage-small-icon/user-244.png"
                  alt="User Icon"
                  className="w-8 h-8 rounded-full object-cover"
                />
              </span>
            )}
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
