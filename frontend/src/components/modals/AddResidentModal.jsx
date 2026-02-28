import React, { useState } from "react";
import { X, MapPin, ChevronDown, Calendar, Mail, Phone } from "lucide-react";
import axiosInstance from "../../components/auth/axiosInstance";
import { toast } from "react-toastify";

const AddResidentModal = ({ isOpen, onClose, onResidentAdded }) => {
  const [submitting, setSubmitting] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [contactType, setContactType] = useState("phone"); // "phone" or "email"
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    houseNumber: "",
    birthdate: "",
    gender: "Male",
    password: "",
  });

  // Street options - same as in UserLoginCard
  const streetOptions = [
    "J. Nepomuceno",
    "N. Padilla",
    "Mithi",
    "Espinosa",
    "P. Casal",
    "General Solano",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSelect = (street) => {
    setFormData((prev) => ({ ...prev, address: street }));
    setShowAddressDropdown(false);
  };

  const handleContactTypeChange = (type) => {
    setContactType(type);
    // Clear the field when switching types
    setFormData((prev) => ({ ...prev, phoneNumber: "" }));
  };

  const validateContact = (value) => {
    if (contactType === "phone") {
      // Phone validation: 11 digits
      return /^[0-9]{11}$/.test(value);
    } else {
      // Email validation: basic email format
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.address || !formData.houseNumber) {
        toast.error("Please select a street and enter house number");
        setSubmitting(false);
        return;
      }

      // Validate contact field
      if (!validateContact(formData.phoneNumber)) {
        toast.error(
          contactType === "phone" 
            ? "Please enter a valid 11-digit phone number" 
            : "Please enter a valid email address"
        );
        setSubmitting(false);
        return;
      }

      // Format the date properly before sending
      const formattedData = {
        ...formData,
        birthdate: new Date(formData.birthdate).toISOString(),
      };

      const response = await axiosInstance.post(
        "/admin/add-resident",
        formattedData
      );
      toast.success("Resident added successfully!");
      onClose();
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        address: "",
        houseNumber: "",
        birthdate: "",
        gender: "Male",
        password: "",
      });
      setContactType("phone");
      
      if (onResidentAdded) onResidentAdded();
    } catch (error) {
      console.error("Error adding resident:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to add resident. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/80 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add New Resident</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent caret-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent caret-black"
                  required
                />
              </div>
            </div>

            {/* Contact Field - Email or Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Information *
              </label>
              
              {/* Toggle Buttons */}
              <div className="flex mb-2 bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => handleContactTypeChange("phone")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    contactType === "phone"
                      ? "bg-white text-black shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleContactTypeChange("email")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    contactType === "email"
                      ? "bg-white text-black shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                </button>
              </div>

              {/* Input Field */}
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black">
                  {contactType === "phone" ? (
                    <Phone className="w-5 h-5 text-gray-400 mr-2" />
                  ) : (
                    <Mail className="w-5 h-5 text-gray-400 mr-2" />
                  )}
                  <input
                    type={contactType === "phone" ? "tel" : "email"}
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder={
                      contactType === "phone" 
                        ? "Enter 11-digit phone number" 
                        : "Enter email address"
                    }
                    className="w-full caret-black outline-none text-sm"
                    required
                    pattern={
                      contactType === "phone" 
                        ? "[0-9]{11}" 
                        : undefined
                    }
                    title={
                      contactType === "phone" 
                        ? "Phone number must be 11 digits" 
                        : "Please enter a valid email address"
                    }
                  />
                </div>
              </div>
            </div>

            {/* Address Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street *
              </label>
              <div
                className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-black cursor-pointer"
                onClick={() => setShowAddressDropdown(!showAddressDropdown)}
              >
                <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                <span
                  className={`flex-1 text-left ${
                    formData.address ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {formData.address || "Select Street"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    showAddressDropdown ? "rotate-180" : ""
                  }`}
                />
              </div>

              {showAddressDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 shadow-lg z-10 max-h-60 overflow-y-auto">
                  {streetOptions.map((street, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleAddressSelect(street)}
                    >
                      {street}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* House Number Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House Number *
              </label>
              <input
                type="text"
                name="houseNumber"
                value={formData.houseNumber}
                onChange={handleChange}
                placeholder="e.g., 123, 45A, etc."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent caret-black"
                required
              />
            </div>

            {/* Birthdate and Gender in one row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birth Date *
                </label>
                <div
                  className="flex items-center border border-gray-300 rounded-md px-3 py-[9px] relative cursor-pointer"
                  onClick={() =>
                    document.getElementById("birthdateInput")?.showPicker?.()
                  }
                >
                  <Calendar className="w-5 h-5 text-gray-400 mr-2" />

                  <span
                    className={`text-md ${
                      formData.birthdate ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    {formData.birthdate || "Select Birthdate"}
                  </span>

                  <input
                    id="birthdateInput"
                    type="date"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ pointerEvents: "auto" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent caret-black"
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent caret-black"
                required
                minLength="6"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Resident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResidentModal;