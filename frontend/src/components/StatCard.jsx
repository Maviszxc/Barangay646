import React from "react";

const StatCard = ({ label, value, icon, color, extra }) => (
  <div
    className={`rounded-2xl p-5 flex flex-col items-center shadow-sm ${
      color || ""
    }`}
  >
    <div className="mb-2">{icon}</div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-xs font-medium">{label}</div>
    {extra && <div className="w-full mt-2">{extra}</div>}
  </div>
);

export default StatCard;
