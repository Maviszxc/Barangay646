/** @format */
import React, { useState, useEffect } from "react";
import Loader from "../../../components/Loader";
import axiosIntance from "../../../components/auth/axiosInstance";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Lock,
  Settings,
  Trash2,
  LogOut,
  Upload,
  X,
  XCircle,
  Clock,
  Users,
  Crown,
  Home,
  Heart,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Edit,
} from "lucide-react";
import brgylogo from "../../../assets/BrgyLogo.png";
import { toast } from "react-toastify";
import EditProfile from "../../../components/profile/EditProfile";
import ChangePassword from "../../../components/profile/ChangePassword";
import AddHouseholdMemberModal from "../../../components/profile/AddHouseholdMemberModal";
import EditHouseholdMemberModal from "../../../components/profile/EditHouseholdMemberModal";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [showVerificationModal, setShowVerificationModal] = useState("");
  const [idImage, setIdImage] = useState(null);
  const [idPreview, setIdPreview] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(10);
  const [user, setUser] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);
  const [isVerified, setIsVerified] = useState("");
  const [householdInfo, setHouseholdInfo] = useState(null);

  // Add this function to handle showing more items
  const handleShowMore = () => {
    setVisibleHistoryCount((prevCount) => prevCount + 10);
  };

  // Add this function to handle showing less items
  const handleShowLess = () => {
    setVisibleHistoryCount(10);
  };

  // Function to handle tab changes and scroll to top
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showDeleteMemberConfirm, setShowDeleteMemberConfirm] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [dataCollectionConsent, setDataCollectionConsent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []); // ✅ runs only once

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosIntance.get("/user/profile");
        setUser({
          fullName: response.data.fullName,
          address: response.data.address,
          houseNumber: response.data.houseNumber,
          contact: response.data.contact,
          birthdate: response.data.birthdate,
          registrationDate: response.data.registrationDate,
          notificationPreferences: response.data.notificationPreferences,
          _id: response.data._id,
          idImage: response.data.idImage,
          dataCollectionConsent: response.data.dataCollectionConsent || false,
        });

        // Fetch household info using new backend endpoint for logged-in user
        const householdRes = await axiosIntance.get("/user/household");
        setHouseholdInfo(householdRes.data);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load profile");
        localStorage.removeItem("userToken");
      } finally {
        setLoading(false);
      }
    };

    const handleLogs = async () => {
      try {
        const response = await axiosIntance.get("/user/user-logs");
        const formattedLogs = response.data.activity.map((item) => ({
          id: item._id,
          certificate: item.certificateType,
          date: item.dateRequested,
          status: item.status,
          description: item.description,
          rejectionReason: item.rejectionReason || null,
        }));
        setRequestHistory(formattedLogs);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load logs");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    handleLogs();
  }, []);

  useEffect(() => {
    const checkUserVerification = async () => {
      try {
        const response = await axiosIntance.get(
          "/certificate/user-verification"
        );
        setIsVerified(response.data.status);
      } catch (error) {
        console.error("Error checking verification status:", error);
        toast.error("Failed to check verification status");
      }
    };

    checkUserVerification();
  }, []);

  useEffect(() => {
    if (isVerified === "unregistered" || isVerified === "rejected") {
      setShowVerificationModal(true);
    }
  }, [isVerified]);

  const handlePreferenceChange = async (key, newValue) => {
    // 1. Optimistically update UI
    setUser((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: newValue,
      },
    }));

    try {
      // 2. Send update to backend
      await axiosIntance.put("/user/notification-preferences", {
        preferences: {
          ...user.notificationPreferences,
          [key]: newValue,
        },
      });

      toast.success("Notification updated");
    } catch (err) {
      // 3. Rollback if update fails
      setUser((prev) => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [key]: !newValue,
        },
      }));
      toast.error(
        err?.response?.data?.message || "Failed to update preference"
      );
    }
  };

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (
      showDeleteMemberConfirm ||
      showDeleteAccountConfirm ||
      showEditProfile ||
      showChangePassword ||
      showVerificationModal ||
      showAddMemberModal
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    showDeleteMemberConfirm,
    showDeleteAccountConfirm,
    showEditProfile,
    showChangePassword,
    showVerificationModal,
    showAddMemberModal,
  ]);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/");
    toast.success("You have been logged out successfully");
  };

  const handleSubmitVerification = async () => {
    if (!idImage) {
      toast.error("Please upload an ID image");
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("validId", idImage);

      const response = await axiosIntance.post("/user/submit-id", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("Verification submitted successfully");
        setShowVerificationModal(false);
        setIsVerified("pending");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error("Failed to submit verification");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setIdImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    // In a real application, this would call an API to delete the account
    alert("Are you sure you want to delete your account?");
    try {
      await axiosIntance.delete("/user/delete-user");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete account");
    }
    setShowDeleteAccountConfirm(false);
    handleLogout();
  };

  const handleSaveProfile = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
    setShowEditProfile(false);
  };

  const handleAddMemberSuccess = () => {
    // Refetch household info to show the new member
    const fetchHouseholdInfo = async () => {
      try {
        const householdRes = await axiosIntance.get("/user/household");
        setHouseholdInfo(householdRes.data);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to refresh household info");
      }
    };
    fetchHouseholdInfo();
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setShowEditMemberModal(true);
  };

  const handleEditMemberSuccess = () => {
    // Refetch household info to show updated member
    const fetchHouseholdInfo = async () => {
      try {
        const householdRes = await axiosIntance.get("/user/household");
        setHouseholdInfo(householdRes.data);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to refresh household info");
      }
    };
    fetchHouseholdInfo();
  };

  // Helper function to get avatar URL with fallback
  const getAvatarUrl = (member, size = 80) => {
    // Check if image exists and is not a broken Supabase URL
    if (member.image && !member.image.includes('supabase.co')) {
      return member.image;
    }
    // Fallback to UI avatars
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=${member.isHeadOfFamily ? 'f59e0b' : '3b82f6'}&color=fff&size=${size}`;
  };

  // Helper function for main profile avatar
  const getProfileAvatarUrl = () => {
    if (user.idImage && !user.idImage.includes('supabase.co')) {
      return user.idImage;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=3b82f6&color=fff&size=128`;
  };

  const handleDataCollectionConsent = async (consent) => {
    setDataCollectionConsent(consent);
    
    try {
      await axiosIntance.put("/user/data-collection-consent", { consent });
      toast.success(consent ? "Data collection consent updated" : "Data collection consent withdrawn");
    } catch (error) {
      console.error("Error updating data collection consent:", error);
      toast.error(error?.response?.data?.message || "Failed to update consent");
    }
  };

  const handleDeleteMember = (member) => {
    setDeletingMember(member);
    setShowDeleteMemberConfirm(true);
  };

  const confirmDeleteMember = async () => {
    if (!deletingMember) return;

    console.log("Deleting member:", deletingMember);
    console.log("Member ID:", deletingMember.id);

    try {
      const response = await axiosIntance.delete(`/user/delete-household-member/${deletingMember.id}`);
      
      if (response.data.success) {
        toast.success("Household member deleted successfully!");
        
        // Refetch household info to update the list
        const fetchHouseholdInfo = async () => {
          try {
            const householdRes = await axiosIntance.get("/user/household");
            setHouseholdInfo(householdRes.data);
          } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to refresh household info");
          }
        };
        fetchHouseholdInfo();
        
        setShowDeleteMemberConfirm(false);
        setDeletingMember(null);
      } else {
        toast.error(response.data.message || "Failed to delete household member");
      }
    } catch (error) {
      console.error("Error deleting household member:", error);
      toast.error(error?.response?.data?.message || "Failed to delete household member");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl bg-white mx-auto rounded-lg shadow-sm overflow-hidden flex">
        {/* Sidebar with tabs */}
        <div className="w-64 border-r border-gray-200">
          <div className="p-6 text-center">
            <img
              className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md mx-auto"
              src={getProfileAvatarUrl()}
              alt="Resident Avatar"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=3b82f6&color=fff&size=128`;
              }}
            />           
            <h2 className="mt-4 text-xl font-semibold text-gray-800">
              {user.fullName}
            </h2>

            {isVerified === "approved" && (
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full uppercase font-semibold tracking-wide mt-2">
                Resident
              </span>
            )}
            {isVerified === "unregistered" && (
              <div className="flex flex-col items-center gap-3 mt-2">
                <span className="inline-block bg-gray-300 text-blue-600 text-xs px-2 py-1 rounded-full uppercase font-semibold tracking-wide">
                  NOT VERIFIED
                </span>
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="px-4 py-2 bg-blue-100 text-blue-600 text-sm rounded-md hover:bg-blue-500 hover:text-white transition-colors font-semibold"
                >
                  Get Verified
                </button>
              </div>
            )}

            {isVerified === "pending" && (
              <span className="inline-block bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full uppercase font-semibold tracking-wide mt-2">
                Pending
              </span>
            )}

            {isVerified === "rejected" && (
              <div className="flex flex-col items-center gap-3 mt-2">
                <span className="inline-block bg-red-100 text-red-600  text-xs px-2 py-1 rounded-full uppercase font-semibold tracking-wide">
                  Rejected
                </span>
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="px-4 py-2 bg-blue-100 text-blue-600 text-sm rounded-md hover:bg-blue-500 hover:text-white transition-colors font-semibold"
                >
                  Apply Again
                </button>
              </div>
            )}
          </div>

          <nav className="mt-6 px-3">
            <button
              onClick={() => handleTabChange("profile")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md mb-2 cursor-pointer ${
                activeTab === "profile"
                  ? "bg-gray-50 text-gray-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <User className="mr-3 h-5 w-5" />
              Profile Information
            </button>
            <button
              onClick={() => handleTabChange("family")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md mb-2 cursor-pointer ${
                activeTab === "family"
                  ? "bg-gray-50 text-gray-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users className="mr-3 h-5 w-5" />
              Family Members
            </button>
            <button
              onClick={() => handleTabChange("history")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md mb-2 cursor-pointer ${
                activeTab === "history"
                  ? "bg-gray-50 text-gray-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FileText className="mr-3 h-5 w-5" />
              Request History
            </button>
            <button
              onClick={() => handleTabChange("settings")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md mb-2 cursor-pointer ${
                activeTab === "settings"
                  ? "bg-gray-50 text-gray-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Settings className="mr-3 h-5 w-5" />
              Account Settings
            </button>

            {/* Logout Button */}
            <div className="border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-md mb-2 text-gray-600 hover:bg-gray-100 hover:text-red-600 mt-4 cursor-pointer"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </nav>
        </div>

        {/* Rest of the code remains the same */}
        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {/* Profile Header */}
          <div className=" px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">
              {activeTab === "profile" && "Profile Information"}
              {activeTab === "family" && "Family Members"}
              {activeTab === "history" && "Request History"}
              {activeTab === "settings" && "Account Settings"}
            </h1>
          </div>

          {/* Profile Tab Content */}
          {activeTab === "profile" && (
            <div className="px-6 py-4">
              <div className="border-t border-gray-200">
                <dl className="divide-y divide-gray-200">
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <User className="w-4 h-4" /> Full name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {user.fullName}
                    </dd>
                  </div>

                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {user.email || "Not provided"}
                    </dd>
                  </div>

                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Phone Number
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {user.contact}
                    </dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {user.address} {user.houseNumber}
                    </dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Birthdate
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(user.birthdate).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Registration date
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(user.registrationDate).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Family Tab Content */}
          {activeTab === "family" && (
            <div className="px-6 py-4">
              <div className="border-t border-gray-200 pt-4">
                {/* Add Member Button - Only show for head of family */}
                {/* Temporary: Show button for all users for testing */}
                {true && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowAddMemberModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Household Member
                    </button>
                  </div>
                )}

               

                {/* Members Section */}
                {householdInfo && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        Household Members
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({householdInfo.totalMembers} members)
                      </span>
                    </div>
                    
                    {/* Head of Family Section */}
                    {householdInfo.headOfFamily && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Crown className="w-5 h-5 text-yellow-600" />
                          <h4 className="text-md font-semibold text-gray-700">
                            Head of Family
                          </h4>
                        </div>
                        {householdInfo.members
                          .filter(member => member.isHeadOfFamily)
                          .map(member => (
                            <div
                              key={member.id}
                              className="flex items-center gap-4 p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50 shadow-sm"
                            >
                              <img
                                src={getAvatarUrl(member, 80)}
                                alt={member.fullName}
                                className="w-16 h-16 rounded-full object-cover border-2 border-yellow-300"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=f59e0b&color=fff&size=80`;
                                }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-lg text-gray-900">
                                    {member.fullName}
                                  </span>
                                  <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded-full flex items-center gap-1">
                                    <Crown className="w-3 h-3" />
                                    HEAD
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    <span>{member.phoneNumber}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Home className="w-4 h-4" />
                                    <span>{member.address} {member.houseNumber}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Other Family Members */}
                    {householdInfo.members.filter(member => !member.isHeadOfFamily).length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-5 h-5 text-gray-600" />
                          <h4 className="text-md font-semibold text-gray-700">
                            Family Members
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto">
                          {householdInfo.members
                            .filter(member => !member.isHeadOfFamily)
                            .map((member) => (
                              <div
                                key={member.id}
                                className="flex flex-col md:flex-row items-center gap-4 p-4 rounded border shadow-sm bg-white border-gray-200"
                              >
                                <img
                                  src={getAvatarUrl(member, 80)}
                                  alt={member.fullName}
                                  className="w-20 h-20 rounded-full object-cover border"
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=3b82f6&color=fff&size=80`;
                                  }}
                                />
                                <div className="flex-1 w-full">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-lg text-gray-900">
                                      {member.fullName}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4" />
                                      <span>{member.phoneNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      <span>Age: {member.age}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Home className="w-4 h-4" />
                                      <span>{member.address} {member.houseNumber}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Action buttons - Only show for head of family and not for head member */}
                                {/* Temporary: Show buttons for all users for testing */}
                                {true && !member.isHeadOfFamily && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditMember(member)}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                      title="Edit member"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMember(member)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                      title="Delete member"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab Content */}
          {activeTab === "history" && (
            <div className="px-6 py-4">
              <div className="border-t border-gray-200 pt-4">
                {requestHistory.length > 0 ? (
                  <div className="overflow-hidden rounded-md border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Type
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date Submitted
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {requestHistory
                          .slice(0, visibleHistoryCount)
                          .map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50">
                              {request.certificate === "e_blotter" ? (
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  E-Blotter Complaint
                                </td>
                              ) : request.certificate === "bus_clearance" ? (
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  Business Clearance
                                </td>
                              ) : request.certificate === "brgy_clearance" ? (
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  Barangay Clearance
                                </td>
                              ) : request.certificate ===
                                "Certificate of Indigency" ? (
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  Certificate of Indigency
                                </td>
                              ) : (
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  E-Blotter Complaint
                                </td>
                              )}

                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {request.date}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    request.status === "Approved"
                                      ? "bg-green-100 text-green-800"
                                      : request.status === "Pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {request.status === "Approved" ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : request.status === "Pending" ? (
                                    <Clock className="w-3 h-3" />
                                  ) : (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                  {request.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                <div
                                  className="truncate max-w-xs"
                                  title={request.description}
                                >
                                  {request.description}
                                </div>
                                {request.rejectionReason && (
                                  <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {request.rejectionReason}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>

                    {/* Show More/Less buttons */}
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-center">
                      {requestHistory.length > visibleHistoryCount ? (
                        <button
                          onClick={handleShowMore}
                          className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                          See More (
                          {requestHistory.length - visibleHistoryCount} more)
                        </button>
                      ) : (
                        visibleHistoryCount > 10 && (
                          <div className="flex gap-2">
                            <button
                              onClick={handleShowLess}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors cursor-pointer"
                            >
                              Show Less
                            </button>
                            <span className="px-4 py-2 text-sm text-gray-500">
                              Showing all {requestHistory.length} items
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No request history found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab Content */}
          {activeTab === "settings" && (
            <div className="px-6 py-4">
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Email Notifications
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage your email notification preferences
                    </p>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="events"
                            name="events"
                            type="checkbox"
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                            checked={
                              user?.notificationPreferences?.events || false
                            }
                            onChange={(e) =>
                              handlePreferenceChange("events", e.target.checked)
                            }
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="events"
                            className="font-medium text-gray-700 cursor-pointer"
                          >
                            Event notifications
                          </label>
                          <p className="text-gray-500">
                            Get notified about upcoming barangay events
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start mt-4">
                        <div className="flex items-center h-5">
                          <input
                            id="updates"
                            name="updates"
                            type="checkbox"
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                            checked={
                              user?.notificationPreferences?.certificates ||
                              false
                            }
                            onChange={(e) =>
                              handlePreferenceChange(
                                "certificates",
                                e.target.checked
                              )
                            }
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="updates"
                            className="font-medium text-gray-700 cursor-pointer"
                          >
                            Request updates
                          </label>
                          <p className="text-gray-500">
                            Get notified when your request status changes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start mt-4">
                        <div className="flex items-center h-5">
                          <input
                            id="announcements"
                            name="announcements"
                            type="checkbox"
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                            checked={
                              user?.notificationPreferences?.announcements ||
                              false
                            }
                            onChange={(e) =>
                              handlePreferenceChange(
                                "announcements",
                                e.target.checked
                              )
                            }
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="announcements"
                            className="font-medium text-gray-700 cursor-pointer"
                          >
                            Announcements
                          </label>
                          <p className="text-gray-500">
                            Get notified about important barangay announcements
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Account Security
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Update your password and security settings
                    </p>
                    <div className="mt-4 space-y-4">
                      <button
                        onClick={() => setShowChangePassword(true)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-4 h-4" /> Change Password
                      </button>
                      {/* <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="twoFactor"
                            name="twoFactor"
                            type="checkbox"
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="twoFactor"
                            className="font-medium text-gray-700 cursor-pointer"
                          >
                            Two-factor authentication
                          </label>
                          <p className="text-gray-500">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                      </div> */}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Danger Zone
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Irreversible and destructive actions
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => setShowDeleteAccountConfirm(true)}
                        className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Profile Modal */}
          {showEditProfile && (
            <EditProfile
              user={user}
              onSave={handleSaveProfile}
              onCancel={() => setShowEditProfile(false)}
              isAdmin={false}
            />
          )}

          {/* Change Password Modal */}
          {showChangePassword && (
            <ChangePassword
              onClose={() => setShowChangePassword(false)}
              userPhone={user.phone}
              role="user"
            />
          )}

          {/* Add Household Member Modal */}
          {showAddMemberModal && (
            <AddHouseholdMemberModal
              onClose={() => setShowAddMemberModal(false)}
              onSuccess={handleAddMemberSuccess}
            />
          )}

          {/* Edit Household Member Modal */}
          {showEditMemberModal && editingMember && (
            <EditHouseholdMemberModal
              member={editingMember}
              onClose={() => {
                setShowEditMemberModal(false);
                setEditingMember(null);
              }}
              onSuccess={handleEditMemberSuccess}
            />
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteMemberConfirm && deletingMember && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Delete Household Member
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>{deletingMember.fullName}</strong> from your household? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteMemberConfirm(false);
                      setDeletingMember(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteMember}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete Member
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Account Confirmation Modal */}
          {showDeleteAccountConfirm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Delete Account
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteAccountConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Verification Modal */}
          {showVerificationModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                {/* Header with BrgyLogo and close button */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <img
                      src={brgylogo}
                      alt="BMS646 Logo"
                      className="h-8 sm:h-10 mr-3"
                    />
                    <h3 className="text-lg font-bold text-gray-800">
                      Identity Verification
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6 text-sm">
                  {isVerified === "rejected"
                    ? "Your previous verification was rejected. Please upload a valid government-issued ID to verify your identity as a resident of the barangay."
                    : "To access all features, please verify your identity by uploading a valid government-issued ID."}
                </p>

                {/* Upload Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Valid ID *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="id-upload"
                      />

                      {idPreview ? (
                        <div className="relative">
                          <img
                            src={idPreview}
                            alt="ID preview"
                            className="mx-auto max-h-48 rounded-md"
                          />
                          <button
                            onClick={() => {
                              setIdPreview("");
                              setIdImage(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 cursor-pointer hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <p className="text-sm text-gray-500 mt-3">
                            Click to change image
                          </p>
                        </div>
                      ) : (
                        <label htmlFor="id-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center">
                            <Upload className="w-10 h-10 text-gray-400 mb-3" />
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Upload ID Photo
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, PDF up to 5MB
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowVerificationModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitVerification}
                      disabled={uploadLoading || !idImage}
                      className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm font-medium flex items-center justify-center"
                    >
                      {uploadLoading ? (
                        <>Submitting...</>
                      ) : (
                        "Submit Verification"
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

export default Profile;
