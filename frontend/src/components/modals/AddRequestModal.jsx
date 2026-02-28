import React, { useState, useEffect, useMemo } from "react";
import { X, Search } from "lucide-react";
import axiosInstance from "../../components/auth/axiosInstance";
import { toast } from "react-toastify";

const AddRequestModal = ({ isOpen, onClose, onRequestAdded }) => {
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    certificateType: "brgy_clearance",
    purpose: "",
  });
  const [currentStep, setCurrentStep] = useState(1);

  // Document types with their respective fields
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

  // Define steps for E-Blotter wizard
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

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSearchTerm("");
      setIsDropdownOpen(false);
      setFormData({
        userId: "",
        certificateType: "brgy_clearance",
        purpose: "",
      });
      setCurrentStep(1);
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/admin/all-residences");
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  // Get current document type
  const currentDocument = useMemo(() => {
    return documentTypes.find(
      (doc) => doc.certificateType === formData.certificateType
    );
  }, [formData.certificateType]);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;

    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [users, searchTerm]);

  const handleUserSelect = (userId, fullName) => {
    setFormData({ ...formData, userId });
    setSearchTerm(fullName);
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
    if (
      formData.userId &&
      e.target.value !==
        `${users.find((u) => u._id === formData.userId)?.firstName} ${
          users.find((u) => u._id === formData.userId)?.lastName
        }`
    ) {
      setFormData({ ...formData, userId: "" });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.userId) {
      toast.error("Please select a resident");
      return;
    }

    // Validate required fields based on certificate type
    if (currentDocument) {
      for (const field of currentDocument.fields) {
        if (field.required && !formData[field.name]) {
          toast.error(`Please fill ${field.label}.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        certificateType: formData.certificateType,
        purpose: formData.purpose,
        userId: formData.userId,
        isForSelf: true, // Admin is requesting on behalf of user
      };

      // Add certificate-specific data based on document type
      if (formData.certificateType === "indigency") {
        payload.certificateData = {
          monthlyIncome: formData.monthlyIncome,
          familyMembers: parseInt(formData.familyMembers),
          sourceOfIncome: formData.sourceOfIncome || "",
          propertiesOwned: formData.propertiesOwned
            ? formData.propertiesOwned.split(",")
            : [],
          hasSSS: formData.hasSSS || false,
          hasPhilhealth: formData.hasPhilhealth || false,
        };
      } else if (formData.certificateType === "e_blotter") {
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

      await axiosInstance.post("/certificate/request", payload);

      toast.success("Certificate request submitted successfully!");
      onClose();
      setSearchTerm("");
      if (onRequestAdded) onRequestAdded();
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setIsDropdownOpen(false), 200);
  };

  const handleFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleCertificateTypeChange = (e) => {
    const newType = e.target.value;
    setFormData({
      userId: formData.userId,
      certificateType: newType,
      purpose: "",
    });
    setCurrentStep(1);
  };

  // Render dynamic fields based on certificate type
  const renderDynamicFields = () => {
    if (!currentDocument) return null;

    // Special handling for E-Blotter wizard
    if (formData.certificateType === "e_blotter") {
      const currentStepFields = eBlotterSteps[currentStep - 1];

      return (
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-700 border-b pb-2">
            {currentStepFields.title}
          </h4>
          {currentDocument.fields
            .filter((f) => currentStepFields.fields.includes(f.name))
            .map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}{" "}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleInputChange}
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    rows="3"
                  />
                ) : field.type === "select" ? (
                  <select
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleInputChange}
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}

          {/* Navigation buttons for E-Blotter wizard */}
          <div className="pt-4 flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
            )}
            {currentStep < eBlotterSteps.length ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="ml-auto px-6 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="ml-auto px-6 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Submit Request
              </button>
            )}
          </div>
        </div>
      );
    }

    // Regular fields for other certificate types
    return (
      <div className="space-y-4">
        {currentDocument.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleInputChange}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                rows="3"
              />
            ) : field.type === "select" ? (
              <select
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleInputChange}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/80 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">New Certificate Request</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Resident Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Resident *
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Search residents..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent caret-black"
                  />
                </div>
          
                {isDropdownOpen && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        onMouseDown={() =>
                          // Change from onClick to onMouseDown
                          handleUserSelect(
                            user._id,
                            `${user.firstName} ${user.lastName}`
                          )
                        }
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        {user.firstName} {user.lastName}
                      </div>
                    ))}
                  </div>
                )}
                {isDropdownOpen && searchTerm && filteredUsers.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="px-4 py-2 text-gray-500">
                      No residents found
                    </div>
                  </div>
                )}
              </div>

              {/* {formData.userId && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected:{" "}
                  {users.find((u) => u._id === formData.userId)?.firstName}{" "}
                  {users.find((u) => u._id === formData.userId)?.lastName}
                </p>
              )} */}
            </div>

            {/* Certificate Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificate Type *
              </label>
              <select
                value={formData.certificateType}
                onChange={handleCertificateTypeChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent caret-black"
                required
              >
                {documentTypes.map((doc) => (
                  <option key={doc.certificateType} value={doc.certificateType}>
                    {doc.name}
                  </option>
                ))}
              </select>
              {currentDocument && (
                <p className="text-sm text-gray-500 mt-1">
                  {currentDocument.description}
                </p>
              )}
            </div>

            {/* Dynamic Fields */}
            {renderDynamicFields()}

            {/* Submit button for non-E-Blotter forms */}
            {formData.certificateType !== "e_blotter" && (
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 px-4 bg-black text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRequestModal;
