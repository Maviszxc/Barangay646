// Create a new file: EditResidentModal.jsx
import React, { useState, useEffect } from "react";
import { X, Loader } from "lucide-react";
import axiosInstance from "../../../components/auth/axiosInstance";
import { toast } from "react-toastify";

const EditResidentModal = ({
  isOpen,
  onClose,
  resident,
  onResidentUpdated,
  onResidentDeleted,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    birthdate: "",
    address: "",
    gender: "",
    civilStatus: "",
    occupation: "",
    employmentStatus: "",
    voterStatus: "",
    isHeadOfFamily: false,
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (resident && isOpen) {
      // Fetch complete resident details including census data
      fetchResidentDetails();
    }
  }, [resident, isOpen]);

  const fetchResidentDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/admin/resident/${resident.id}`
      );
      const { user, census } = response.data.data;

      // Extract first and last name from full name
      const nameParts =
        user.firstName && user.lastName
          ? { firstName: user.firstName, lastName: user.lastName }
          : splitFullName(user.name || `${user.firstName} ${user.lastName}`);

      setFormData({
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        phoneNumber: user.phoneNumber || "",
        birthdate: user.birthdate
          ? new Date(user.birthdate).toISOString().split("T")[0]
          : "",
        address: user.address || "",
        gender: user.gender || census?.sex || "",
        civilStatus: census?.civilStatus || "",
        occupation: census?.occupation || "",
        employmentStatus: census?.employmentStatus || "",
        voterStatus: census?.voterStatus || "",
        isHeadOfFamily: census?.isHeadOfFamily || false,
      });
    } catch (error) {
      console.error("Error fetching resident details:", error);
      toast.error("Failed to load resident details");
    } finally {
      setLoading(false);
    }
  };

  const splitFullName = (fullName) => {
    const names = fullName.split(" ");
    const lastName = names.pop() || "";
    const firstName = names.join(" ") || "";
    return { firstName, lastName };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Special handler for head of family checkbox with validation
  const handleHeadOfFamilyChange = async (e) => {
    const isChecked = e.target.checked;

    if (isChecked) {
      try {
        const checkResponse = await axiosInstance.post(
          "/resident-data/admin/check-household-head", // Updated admin endpoint
          {
            houseNumber: resident.houseNumber || formData.address,
            residentId: resident.id, // Pass the resident ID to exclude them from check
            familySurname: formData.lastName, // Pass the surname explicitly
          }
        );

        if (checkResponse.data.hasExistingHead) {
          toast.error(
            `The ${checkResponse.data.familySurname} family already has a head of family: ${checkResponse.data.existingHead.name}. You cannot set this resident as head of this family.`
          );
          return; // Don't update the state
        }
      } catch (error) {
        console.error("Error checking family head:", error);
        toast.error("Error checking family head status. Please try again.");
        return; // Don't update the state if check fails
      }
    }

    // If no existing head or unchecking, update the state
    setFormData((prev) => ({
      ...prev,
      isHeadOfFamily: isChecked,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation before submission
    if (formData.isHeadOfFamily) {
      try {
        const checkResponse = await axiosInstance.post(
          "/resident-data/admin/check-household-head", // Updated admin endpoint
          {
            houseNumber: resident.houseNumber || formData.address,
            residentId: resident.id,
            familySurname: formData.lastName,
          }
        );

        if (checkResponse.data.hasExistingHead) {
          toast.error(
            `Cannot update resident: The ${checkResponse.data.familySurname} family already has a head of family: ${checkResponse.data.existingHead.name}.`
          );
          return;
        }
      } catch (error) {
        console.error("Error checking household head:", error);
        toast.error("Error verifying family head status. Please try again.");
        return;
      }
    }

    try {
      setLoading(true);
      const response = await axiosInstance.put(
        `/admin/resident/${resident.id}`,
        formData
      );

      if (response.data.success) {
        toast.success("Resident updated successfully");
        onResidentUpdated(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error("Error updating resident:", error);

      // Handle specific backend validation errors
      if (error.response?.data?.message?.includes("head of family")) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update resident");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${formData.firstName} ${formData.lastName}? This will permanently remove all their data including census records, approvals, and OTP data. This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await axiosInstance.delete(
        `/admin/resident/${resident.id}`
      );

      if (response.data.success) {
        toast.success(response.data.message || "Resident deleted successfully");
        onResidentDeleted(resident.id);
        onClose();
      }
    } catch (error) {
      console.error("Error deleting resident:", error);
      toast.error(error.response?.data?.message || "Failed to delete resident");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/80 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Edit Resident</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Personal Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
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
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birthdate *
                  </label>
                  <input
                    type="date"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="LGBTQ+">LGBTQ+</option>
                  </select>
                </div>
              </div>

              {/* Census Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Census Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Civil Status *
                  </label>
                  <select
                    name="civilStatus"
                    value={formData.civilStatus}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Civil Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation *
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Status *
                  </label>
                  <select
                    name="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Employment Status</option>
                    <option value="Employed">Employed</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="PWD">PWD</option>
                    <option value="OFW">OFW</option>
                    <option value="Solo Parent">Solo Parent</option>
                    <option value="Out-of-School Youth">
                      Out-of-School Youth
                    </option>
                    <option value="Out-of-School Children">
                      Out-of-School Children
                    </option>
                    <option value="Kasambahay">Kasambahay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voter Status *
                  </label>
                  <select
                    name="voterStatus"
                    value={formData.voterStatus}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Voter Status</option>
                    <option value="Registered">Registered</option>
                    <option value="Not Registered">Not Registered</option>
                    <option value="Pre-Registered">Pre-Registered</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isHeadOfFamily"
                    checked={formData.isHeadOfFamily}
                    onChange={handleHeadOfFamilyChange}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Head of Family
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only one person per family can be designated as head of
                  family. Multiple families can exist in the same household.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete Resident"
                )}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    "Update Resident"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditResidentModal;
