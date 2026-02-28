import React, { useState, useEffect } from "react";
import axiosInstance from "../../../components/auth/axiosInstance";
import { toast } from "react-toastify";

const CensusModal = ({ user, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    placeOfBirth: "",
    sex: "Male",
    sexSpecify: "",
    civilStatus: "",
    citizenship: "Filipino",
    occupation: "",
    employmentStatus: "",
    voterStatus: "",
    isHeadOfFamily: false,
    dataCollectionConsent: false,
    kasambahayDetails: {
      educationalAttainment: "",
      natureOfWork: "",
      employmentArrangement: "",
      salary: "",
      memberships: { sss: false, philhealth: false, pagibig: false },
      employerName: "",
      employerHomeAddress: "",
      // Removed workAddress since it's not in the form
    },
  });

  const [showKasambahayFields, setShowKasambahayFields] = useState(false);
  const [showSexSpecify, setShowSexSpecify] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Calculate age from user's birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return "";
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Format number with commas
  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Remove commas for storage
  const removeCommas = (stringWithCommas) => {
    return stringWithCommas.replace(/,/g, "");
  };

  // Auto-fill full name and birthdate from user prop
  const fullName = user
    ? user.fullName || `${user.firstName} ${user.lastName}`
    : "";
  const birthdate = user ? user.birthdate || "" : "";
  const houseNumber = user ? user.houseNumber || "" : "";

  useEffect(() => {
    // Show kasambahay fields if employment status is Kasambahay
    setShowKasambahayFields(formData.employmentStatus === "Kasambahay");

    // Show specify field if sex is LGBTQ+
    setShowSexSpecify(formData.sex === "LGBTQ+");
  }, [formData.employmentStatus, formData.sex]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKasambahayChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        kasambahayDetails: {
          ...prev.kasambahayDetails,
          memberships: {
            ...prev.kasambahayDetails.memberships,
            [name]: checked,
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        kasambahayDetails: {
          ...prev.kasambahayDetails,
          [name]: value,
        },
      }));
    }
  };

  // Special handler for salary field to format with commas
  const handleSalaryChange = (e) => {
    const { value } = e.target;
    // Remove any non-digit characters
    const numericValue = value.replace(/[^\d]/g, "");
    // Format with commas if 4 or more digits
    const formattedValue =
      numericValue.length >= 4
        ? formatNumberWithCommas(numericValue)
        : numericValue;

    setFormData((prev) => ({
      ...prev,
      kasambahayDetails: {
        ...prev.kasambahayDetails,
        salary: formattedValue,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required fields
    if (
      !formData.placeOfBirth ||
      !formData.sex ||
      !formData.civilStatus ||
      !formData.citizenship ||
      !formData.occupation ||
      !formData.employmentStatus ||
      !formData.voterStatus ||
      !formData.dataCollectionConsent
    ) {
      toast.error("Please fill all required fields. Data collection consent is mandatory for census submission.");
      setIsLoading(false);
      return;
    }

    // Validate LGBTQ+ specification
    if (formData.sex === "LGBTQ+" && !formData.sexSpecify.trim()) {
      toast.warning(
        "Please specify your gender identity when selecting LGBTQ+."
      );
      setIsLoading(false);
      return;
    }

    // Validate kasambahay details if employmentStatus is Kasambahay
    if (formData.employmentStatus === "Kasambahay") {
      const k = formData.kasambahayDetails;
      // Remove commas from salary for validation
      const salaryValue = k.salary ? Number(removeCommas(k.salary)) : 0;

      // Check if salary is valid number
      if (isNaN(salaryValue) || salaryValue <= 0) {
        toast.error("Please enter a valid salary amount.");
        setIsLoading(false);
        return;
      }

      // Check all required kasambahay fields
      if (
        !k.educationalAttainment ||
        !k.natureOfWork ||
        !k.employmentArrangement ||
        !k.employerName ||
        !k.employerHomeAddress
      ) {
        toast.error("Please fill all Kasambahay details.");
        setIsLoading(false);
        return;
      }
    }

    // Check if trying to set as head of family
    if (formData.isHeadOfFamily) {
      try {
        const checkResponse = await axiosInstance.post(
          "/resident-data/check-household-head",
          {
            houseNumber: houseNumber,
          }
        );

        if (checkResponse.data.hasExistingHead) {
          toast.error(
            `This household already has a head of family: ${checkResponse.data.existingHead.name}. Please contact barangay administration if you believe this is an error.`
          );
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error checking household head:", error);
        // Continue with submission if check fails
      }
    }

    // Prepare payload - remove commas from salary before sending
    const payload = {
      ...formData,
      kasambahayDetails:
        formData.employmentStatus === "Kasambahay"
          ? {
              ...formData.kasambahayDetails,
              salary: formData.kasambahayDetails.salary
                ? removeCommas(formData.kasambahayDetails.salary)
                : "",
            }
          : {}, // Send empty object if not kasambahay
      age: calculateAge(birthdate),
      fullName,
      birthdate,
      houseNumber,
    };

    try {
      await axiosInstance.post("/resident-data/save", payload);
      toast.success("Census data submitted successfully!");
      setShowThankYou(true);
      // onComplete will be called after thank you modal is closed
    } catch (error) {
      console.error("Error saving census data:", error);
      if (
        error.response?.data?.message ===
        "This household already has a head of family"
      ) {
        toast.error(
          `Error: ${error.response.data.message}. The current head is: ${error.response.data.existingHead.name}`
        );
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error saving data. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeadOfFamilyChange = async (e) => {
    const isChecked = e.target.checked;

    if (isChecked) {
      try {
        const checkResponse = await axiosInstance.post(
          "/resident-data/check-household-head",
          {
            houseNumber: houseNumber,
          }
        );

        if (checkResponse.data.hasExistingHead) {
          toast.error(
            `The ${checkResponse.data.familySurname} family already has a head of family: ${checkResponse.data.existingHead.name}. You cannot set yourself as head of this family.`
          );
          return; // Don't update the state
        }
      } catch (error) {
        console.error("Error checking family head:", error);
        toast.error("Error checking family head status. Please try again.");
      }
    }

    // If no existing head or check failed, update the state
    setFormData((prev) => ({
      ...prev,
      isHeadOfFamily: isChecked,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-950/80 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Show Thank You Modal */}
        {showThankYou ? (
          <div className="flex flex-col items-center justify-center p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Thank you!
            </h2>
            <p className="text-gray-700 text-center mb-6">
              Thank you for filling up the census form.
              <br />
              Your information has been successfully submitted.
            </p>
            <button
              className="px-6 py-2 bg-black-600 text-white rounded-md bg-gray-700 cursor-pointer hover:bg-gray-800"
              onClick={onComplete}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                Census Data Collection
              </h2>
              <p className="text-gray-600 mt-1">
                Please provide your demographic information for barangay records
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    className="w-full p-2 border rounded bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    value={
                      birthdate ? new Date(birthdate).toLocaleDateString() : ""
                    }
                    className="w-full p-2 border rounded bg-gray-100"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    House Number
                  </label>
                  <input
                    type="text"
                    value={houseNumber}
                    className="w-full p-2 border rounded bg-gray-100"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Place of Birth
                  </label>
                  <input
                    type="text"
                    name="placeOfBirth"
                    value={formData.placeOfBirth}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sex</label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="LGBTQ+">LGBTQ+</option>
                  </select>
                </div>

                {/* LGBTQ+ Specify Field */}
                {showSexSpecify && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Please specify your gender identity
                    </label>
                    <select
                      name="sexSpecify"
                      value={formData.sexSpecify}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required={formData.sex === "LGBTQ+"}
                    >
                      <option value="">Select identity</option>
                      <option value="Transgender">Transgender</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Gay">Gay</option>
                      <option value="Lesbian">Lesbian</option>
                      <option value="Bisexual">Bisexual</option>
                      <option value="Queer">Queer</option>
                      <option value="Intersex">Intersex</option>
                      <option value="Asexual">Asexual</option>
                      <option value="Other">Other</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      This helps us better understand and serve our diverse
                      community
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Civil Status
                  </label>
                  <select
                    name="civilStatus"
                    value={formData.civilStatus}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Citizenship
                  </label>
                  <input
                    type="text"
                    name="citizenship"
                    value={formData.citizenship}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Employment Status
                  </label>
                  <select
                    name="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select</option>
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
                  <label className="block text-sm font-medium mb-1">
                    Voter Status
                  </label>
                  <select
                    name="voterStatus"
                    value={formData.voterStatus}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Registered">Registered Voter</option>
                    <option value="Not Registered">Not Registered</option>
                    <option value="Pre-Registered">Pre-Registered</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.voterStatus === "Registered" &&
                      "You are currently a registered voter in this barangay"}
                    {formData.voterStatus === "Not Registered" &&
                      "You are not registered as a voter in this barangay"}
                    {formData.voterStatus === "Pre-Registered" &&
                      "You have applied for voter registration but not yet approved"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Age (Computed)
                  </label>
                  <input
                    type="text"
                    value={calculateAge(birthdate)}
                    className="w-full p-2 border rounded bg-gray-100"
                    disabled
                  />
                </div>

                {/* Add this after the Age (Computed) field */}
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isHeadOfFamily"
                      checked={formData.isHeadOfFamily || false}
                      onChange={handleHeadOfFamilyChange}
                      className="mr-2"
                    />
                    I am the head of my family ({user?.lastName} family)
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Only one person per family can be designated as head of
                    family. Multiple families can exist in the same household.
                  </p>
                </div>
              </div>

              {/* Data Collection Consent */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Data Collection Consent
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="dataCollectionConsent"
                        id="dataCollectionConsent"
                        checked={formData.dataCollectionConsent}
                        onChange={handleInputChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label 
                        htmlFor="dataCollectionConsent" 
                        className="font-medium text-gray-700 cursor-pointer"
                      >
                        I agree to the collection of my data for improving barangay services and analytics
                      </label>
                      <p className="text-gray-600 mt-2">
                        By providing consent, you authorize the barangay to collect, store, and process your personal information for census purposes, service improvement, and statistical analysis. Your data will be kept secure and confidential, and will not be shared with unauthorized third parties. You can withdraw this consent at any time by contacting the barangay office.
                      </p>
                      <div className="mt-3">
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                          onClick={(e) => {
                            e.preventDefault();
                            alert("Privacy Policy: We collect data only for census purposes, service improvement, and statistical analysis. Your information is protected under Republic Act No. 10173 (Data Privacy Act of 2012) and will never be shared without your consent.");
                          }}
                        >
                          View Full Privacy Policy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kasambahay Specific Fields */}
              {showKasambahayFields && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Kasambahay Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Educational Attainment
                      </label>
                      <select
                        name="educationalAttainment"
                        value={formData.kasambahayDetails.educationalAttainment}
                        onChange={handleKasambahayChange}
                        className="w-full p-2 border rounded"
                        required={showKasambahayFields}
                      >
                        <option value="">Select</option>
                        <option value="Elementary">Elementary</option>
                        <option value="High School">High School</option>
                        <option value="Vocational">Vocational</option>
                        <option value="College">College</option>
                        <option value="Post-Graduate">Post-Graduate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Nature of Work
                      </label>
                      <input
                        type="text"
                        name="natureOfWork"
                        value={formData.kasambahayDetails.natureOfWork}
                        onChange={handleKasambahayChange}
                        className="w-full p-2 border rounded"
                        required={showKasambahayFields}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Employment Arrangement
                      </label>
                      <select
                        name="employmentArrangement"
                        value={formData.kasambahayDetails.employmentArrangement}
                        onChange={handleKasambahayChange}
                        className="w-full p-2 border rounded"
                        required={showKasambahayFields}
                      >
                        <option value="">Select</option>
                        <option value="Live-in">Live-in</option>
                        <option value="Live-out">Live-out</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Salary (Monthly)
                      </label>
                      <input
                        type="text"
                        name="salary"
                        value={formData.kasambahayDetails.salary}
                        onChange={handleSalaryChange}
                        className="w-full p-2 border rounded"
                        required={showKasambahayFields}
                        placeholder="Enter monthly salary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Memberships
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="sss"
                            checked={formData.kasambahayDetails.memberships.sss}
                            onChange={handleKasambahayChange}
                            className="mr-2"
                          />
                          SSS
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="philhealth"
                            checked={
                              formData.kasambahayDetails.memberships.philhealth
                            }
                            onChange={handleKasambahayChange}
                            className="mr-2"
                          />
                          PhilHealth
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="pagibig"
                            checked={
                              formData.kasambahayDetails.memberships.pagibig
                            }
                            onChange={handleKasambahayChange}
                            className="mr-2"
                          />
                          Pag-IBIG
                        </label>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Employer's Full Name
                      </label>
                      <input
                        type="text"
                        name="employerName"
                        value={formData.kasambahayDetails.employerName}
                        onChange={handleKasambahayChange}
                        className="w-full p-2 border rounded"
                        required={showKasambahayFields}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Employer's Home Address
                      </label>
                      <textarea
                        name="employerHomeAddress"
                        value={formData.kasambahayDetails.employerHomeAddress}
                        onChange={handleKasambahayChange}
                        className="w-full p-2 border rounded"
                        required={showKasambahayFields}
                        rows="3"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CensusModal;
