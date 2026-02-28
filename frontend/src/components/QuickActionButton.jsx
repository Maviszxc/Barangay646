import React from "react";

const colorMap = {
  green: "bg-green-100 text-green-800 hover:bg-green-200",
  blue: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  purple: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  orange: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  secondary: "bg-white text-black-600 border border-gray-200 hover:bg-gray-100",
  default: "bg-black text-white hover:bg-gray-700",
};

const QuickActionButton = ({ icon, label, color, className = "", onClick, cursor = "pointer" }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col cursor-${cursor} items-center justify-center rounded-xl p-4 transition-colors ${color} ${className}`}
    >
      <div className="mb-2">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export default QuickActionButton;
