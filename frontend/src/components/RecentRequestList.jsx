/** @format */

import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ClipboardList, ChevronRight } from "lucide-react";

const getFormattedCertificateType = (type) => {
  switch (type) {
    case "Clearance":
      return "Barangay Clearance";
    case "Residency":
      return "Certificate of Residency";
    case "Indigency":
      return "Certificate of Indigency";
    default:
      return type;
  }
};

const RecentRequestList = ({ requests }) => {
  const navigate = useNavigate(); // ✅ Fix: moved inside the function

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 text-sm flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Recent Requests
        </h3>
        <button
          className="text-black text-sm font-medium flex items-center gap-1 cursor-pointer"
          onClick={() => navigate("/admin/requests")} // ✅ now valid
        >
          See All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-7">
        {requests.map((request, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <FileText className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="font-medium">
                  {getFormattedCertificateType(request.certificateType)}
                </p>
                <p className="text-gray-500 text-sm">
                  {request.user} • {request.timeElapsed}
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                request.status === "Approved"
                  ? "bg-green-100 text-green-800"
                  : request.status === "Rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {request.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentRequestList;
