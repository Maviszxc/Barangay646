/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";
import Loader from "../../../components/Loader";
import axiosInstance from "../../../components/auth/axiosInstance";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  FileText,
  ClockFading,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { toast } from "react-toastify";

// Set up PDF.js worker at the top of your file
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const Requests = () => {
  const [activeDocument, setActiveDocument] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [requestFor, setRequestFor] = useState("self"); // "self" or "other"
  const [isVerified, setIsVerified] = useState(""); // Default to true until we check
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  // Add these state variables near your other state declarations
  const [visibleRejectedCount, setVisibleRejectedCount] = useState(3); // Show 5 initially since they're larger cards
  const [visiblePendingCount, setVisiblePendingCount] = useState(5);
  // Add these functions to handle showing more/less rejected/pending requests
  const handleShowMorePending = () => {
    setVisiblePendingCount((prevCount) => prevCount + 10);
  };

  const handleShowLessPending = () => {
    setVisiblePendingCount(5);
  };

  const handleShowMoreRejected = () => {
    setVisibleRejectedCount((prevCount) => prevCount + 5);
  };

  const handleShowLessRejected = () => {
    setVisibleRejectedCount(3);
  };

  const navigate = useNavigate();

  // Check user verification status on component mount
  useEffect(() => {
    const checkUserVerification = async () => {
      try {
        const response = await axiosInstance.get(
          "/certificate/user-verification"
        );
        setIsVerified(response.data.status);
        setRejectionReasons(response.data.rejectionMessage || []);
      } catch (error) {
        localStorage.removeItem("userToken");
        console.error("Error checking verification status:", error);
      }
    };

    checkUserVerification();
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isPreviewOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isPreviewOpen]);

  // Loading states for each tab
  const [pendingLoading, setPendingLoading] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [rejectedLoading, setRejectedLoading] = useState(false);
  const [pendingrequests, setPendingRequests] = useState([]);
  const [approvedrequests, setApprovedRequests] = useState([]);
  const [rejectedrequests, setRejectedRequests] = useState([]);

  // Define which fields belong to each step for E-Blotter
  const eBlotterSteps = [
    {
      title: "Complainant Information",
      fields: [
        "complainantName",
        "complainantAddress",
        "complainantContact",
        "complainantAge",
      ],
    },
    {
      title: "Respondent Information",
      fields: [
        "respondentName",
        "respondentAddress",
        "respondentContact",
        "respondentAge",
      ],
    },
    {
      title: "Incident Details",
      fields: [
        "incidentDate",
        "incidentTime",
        "incidentLocation",
        "incidentDetails",
      ],
    },
    {
      title: "Witness Information",
      fields: ["witnessName", "witnessAddress", "witnessContact", "purpose"],
    },
  ];

  // Add state to track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState({
    pending: false,
    approved: false,
    rejected: false,
  });

  useEffect(() => {
    // Only fetch data if user is verified
    if (isVerified !== "approved") return;

    const fetchDataForTab = async (tab) => {
      // Skip if already loaded
      if (loadedTabs[tab]) return;

      try {
        // Set loading state
        if (tab === "pending") setPendingLoading(true);
        else if (tab === "approved") setApprovedLoading(true);
        else if (tab === "rejected") setRejectedLoading(true);

        const response = await axiosInstance.get(
          `/certificate/check-status?status=${
            tab.charAt(0).toUpperCase() + tab.slice(1)
          }`
        );

        // Update state
        if (tab === "pending") {
          setPendingRequests(response.data.requests);
          setLoadedTabs((prev) => ({ ...prev, pending: true }));
        } else if (tab === "approved") {
          let approvedData = response.data.requests;

          // Also fetch resolved e-blotter requests and include them
          try {
            const resolvedResponse = await axiosInstance.get(
              "/certificate/check-status?status=Resolved"
            );
            const resolvedEBlotterRequests = resolvedResponse.data.requests.filter(
              (request) => request.certificateType === "e_blotter"
            );
            approvedData = [...approvedData, ...resolvedEBlotterRequests];
          } catch (err) {
            console.log(
              "No resolved requests found or error fetching resolved requests"
            );
          }

          const latestRequests = getLatestRequestsByType(approvedData);
          setApprovedRequests(latestRequests);
          setLoadedTabs((prev) => ({ ...prev, approved: true }));
        } else if (tab === "rejected") {
          setRejectedRequests(response.data.requests);
          setLoadedTabs((prev) => ({ ...prev, rejected: true }));
        }
      } catch (err) {
        toast.error(
          err.response?.data?.message || `Error fetching ${tab} requests`
        );
      } finally {
        // Reset loading state
        if (tab === "pending") setPendingLoading(false);
        else if (tab === "approved") setApprovedLoading(false);
        else if (tab === "rejected") setRejectedLoading(false);
      }
    };

    // Fetch data for the active tab
    fetchDataForTab(activeTab);
  }, [activeTab, loadedTabs, isVerified]);

  const getLatestRequestsByType = (requests) => {
    const latestRequests = {};

    requests.forEach((request) => {
      const requestDate = new Date(request.createdAt);

      // If we haven't seen this certificate type yet, or this request is newer
      if (
        !latestRequests[request.certificateType] ||
        new Date(latestRequests[request.certificateType].createdAt) <
          requestDate
      ) {
        latestRequests[request.certificateType] = request;
      }
    });

    // Convert the object back to an array
    return Object.values(latestRequests);
  };

  // If user is not verified, show verification message
  if (isVerified !== "approved") {
    return (
      <div className="min-h-screen py-8 flex flex-col p-4 max-w-7xl mx-auto gap-6 relative">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {isVerified === "pending" && (
            <div className="text-center py-15">
              <ClockFading className="w-18 h-18 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-4">
                Pending Verification
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Your account is currently under review. You'll be able to
                request documents once your account has been approved by the
                admin.
              </p>
            </div>
          )}

          {isVerified === "rejected" && (
            <div className="text-center py-15">
              <XCircle className="w-18 h-18 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-4">
                Verification Rejected
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Your account verification was rejected. Please update your
                information and try again.
              </p>
              {rejectionReasons.length > 0 && (
                <div className="bg-red-50 p-4 rounded-md mb-6 max-w-xs mx-auto text-center shadow-sm">
                  <p className="text-red-600 font-medium mb-2 text-center">
                    Reasons:
                  </p>
                  <ul className="list-disc list-inside text-red-500 text-sm space-y-1">
                    {rejectionReasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-gray-900 transition-colors"
                onClick={() => navigate("/profile")}
              >
                Update your details
              </button>
            </div>
          )}

          {isVerified === "unregistered" && (
            <div className="text-center py-15">
              <UserCheck className="w-18 h-18 text-gray-700 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-4">
                Not Verified Yet
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                You need to complete your account verification by uploading your
                valid ID to access document requests.
              </p>
              <button
                className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-gray-900 transition-colors"
                onClick={() => navigate("/profile")}
              >
                Verify your account here
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Updated document types with certificateType for all
  const documentTypes = [
    {
      id: 1,
      certificateType: "brgy_clearance",
      name: "Barangay Clearance",
      description: "Required for various government transactions",
      fields: [
        { name: "purpose", label: "Purpose", type: "text", required: true },
      ],
    },
    {
      id: 2,
      certificateType: "bus_clearance",
      name: "Business Permit",
      description: "Required for operating local businesses",
      fields: [
        {
          name: "purpose",
          label: "Business Name",
          type: "text",
          required: true,
        },
      ],
    },
    {
      id: 3,
      certificateType: "indigency",
      name: "Indigency Certificate",
      description: "For availing government assistance programs",
      fields: [
        {
          name: "familyMembers",
          label: "Number of Family Members",
          type: "number",
          required: true,
        },
        {
          name: "monthlyIncome",
          label: "Monthly Income",
          type: "select",
          required: true,
          options: [
            { value: "", label: "Select monthly income range" },
            { value: "under_10000", label: "Under ₱10,000" },
            { value: "10000_15000", label: "₱10,000 - ₱15,000" },
            { value: "15000_20000", label: "₱15,000 - ₱20,000" },
            { value: "20000_25000", label: "₱20,000 - ₱25,000" },
            { value: "25000_30000", label: "₱25,000 - ₱30,000" },
            { value: "30000_40000", label: "₱30,000 - ₱40,000" },
            { value: "40000_50000", label: "₱40,000 - ₱50,000" },
            { value: "above_50000", label: "Above ₱50,000" },
          ],
        },
        { name: "purpose", label: "Purpose", type: "text", required: true },
      ],
    },
    {
      id: 4,
      certificateType: "e_blotter",
      name: "E-Blotter",
      description: "For reporting incidents to the barangay",
      fields: [
        // Complainant Information
        {
          name: "complainantName",
          label: "Complainant Name",
          type: "text",
          required: true,
        },
        {
          name: "complainantAddress",
          label: "Complainant Address",
          type: "text",
          required: true,
        },
        {
          name: "complainantContact",
          label: "Complainant Contact Email/Number",
          type: "text",
          required: true,
        },
        {
          name: "complainantAge",
          label: "Complainant Age",
          type: "number",
          required: true,
        },

        // Respondent Information
        {
          name: "respondentName",
          label: "Respondent Name",
          type: "text",
          required: true,
        },
        {
          name: "respondentAddress",
          label: "Respondent Address",
          type: "text",
          required: false,
        },
        {
          name: "respondentContact",
          label: "Respondent Contact Email/Number",
          type: "text",
          required: false,
        },
        {
          name: "respondentAge",
          label: "Respondent Age",
          type: "number",
          required: false,
        },

        // Incident Information
        {
          name: "incidentDate",
          label: "Incident Date",
          type: "date",
          required: true,
        },
        {
          name: "incidentTime",
          label: "Incident Time",
          type: "time",
          required: true,
        },
        {
          name: "incidentLocation",
          label: "Incident Location",
          type: "text",
          required: true,
        },
        {
          name: "incidentDetails",
          label: "Incident Details",
          type: "textarea",
          required: true,
        },

        // Witness Information
        {
          name: "witnessName",
          label: "Witness Name",
          type: "text",
          required: false,
        },
        {
          name: "witnessAddress",
          label: "Witness Address",
          type: "text",
          required: false,
        },
        {
          name: "witnessContact",
          label: "Witness Contact Email/Number",
          type: "text",
          required: false,
        },

        // Additional Fields
        {
          name: "complaint",
          label: "Formal Complaint",
          type: "textarea",
          required: false,
        },
        {
          name: "narrative",
          label: "Narrative of Events",
          type: "textarea",
          required: false,
        },
        {
          name: "purpose",
          label: "Purpose of Report",
          type: "text",
          required: true,
        },
      ],
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleForPersonChange = (field, value) => {
    setFormData({
      ...formData,
      forPerson: {
        ...formData.forPerson,
        [field]: value,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Add this validation for E-Blotter
    if (
      activeDocument.certificateType === "e_blotter" &&
      requestFor === "other"
    ) {
      toast.error("E-Blotter reports can only be filed for yourself");
      return;
    }

    // Validate required fields
    if (requestFor === "other") {
      if (!formData.forPerson?.firstName || !formData.forPerson?.lastName) {
        toast.error("Please provide the person's first and last name");
        return;
      }

      if (!formData.forPerson?.relation) {
        toast.error("Please provide the person's relationship to you");
        return;
      }
    }

    // Validate document-specific fields
    for (const field of activeDocument.fields) {
      if (field.required && !formData[field.name]) {
        toast.error(`Please fill ${field.label}.`);
        return;
      }
    }

    try {
      setIsSubmitted(true);

      const payload = {
        certificateType: activeDocument.certificateType,
        purpose: formData.purpose,
        isForSelf: requestFor === "self",
      };

      // Add certificate-specific data based on document type
      if (activeDocument.certificateType === "indigency") {
        payload.certificateData = {
          monthlyIncome: formData.monthlyIncome, // This will now be the range value
          familyMembers: parseInt(formData.familyMembers),
          sourceOfIncome: formData.sourceOfIncome || "",
          propertiesOwned: formData.propertiesOwned
            ? formData.propertiesOwned.split(",")
            : [],
          hasSSS: formData.hasSSS || false,
          hasPhilhealth: formData.hasPhilhealth || false,
        };
      } else if (activeDocument.certificateType === "e_blotter") {
        payload.certificateData = {
          // Complainant information
          complainantName: formData.complainantName || "",
          complainantAddress: formData.complainantAddress || "",
          complainantContact: formData.complainantContact || "",
          complainantAge: formData.complainantAge || "",

          // Respondent information
          respondentName: formData.respondentName || "",
          respondentAddress: formData.respondentAddress || "",
          respondentContact: formData.respondentContact || "",
          respondentAge: formData.respondentAge || "",

          // Incident information
          incidentDate: formData.incidentDate,
          incidentTime: formData.incidentTime || "",
          incidentLocation: formData.incidentLocation || "",
          incidentDetails: formData.incidentDetails,

          // Witness information
          witnessName: formData.witnessName || "",
          witnessAddress: formData.witnessAddress || "",
          witnessContact: formData.witnessContact || "",

          // Additional fields
          complaint: formData.complaint || "",
          narrative: formData.narrative || "",
        };
      }

      // Add person information if requesting for someone else
      if (requestFor === "other") {
        payload.forPerson = formData.forPerson;
      }

      const response = await axiosInstance.post(
        "/certificate/request",
        payload
      );

      toast.success(response.data.message || "Request submitted successfully!");

      setFormData({});
      setLoadedTabs({
        pending: false,
        approved: false,
        rejected: false,
      });
      setActiveTab("pending");
    } catch (err) {
      console.error("Submission error:", err);
      toast.error(err.response?.data?.message || "Failed to submit request");
      setIsSubmitted(false);
    }
  };

  const NumericInput = ({ field, value, onChange }) => {
    const handleKeyPress = (e) => {
      // Only allow numbers (0-9) and backspace
      if (!/[0-9]/.test(e.key) && e.key !== "Backspace") {
        e.preventDefault();
      }
    };

    return (
      <input
        type="text"
        name={field.name}
        value={value || ""}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        required={field.required}
        inputMode="numeric"
        placeholder={field.placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500"
      />
    );
  };

  const resetForm = () => {
    setActiveDocument(null);
    setIsSubmitted(false);
    setFormData({});
    setRequestFor("self");
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleOpenPdfPreview = (documentUrl) => {
    setPdfPreview(documentUrl);
    setIsPreviewOpen(true);
    setPageNumber(1);
    setScale(1.0);
  };

  const handleClosePdfPreview = () => {
    setIsPreviewOpen(false);
    setPdfPreview(null);
    setPageNumber(1);
    setScale(1.0);
  };

  const goToPreviousPage = () => {
    setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prevPageNumber) =>
      Math.min(prevPageNumber + 1, numPages || 1)
    );
  };

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const handleDownload = (fileUrl, fileName) => {
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

  // const handleDownload = (documentUrl) => {
  //   try {
  //     // Open the document in a new tab instead of downloading directly
  //     window.open(documentUrl, "_blank", "noopener,noreferrer");
  //   } catch (error) {
  //     console.error("Download failed:", error);
  //     alert("Failed to open document. Please try again.");
  //   }
  // };

  return (
    <div className="min-h-screen py-8 flex flex-col p-4 max-w-7xl mx-auto gap-6 relative">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Document Requests
        </h1>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Panel - Document Types */}
          <div className="w-full md:w-1/3 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Document Types
            </h2>

            <div className="space-y-3">
              {documentTypes.map((doc) => (
                <motion.div
                  key={doc.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    activeDocument?.id === doc.id
                      ? "bg-black text-white"
                      : "bg-white hover:bg-gray-100 border border-gray-200"
                  }`}
                  onClick={() => {
                    setActiveDocument(doc);
                    setIsSubmitted(false);
                    setFormData({});
                    setRequestFor("self");
                    setCurrentStep(1); // reset wizard
                  }}
                  whileHover={{ y: -2 }}
                >
                  <h3 className="font-medium">{doc.name}</h3>
                  <p
                    className={`text-sm mt-1 ${
                      activeDocument?.id === doc.id
                        ? "text-gray-200"
                        : "text-gray-500"
                    }`}
                  >
                    {doc.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Panel - Request Form or Transactions */}
          <div className="w-full md:w-2/3">
            {!activeDocument ? (
              <div className="h-full flex flex-col">
                <Tabs
                  defaultValue="pending"
                  className="w-full"
                  onValueChange={(value) => {
                    setActiveTab(value);
                    window.scrollTo(0, 0);
                  }}
                >
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger
                      value="pending"
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <Clock className="w-4 h-4" /> Pending
                    </TabsTrigger>
                    <TabsTrigger
                      value="approved"
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" /> Approved
                    </TabsTrigger>
                    <TabsTrigger
                      value="rejected"
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Rejected
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="pending"
                    className="border rounded-lg p-4"
                  >
                    {pendingLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader />
                      </div>
                    ) : pendingrequests.length > 0 ? (
                      <div className="space-y-4">
                        {pendingrequests
                          .slice(0, visiblePendingCount)
                          .map((request) => (
                            <div
                              key={request.id}
                              className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center"
                            >
                              <div>
                                {request.certificateType ===
                                  "brgy_clearance" && (
                                  <h3 className="font-medium">
                                    Barangay Clearance
                                  </h3>
                                )}

                                {request.certificateType ===
                                  "bus_clearance" && (
                                  <h3 className="font-medium">
                                    Business Clearance
                                  </h3>
                                )}

                                {request.certificateType === "indigency" && (
                                  <h3 className="font-medium">
                                    Certificate of Indigency
                                  </h3>
                                )}

                                {request.certificateType === "e_blotter" && (
                                  <h3 className="font-medium">
                                    E-Blotter Report
                                  </h3>
                                )}
                                <p className="text-sm text-gray-500">
                                  Requested on:{" "}
                                  {new Date(
                                    request.createdAt
                                  ).toLocaleDateString()}
                                </p>
                                {!request.isForSelf && request.forPerson && (
                                  <p className="text-sm text-gray-500">
                                    For: {request.forPerson.firstName}{" "}
                                    {request.forPerson.lastName}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              </div>
                            </div>
                          ))}

                        {/* Show More/Less buttons for pending requests */}
                        <div className="flex justify-center pt-4">
                          {pendingrequests.length > visiblePendingCount ? (
                            <button
                              onClick={handleShowMorePending}
                              className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
                            >
                              See More Pending (
                              {pendingrequests.length - visiblePendingCount}{" "}
                              more)
                            </button>
                          ) : (
                            visiblePendingCount > 10 && (
                              <div className="flex gap-2 items-center">
                                <button
                                  onClick={handleShowLessPending}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors cursor-pointer"
                                >
                                  Show Less
                                </button>
                                <span className="text-sm text-gray-500">
                                  Showing all {pendingrequests.length} pending
                                  requests
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-500">
                          No pending requests
                        </h3>
                        <p className="text-gray-400 mt-1">
                          Select a document type to make a request
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="approved"
                    className="border rounded-lg p-4"
                  >
                    {approvedLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader />
                      </div>
                    ) : approvedrequests.length > 0 ? (
                      <div className="space-y-4">
                        {approvedrequests.map((request) => (
                          <div
                            key={request.id}
                            className="bg-white p-4 rounded-lg border border-gray-200"
                          >
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                {request.certificateType ===
                                  "brgy_clearance" && (
                                  <h3 className="font-medium">
                                    Barangay Clearance
                                  </h3>
                                )}

                                {request.certificateType ===
                                  "bus_clearance" && (
                                  <h3 className="font-medium">
                                    Business Clearance
                                  </h3>
                                )}

                                {request.certificateType === "indigency" && (
                                  <h3 className="font-medium">
                                    Certificate of Indigency
                                  </h3>
                                )}

                                {request.certificateType === "e_blotter" && (
                                  <h3 className="font-medium">
                                    E-Blotter Report
                                  </h3>
                                )}

                                <p className="text-sm text-gray-500">
                                  Approved on:{" "}
                                  {new Date(
                                    request.createdAt
                                  ).toLocaleDateString()}
                                </p>
                                {!request.isForSelf && request.forPerson && (
                                  <p className="text-sm text-gray-500">
                                    For: {request.forPerson.firstName}{" "}
                                    {request.forPerson.lastName}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Approved
                                </span>
                                {request.certificateType === "e_blotter" && (
                                  request.generatedFile ? (
                                    <a
                                      href={request.generatedFile}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1 hover:bg-blue-200 cursor-pointer"
                                    >
                                      <Download className="w-3 h-3" /> Download
                                    </a>
                                  ) : (
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> Processing
                                    </span>
                                  )
                                )}
                              </div>
                            </div>

                            <div
                              className="border rounded-lg overflow-hidden bg-gray-50 cursor-pointer hover:shadow-md transition-all relative group"
                              onClick={() => {
                                const fileToPreview = request.certificateType === "e_blotter" 
                                  ? (request.generatedFile || '/backend/APP/templates/e_blotter.pdf')
                                  : request.file;
                                handleOpenPdfPreview(fileToPreview);
                              }}
                            >
                              <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all z-10">
                                <div className="bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <iframe
                                src={request.file}
                                width="450"
                                height="600"
                                className="mx-auto"
                                frameBorder="0"
                                allowFullScreen
                                loading="lazy"
                                title="PDF Preview"
                              ></iframe>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-500">
                          No approved requests
                        </h3>
                        <p className="text-gray-400 mt-1">
                          Your approved documents will appear here
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="rejected"
                    className="border rounded-lg p-4"
                  >
                    {rejectedLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader />
                      </div>
                    ) : rejectedrequests.length > 0 ? (
                      <div className="space-y-4">
                        {rejectedrequests
                          .slice(0, visibleRejectedCount)
                          .map((request) => (
                            <div
                              key={request.id}
                              className="bg-white p-4 rounded-lg border border-gray-200"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  {request.certificateType ===
                                    "brgy_clearance" && (
                                    <h3 className="font-medium">
                                      Barangay Clearance
                                    </h3>
                                  )}

                                  {request.certificateType ===
                                    "bus_clearance" && (
                                    <h3 className="font-medium">
                                      Business Clearance
                                    </h3>
                                  )}

                                  {request.certificateType === "indigency" && (
                                    <h3 className="font-medium">
                                      Certificate of Indigency
                                    </h3>
                                  )}

                                  {request.certificateType === "e_blotter" && (
                                    <h3 className="font-medium">
                                      E-Blotter Report
                                    </h3>
                                  )}
                                  <p className="text-sm text-gray-500">
                                    Rejected on:{" "}
                                    {new Date(
                                      request.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                  {!request.isForSelf && request.forPerson && (
                                    <p className="text-sm text-gray-500">
                                      For: {request.forPerson.firstName}{" "}
                                      {request.forPerson.lastName}
                                    </p>
                                  )}
                                </div>
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Rejected
                                </span>
                              </div>
                              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">
                                  {request.rejectionMessage}
                                </p>
                              </div>
                            </div>
                          ))}

                        {/* Show More/Less buttons for rejected requests */}
                        <div className="flex justify-center pt-4">
                          {rejectedrequests.length > visibleRejectedCount ? (
                            <button
                              onClick={handleShowMoreRejected}
                              className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
                            >
                              See More Rejected (
                              {rejectedrequests.length - visibleRejectedCount}{" "}
                              more)
                            </button>
                          ) : (
                            visibleRejectedCount > 5 && (
                              <div className="flex gap-2 items-center">
                                <button
                                  onClick={handleShowLessRejected}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors cursor-pointer"
                                >
                                  Show Less
                                </button>
                                <span className="text-sm text-gray-500">
                                  Showing all {rejectedrequests.length} rejected
                                  requests
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-500">
                          No rejected requests
                        </h3>
                        <p className="text-gray-400 mt-1">
                          Rejected requests will appear here
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : isSubmitted ? (
              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-green-500 mb-4">
                  <CheckCircle className="w-16 h-16 mx-auto" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Request Submitted Successfully!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your {activeDocument.name} request has been received. You'll
                  be notified once it's processed.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={resetForm}
                    className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Request Another Document
                  </button>
                  <button
                    onClick={() => {
                      setActiveDocument(null);
                      setIsSubmitted(false);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    View My Requests
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {activeDocument.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {activeDocument.description}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveDocument(null)}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label="Close form"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </div>

                  {/* Remove this entire section */}
                  {activeDocument.certificateType !== "e_blotter" && (
                    <div className="mb-4 flex gap-2">
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-md border ${
                          requestFor === "self"
                            ? "bg-black text-white"
                            : "bg-white text-black"
                        } transition-colors`}
                        onClick={() => setRequestFor("self")}
                      >
                        For You
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-md border ${
                          requestFor === "other"
                            ? "bg-black text-white"
                            : "bg-white text-black"
                        } transition-colors`}
                        onClick={() => setRequestFor("other")}
                      >
                        For Others
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {requestFor === "other" &&
                      activeDocument.certificateType !== "e_blotter" && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                          <h4 className="font-medium text-gray-700">
                            Person Information
                          </h4>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name *
                              </label>
                              <input
                                type="text"
                                value={formData.forPerson?.firstName || ""}
                                onChange={(e) =>
                                  handleForPersonChange(
                                    "firstName",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                required={requestFor === "other"}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name *
                              </label>
                              <input
                                type="text"
                                value={formData.forPerson?.lastName || ""}
                                onChange={(e) =>
                                  handleForPersonChange(
                                    "lastName",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                required={requestFor === "other"}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Relationship to You *
                            </label>
                            <input
                              type="text"
                              value={formData.forPerson?.relation || ""}
                              onChange={(e) =>
                                handleForPersonChange(
                                  "relation",
                                  e.target.value
                                )
                              }
                              r
                              required={requestFor === "other"}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address
                            </label>
                            <input
                              type="text"
                              value={formData.forPerson?.address || ""}
                              onChange={(e) =>
                                handleForPersonChange("address", e.target.value)
                              }
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Birth Date
                            </label>
                            <input
                              type="date"
                              value={formData.forPerson?.birthDate || ""}
                              onChange={(e) =>
                                handleForPersonChange(
                                  "birthDate",
                                  e.target.value
                                )
                              }
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}

                    {/* Wizard flow for E-Blotter */}
                    {activeDocument.certificateType === "e_blotter" ? (
                      <>
                        <h4 className="text-lg font-semibold mb-4">
                          {eBlotterSteps[currentStep - 1].title}
                        </h4>
                        {activeDocument.fields
                          .filter((f) =>
                            eBlotterSteps[currentStep - 1].fields.includes(
                              f.name
                            )
                          )
                          .map((field) => (
                            <div key={field.name}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}{" "}
                                {field.required && (
                                  <span className="text-red-500">*</span>
                                )}
                              </label>
                              {field.type === "textarea" ? (
                                <textarea
                                  name={field.name}
                                  value={formData[field.name] || ""}
                                  onChange={handleInputChange}
                                  required={field.required}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500"
                                  rows="3"
                                />
                              ) : (
                                <input
                                  type={field.type}
                                  name={field.name}
                                  value={formData[field.name] || ""}
                                  onChange={handleInputChange}
                                  required={field.required}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500"
                                />
                              )}
                            </div>
                          ))}
                        <div className="pt-4 flex justify-between">
                          {currentStep > 1 && (
                            <button
                              type="button"
                              onClick={() => setCurrentStep(currentStep - 1)}
                              className="px-10 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                              Back
                            </button>
                          )}
                          {currentStep < eBlotterSteps.length ? (
                            <button
                              type="button"
                              onClick={() => setCurrentStep(currentStep + 1)}
                              className="ml-auto px-10 py-2 bg-black text-white rounded-md hover:bg-gray-700"
                            >
                              Next
                            </button>
                          ) : (
                            <button
                              type="submit"
                              className="ml-auto px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700"
                            >
                              Submit Request
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      activeDocument.fields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}{" "}
                            {field.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          {field.type === "textarea" ? (
                            <textarea
                              name={field.name}
                              value={formData[field.name] || ""}
                              onChange={handleInputChange}
                              required={field.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                              rows="3"
                            />
                          ) : field.type === "select" ? (
                            <select
                              name={field.name}
                              value={formData[field.name] || ""}
                              onChange={handleInputChange}
                              required={field.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                              {field.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              name={field.name}
                              value={formData[field.name] || ""}
                              onChange={handleInputChange}
                              required={field.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                            />
                          )}
                        </div>
                      ))
                    )}

                    {activeDocument.certificateType !== "e_blotter" && (
                      <div className="pt-4">
                        <button
                          type="submit"
                          className="w-full py-2 px-4 bg-black text-white rounded-md hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                          Submit Request
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {/* PDF Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-gray-800/90 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">Document Preview</h3>
              <div className="flex gap-2">
                {/* Removed download button */}
                <button
                  onClick={handleClosePdfPreview}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              <iframe
                src={pdfPreview}
                width="100%"
                height="600"
                frameBorder="0"
                allowFullScreen
                loading="lazy"
                title="PDF Preview"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "center top",
                }}
              ></iframe>
            </div>
            <div className="p-4 border-t flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPreviousPage}
                  disabled={pageNumber <= 1}
                  className={`p-2 ${
                    pageNumber <= 1
                      ? "text-gray-300"
                      : "text-gray-600 hover:bg-gray-100 cursor-pointer"
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {pageNumber} of {numPages || "--"}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= (numPages || 1)}
                  className={`p-2 ${
                    pageNumber >= (numPages || 1)
                      ? "text-gray-300"
                      : "text-gray-600 hover:bg-gray-100 cursor-pointer"
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={zoomOut} className="p-2 cursor-pointer">
                  -
                </button>
                <span>{Math.round(scale * 100)}%</span>
                <button onClick={zoomIn} className="p-2 cursor-pointer">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
