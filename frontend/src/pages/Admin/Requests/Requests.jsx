import { useState, useEffect } from "react";
import Loader from "../../../components/Loader";
import { toast } from "react-toastify";
import axiosInstance from "../../../components/auth/axiosInstance";
import {
  Clock,
  CheckCircle2,
  XCircle,
  User,
  FileText,
  Download,
  Plus,
  Home,
  Phone,
  Users,
  UserCheck,
  Files,
} from "lucide-react";
import AddRequestModal from "../../../components/modals/AddRequestModal";

const Request = () => {
  const [requests, setRequests] = useState([]);
  const [blotterRequests, setBlotterRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [activeTab, setActiveTab] = useState("Pending");
  const [activeSection, setActiveSection] = useState("Certificates");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [viewModal, setViewModal] = useState(false);
  const [viewedRequest, setViewedRequest] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [certType, setCertType] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [activeTab, activeSection]);

  useEffect(() => {
    if (viewedRequest?.certificateType === "brgy_clearance") {
      setCertType("Barangay Clearance Request");
    } else if (viewedRequest?.certificateType === "bus_clearance") {
      setCertType("Business Permit Request");
    } else if (viewedRequest?.certificateType === "indigency") {
      setCertType("Certificate of Indigency Request");
    } else if (viewedRequest?.certificateType === "e_blotter") {
      setCertType("E-Blotter Complaint");
    }
  }, [viewedRequest]); // Add viewedRequest to dependencies

  // Add this function near the top of your component, after the imports
  const formatMonthlyIncome = (incomeRange) => {
    const incomeMap = {
      under_10000: "Under ₱10,000",
      "10000_15000": "₱10,000 - ₱15,000",
      "15000_20000": "₱15,000 - ₱20,000",
      "20000_25000": "₱20,000 - ₱25,000",
      "25000_30000": "₱25,000 - ₱30,000",
      "30000_40000": "₱30,000 - ₱40,000",
      "40000_50000": "₱40,000 - ₱50,000",
      above_50000: "Above ₱50,000",
    };

    return incomeMap[incomeRange] || incomeRange || "Not specified";
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/certificate/all-requests");
      const fetchedRequests = response.data.requests || [];
      setAllRequests(fetchedRequests);

      if (activeSection === "Certificates") {
        const certificateRequests = fetchedRequests.filter((req) => req.certificateType !== "e_blotter");
        
        if (activeTab === "Pending") {
          setRequests(
            formatRequestData(
              certificateRequests.filter((req) => req.status === "Pending")
            )
          );
        } else if (activeTab === "Approved") {
          setRequests(
            formatRequestData(
              certificateRequests.filter((req) => req.status === "Approved")
            )
          );
        } else if (activeTab === "Rejected") {
          setRequests(
            formatRequestData(
              certificateRequests.filter((req) => req.status === "Rejected")
            )
          );
        }
      } else if (activeSection === "E-Blotter") {
        const eBlotterRequests = fetchedRequests.filter((req) => req.certificateType === "e_blotter");
        
        if (activeTab === "Open") {
          setBlotterRequests(
            formatRequestData(
              eBlotterRequests.filter((req) => req.status === "Pending")
            )
          );
        } else if (activeTab === "Pending") {
          setBlotterRequests(
            formatRequestData(
              eBlotterRequests.filter((req) => req.status === "Approved")
            )
          );
        } else if (activeTab === "Resolved") {
          setBlotterRequests(
            formatRequestData(
              eBlotterRequests.filter((req) => req.status === "Resolved")
            )
          );
        }
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const truncateText = (text, charLimit = 100) => {
  if (!text) return "N/A";
  if (text.length <= charLimit) return text;
  return text.substring(0, charLimit) + ' ...';
};

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      await axiosInstance.put(`/certificate/approve/${requestId}`);
      toast.success("Request approved successfully!");
      await fetchRequests();
      setViewModal(false);
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (requestId) => {
    setProcessingId(requestId);
    setIsRejectModalOpen(true);
    setViewModal(false);
  };

  const handleConfirmReject = async () => {
    if (rejectionReasons.length === 0) {
      toast.error("Please select at least one reason for rejection");
      return;
    }

    setRejecting(true); // Set rejecting state to true
    try {
      const rejectionMessage = rejectionReasons.join(", ");
      await axiosInstance.put(`/certificate/reject/${processingId}`, {
        rejectionMessage,
      });
      toast.success("Request rejected successfully!");
      await fetchRequests();
      setIsRejectModalOpen(false);
      setViewModal(false);
      setRejectionReasons([]);
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    } finally {
      setRejecting(false); // Set rejecting state to false
      setProcessingId(null);
    }

    const handleDownload = async (fileUrl, fileName) => {
      try {
        // Create a temporary anchor element
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileName;
        link.target = "_blank";

        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Download error:", error);
        // Fallback: open in new tab
        window.open(fileUrl, "_blank");
      }
    };
  };

  const handleCancelReject = () => {
    setIsRejectModalOpen(false);
    setProcessingId(null);
    setRejectionReasons([]);
    setRejecting(false);
  };

  // E-Blotter specific functions
  const handleUpdateBlotterStatus = async (requestId, newStatus) => {
    try {
      setProcessingId(requestId);
      await axiosInstance.put(`/certificate/update-blotter-status/${requestId}`, {
        status: newStatus
      });
      toast.success(`E-Blotter status updated to ${newStatus}!`);
      await fetchRequests();
      setViewModal(false);
    } catch (error) {
      console.error("Error updating blotter status:", error);
      toast.error("Failed to update blotter status");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
      case "Resolved":
        return <CheckCircle2 className="text-green-500" size={16} />;
      case "Rejected":
        return <XCircle className="text-red-500" size={16} />;
      case "Open":
        return <Clock className="text-orange-500" size={16} />;
      default:
        return <Clock className="text-yellow-500" size={16} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Approved":
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Open":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusCount = (status) => {
    if (activeSection === "Certificates") {
      const certificateRequests = allRequests.filter((req) => req.certificateType !== "e_blotter");
      return certificateRequests.filter((request) => request.status === status).length;
    } else if (activeSection === "E-Blotter") {
      const eBlotterRequests = allRequests.filter((req) => req.certificateType === "e_blotter");
      
      // Map blotter statuses to display names
      if (status === "Open") {
        return eBlotterRequests.filter((request) => request.status === "Pending").length;
      } else if (status === "Pending") {
        return eBlotterRequests.filter((request) => request.status === "Approved").length;
      } else if (status === "Resolved") {
        return eBlotterRequests.filter((request) => request.status === "Resolved").length;
      }
    }
    return 0;
  };

  const formatRequestData = (requests) => {
    return requests.map((req) => ({
      id: req._id,
      certificateType: req.certificateType,
      purpose: req.purpose,
      status: req.status,
      createdAt: req.createdAt,
      rejectionMessage: req.rejectionMessage,
      file: req.generatedFile,
      adminGeneratedFile: req.adminGeneratedFile,
      userId: req.userId,
      firstName: req.userId?.firstName || "",
      lastName: req.userId?.lastName || "",
      address: req.userId?.address || "",
      isForSelf: req.isForSelf,
      forPerson: req.forPerson || null,
      certificateData: req.certificateData || {},
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {activeSection === "Certificates" ? "Certificate Requests" : "E-Blotter Requests"}
              </h1>
              <div className="flex gap-4 mt-3">
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeSection === "Certificates"
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => {
                    setActiveSection("Certificates");
                    setActiveTab("Pending");
                  }}
                >
                  Certificates
                </button>
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeSection === "E-Blotter"
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => {
                    setActiveSection("E-Blotter");
                    setActiveTab("Open");
                  }}
                >
                  E-Blotter
                </button>
              </div>
            </div>
            {activeSection === "Certificates" && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Request
              </button>
            )}
            <AddRequestModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onRequestAdded={fetchRequests}
            />
          </div>

          {/* Status Tabs */}
          <div className="flex border-b border-gray-200 mb-10">
            {activeSection === "Certificates" ? (
              <>
                <button
                  className={`px-4 py-2 font-medium text-sm flex items-center gap-2 cursor-pointer ${
                    activeTab === "Pending"
                      ? "text-black border-b-2 border-black"
                      : "text-gray-500"
                  }`}
                  onClick={() => {
                    setActiveTab("Pending");
                    window.scrollTo(0, 0);
                  }}
                >
                  <Clock size={16} />
                  Pending ({getStatusCount("Pending")})
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm flex items-center gap-2 cursor-pointer ${
                    activeTab === "Approved"
                      ? "text-black border-b-2 border-black"
                      : "text-gray-500"
                  }`}
                  onClick={() => {
                    setActiveTab("Approved");
                    window.scrollTo(0, 0);
                  }}
                >
                  <CheckCircle2 size={16} />
                  Approved ({getStatusCount("Approved")})
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm flex items-center gap-2 cursor-pointer ${
                    activeTab === "Rejected"
                      ? "text-black border-b-2 border-black"
                      : "text-gray-500"
                  }`}
                  onClick={() => {
                    setActiveTab("Rejected");
                    window.scrollTo(0, 0);
                  }}
                >
                  <XCircle size={16} />
                  Rejected ({getStatusCount("Rejected")})
                </button>
              </>
            ) : (
              <>
                <button
                  className={`px-4 py-2 font-medium text-sm flex items-center gap-2 cursor-pointer ${
                    activeTab === "Open"
                      ? "text-black border-b-2 border-black"
                      : "text-gray-500"
                  }`}
                  onClick={() => {
                    setActiveTab("Open");
                    window.scrollTo(0, 0);
                  }}
                >
                  <Clock size={16} />
                  Open ({getStatusCount("Open")})
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm flex items-center gap-2 cursor-pointer ${
                    activeTab === "Pending"
                      ? "text-black border-b-2 border-black"
                      : "text-gray-500"
                  }`}
                  onClick={() => {
                    setActiveTab("Pending");
                    window.scrollTo(0, 0);
                  }}
                >
                  <Clock size={16} />
                  Pending ({getStatusCount("Pending")})
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm flex items-center gap-2 cursor-pointer ${
                    activeTab === "Resolved"
                      ? "text-black border-b-2 border-black"
                      : "text-gray-500"
                  }`}
                  onClick={() => {
                    setActiveTab("Resolved");
                    window.scrollTo(0, 0);
                  }}
                >
                  <CheckCircle2 size={16} />
                  Resolved ({getStatusCount("Resolved")})
                </button>
              </>
            )}
          </div>

          {/* Requests Grid */}
          {(activeSection === "Certificates" ? requests : blotterRequests).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No {activeTab.toLowerCase()} {activeSection.toLowerCase()} requests found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeSection === "Certificates" ? requests : blotterRequests).map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setViewedRequest(request);
                    setViewModal(true);
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          {request.isForSelf ? (
                            <User className="h-6 w-6 text-gray-500" />
                          ) : (
                            <Users className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            {request.firstName} {request.lastName}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusClass(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {/* Show if request is for others */}
                      {!request.isForSelf && request.forPerson && (
                        <div className="bg-blue-50 p-2 rounded-md border border-blue-100">
                          <div className="flex items-center text-sm text-blue-700 font-medium">
                            <UserCheck className="mr-2" size={14} />
                            For: {request.forPerson.firstName}{" "}
                            {request.forPerson.lastName}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Relationship: {request.forPerson.relation}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="mr-2" size={14} />
                        {request.purpose}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Home className="mr-2" size={14} />
                        {request.address || "No address provided"}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="mr-2" size={14} />
                        Submitted on {formatDate(request.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View Request Modal */}
          {viewModal && viewedRequest && (
            <div className="fixed inset-0 bg-gray-950/80 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">{certType}</h2>

                <div className="space-y-4">
                  {/* Show if request is for others */}
                  {!viewedRequest.isForSelf && viewedRequest.forPerson && (
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                      <h3 className="font-medium text-blue-800 flex items-center gap-2">
                        <Users size={16} /> Request for Another Person
                      </h3>
                      <div className="mt-2 space-y-2 text-sm">
                        <div>
                          <span className="text-blue-600 font-medium">
                            Name:
                          </span>{" "}
                          {viewedRequest.forPerson.firstName}{" "}
                          {viewedRequest.forPerson.lastName}
                        </div>
                        <div>
                          <span className="text-blue-600 font-medium">
                            Relationship:
                          </span>{" "}
                          {viewedRequest.forPerson.relation}
                        </div>
                        {viewedRequest.forPerson.address && (
                          <div>
                            <span className="text-blue-600 font-medium">
                              Address:
                            </span>{" "}
                            {viewedRequest.forPerson.address}
                          </div>
                        )}
                        {viewedRequest.forPerson.birthDate && (
                          <div>
                            <span className="text-blue-600 font-medium">
                              Birth Date:
                            </span>{" "}
                            {formatDate(viewedRequest.forPerson.birthDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-xs text-gray-500 block">
                      Requested by:
                    </span>
                    <div className="text-gray-800">
                      {viewedRequest.firstName} {viewedRequest.lastName}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Address:
                    </span>
                    <div className="text-gray-800">
                      {viewedRequest.address || "No address provided"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Date Submitted:
                    </span>
                    <div className="text-gray-800">
                      {formatDate(viewedRequest.createdAt)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Status:</span>
                    <div className="text-gray-800">{viewedRequest.status}</div>
                  </div>

                  {certType === "Business Permit Request" ? (
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Business Name:
                      </span>
                      <div className="text-blue-800">
                        {viewedRequest.purpose}
                      </div>
                    </div>
                  ) : certType === "E-Blotter Complaint" ? (
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100 space-y-4">
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Incident:
                        </span>
                        <div className="text-blue-800">
                           {truncateText(viewedRequest.certificateData?.eBlotter?.incidentDetails)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Involved Parties:
                        </span>
                        <div className="text-blue-800">
                          {viewedRequest.certificateData?.eBlotter
                            ?.complainantName || "N/A"}{" "}
                          &{" "}
                          {viewedRequest.certificateData?.eBlotter
                            ?.respondentName || "N/A"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Purpose:
                      </span>
                      <div className="text-blue-800">
                        {viewedRequest.purpose}
                      </div>
                    </div>
                  )}

                  {certType === "Certificate of Indigency Request" && (
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100 space-y-4">
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Monthly Income:
                        </span>
                        <div className="text-blue-800">
                          {formatMonthlyIncome(
                            viewedRequest.certificateData?.indigency
                              ?.monthlyIncome
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Number of Family Members:
                        </span>
                        <div className="text-blue-800">
                          {
                            viewedRequest.certificateData?.indigency
                              ?.familyMembers
                          }
                        </div>
                      </div>
                    </div>
                  )}

                  {viewedRequest.status === "Rejected" &&
                    viewedRequest.rejectionMessage && (
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Rejection Reason:
                        </span>
                        <div className="text-gray-700">
                          {viewedRequest.rejectionMessage}
                        </div>
                      </div>
                    )}
                  {viewedRequest.status === "Approved" &&
                    viewedRequest.file && (
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Certificate File:
                        </span>
                        <a
                          href={viewedRequest.adminGeneratedFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Download size={16} />
                          Download Admin Certificate
                        </a>
                      </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  {certType === "E-Blotter Complaint" ? (
                    // E-Blotter specific buttons
                    <>
                      {viewedRequest.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleUpdateBlotterStatus(viewedRequest.id, "Approved")}
                            disabled={processingId === viewedRequest.id}
                            className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                              processingId === viewedRequest.id
                                ? "bg-yellow-300 cursor-not-allowed"
                                : "bg-yellow-600 hover:bg-yellow-700"
                            }`}
                          >
                            {processingId === viewedRequest.id ? (
                              "Processing..."
                            ) : (
                              <>
                                <Clock size={16} />
                                Mark as Pending
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleUpdateBlotterStatus(viewedRequest.id, "Resolved")}
                            disabled={processingId === viewedRequest.id}
                            className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                              processingId === viewedRequest.id
                                ? "bg-green-300 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {processingId === viewedRequest.id ? (
                              "Processing..."
                            ) : (
                              <>
                                <CheckCircle2 size={16} />
                                Mark as Resolved
                              </>
                            )}
                          </button>
                        </>
                      )}
                      {viewedRequest.status === "Approved" && (
                        <button
                          onClick={() => handleUpdateBlotterStatus(viewedRequest.id, "Resolved")}
                          disabled={processingId === viewedRequest.id}
                          className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                            processingId === viewedRequest.id
                              ? "bg-green-300 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {processingId === viewedRequest.id ? (
                            "Processing..."
                          ) : (
                            <>
                              <CheckCircle2 size={16} />
                              Mark as Resolved
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    // Certificate request buttons
                    <>
                      {viewedRequest.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(viewedRequest.id)}
                            disabled={processingId === viewedRequest.id}
                            className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                              processingId === viewedRequest.id
                                ? "bg-green-300 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {processingId === viewedRequest.id ? (
                              "Processing..."
                            ) : (
                              <>
                                <CheckCircle2 size={16} />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectClick(viewedRequest.id)}
                            disabled={processingId === viewedRequest.id}
                            className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                              processingId === viewedRequest.id
                                ? "bg-red-300 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => setViewModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject Reason Modal */}
          {isRejectModalOpen && (
            <div className="fixed inset-0 bg-gray-950/80 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="text-center">
                  <label className="text-xl font-bold">Rejection Reasons</label>
                  <p className="text-gray-600 my-5">
                    Please select one or more reasons for rejecting this
                    request.
                  </p>

                  <div className="mb-4">
                    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
                      {[
                        "Incomplete Information",
                        "Invalid Documents",
                        "Duplicate Request",
                        "Not Eligible",
                        "Unclear Purpose",
                        "Other",
                      ].map((reason) => (
                        <div key={reason} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`reason-${reason}`}
                            value={reason}
                            checked={rejectionReasons.includes(reason)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRejectionReasons([
                                  ...rejectionReasons,
                                  reason,
                                ]);
                              } else {
                                setRejectionReasons(
                                  rejectionReasons.filter((r) => r !== reason)
                                );
                              }
                            }}
                            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`reason-${reason}`}
                            className="ml-2 block text-sm text-gray-700 cursor-pointer"
                          >
                            {reason}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleCancelReject}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmReject}
                      disabled={rejectionReasons.length === 0 || rejecting}
                      className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                        rejectionReasons.length > 0 && !rejecting
                          ? "bg-red-600 hover:bg-red-700 cursor-pointer"
                          : "bg-red-300 cursor-not-allowed"
                      }`}
                    >
                      {rejecting ? (
                        "Rejecting..."
                      ) : (
                        <>
                          <XCircle size={16} />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Request;
