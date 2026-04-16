import React, { useState, useEffect } from "react";
import Loader from "../../../components/Loader";
import ResidentsTable from "../../../components/ResidentsTable";
import axiosInstance from "../../../components/auth/axiosInstance";
import {
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Users,
  ClipboardList,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  X,
  Crown,
  User,
  Phone,
  Calendar,
  MapPin,
  ChevronDown,
  Home,
  Mail,
  Briefcase,
  Heart,
  AlertTriangle,
} from "lucide-react";
import StatCard from "../../../components/StatCard";
import { toast } from "react-toastify";
import EditResidentModal from "./EditResidentModal";
import AddResidentModal from "../../../components/modals/AddResidentModal";

const Residents = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isAddResidentModalOpen, setIsAddResidentModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact: "",
    status: "Active",
    image: null,
    imagePreview: "",
  });

  // Add these state variables
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedResidentForEdit, setSelectedResidentForEdit] = useState(null);
  const [selectedResidentForDelete, setSelectedResidentForDelete] =
    useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Approvals state
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedResident, setSelectedResident] = useState(null);
  const [isApprovalsModalOpen, setIsApprovalsModalOpen] = useState(false);
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isIDViewerOpen, setIsIDViewerOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [activeTab, setActiveTab] = useState("approvals");
  const [searchTerm, setSearchTerm] = useState("");

  // Add these functions
  const handleEditResident = (resident) => {
    setSelectedResidentForEdit(resident);
    setIsEditModalOpen(true);
  };

  const handleResidentUpdated = (updatedData) => {
    // Refresh the residents list
    fetchResidents();
    toast.success("Resident updated successfully");
  };

  const handleResidentDeleted = (residentId) => {
    // Remove resident from the list
    setResidents((prev) => prev.filter((r) => r.id !== residentId));
    toast.success("Resident deleted successfully");
  };

  const actionButtons = (
    <button
      onClick={() => onEdit(resident)}
      className="text-blue-600 hover:text-blue-900 mr-3"
      title="Edit Resident"
    >
      <Pencil className="w-4 h-4" />
    </button>
  );

const handleDeleteResident = async (resident) => {
  if (!window.confirm(`Are you sure you want to delete ${resident.name}? This will permanently remove all their data including census records, approvals, and OTP data. This action cannot be undone.`)) {
    return;
  }

  try {
    setDeleteLoading(true);
    const response = await axiosInstance.delete(`/admin/resident/${resident.id}`);
    
    if (response.data.success) {
      // Remove resident from the list
      setResidents(prev => prev.filter(r => r.id !== resident.id));
      toast.success(response.data.message || 'Resident deleted successfully');
      
      // Close any open modals
      setIsResidentModalOpen(false);
      setSelectedResident(null);
      
      // Refresh stats
      fetchLoggedInUsers();
      fetchHouseholdStats();
      fetchRegisteredVoters();
    }
  } catch (error) {
    console.error('Error deleting resident:', error);
    toast.error(error.response?.data?.message || 'Failed to delete resident');
  } finally {
    setDeleteLoading(false);
  }
};

  // New state for total logged in users
  const [totalLoggedInUsers, setTotalLoggedInUsers] = useState(0);
  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [totalRegisteredVoters, setTotalRegisteredVoters] = useState(0);

  useEffect(() => {
    fetchResidents();
    fetchPendingApprovals();
    fetchLoggedInUsers();
    fetchHouseholdStats();
    fetchRegisteredVoters();
  }, []);

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/admin/all-residences");
      const formattedResidents = await Promise.all(
        response.data.data.map(async (user) => {
          try {
            console.log('🔍 Processing user:', user._id, user.firstName, user.lastName);
            // Fetch census data for each user
            const censusResponse = await axiosInstance.get(
              `/resident-data/admin/user/${user._id}`
            );
            const censusData = censusResponse.data.data;
            console.log('📋 Census data for', user.firstName, ':', censusData);

            return {
              id: user._id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              address: user.address,
              houseNumber: user.houseNumber,
              contact: user.phoneNumber,
              status: user.isLoginApproved ? "Active" : "Pending",
              image: user.idImage || "https://via.placeholder.com/150",
              birthdate: user.birthdate,
              // Use sex from census data, fallback to gender from user data
              gender: censusData?.sex || user.gender || "Not Specified",
              isRegisteredVoter: user.isRegisteredVoter,
              accountStatus: user.accountStatus || "Active",
              // Add census data with proper fallbacks
              voterStatus: censusData?.voterStatus || "Not Registered",
              occupation: censusData?.occupation || "Not Specified",
              employmentStatus: censusData?.employmentStatus || "Not Specified",
              civilStatus: censusData?.civilStatus || "Not Specified",
              // Add sex specifically for debugging
              sex: censusData?.sex || user.gender || "Not Available",
              isHeadOfFamily: censusData?.isHeadOfFamily || false,
            };
          } catch (error) {
            console.error(
              `Error fetching census data for user ${user._id}:`,
              error
            );
            // Return user data even if census fails
            return {
              id: user._id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              address: user.address,
              houseNumber: user.houseNumber,
              contact: user.phoneNumber,
              status: user.isLoginApproved ? "Active" : "Pending",
              image: user.idImage || "https://via.placeholder.com/150",
              birthdate: user.birthdate,
              gender: user.gender || "Not Specified",
              isRegisteredVoter: user.isRegisteredVoter,
              accountStatus: user.accountStatus || "Active",
              voterStatus: "Not Registered",
              occupation: "Not Specified",
              employmentStatus: "Not Specified",
              civilStatus: "Not Specified",
              sex: user.gender || "Not Available",
              isHeadOfFamily: false,
            };
          }
        })
      );
      setResidents(formattedResidents);
    } catch (error) {
      console.error("Error fetching residents:", error);
      toast.error("Failed to load residents");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    setApprovalsLoading(true);
    try {
      const response = await axiosInstance.get("/admin/pending-approvals");
      const formattedPending = response.data.data.map((approval) => ({
        id: approval._id,
        userId: approval.user._id, // Now using the joined user data
        fullName: `${approval.user.firstName} ${approval.user.lastName}`,
        email: approval.user.email || "N/A",
        address: approval.user.address,
        houseNumber: approval.user.houseNumber,
        contactNumber: approval.user.phoneNumber,
        dateSubmitted: approval.submittedAt,
        idImage: approval.user.idImage || "https://via.placeholder.com/150",
        status: approval.status,
        birthdate: approval.user.birthdate,
        gender: approval.user.gender,
        isLoginApproved: approval.user.isLoginApproved,
      }));
      setPendingAccounts(formattedPending);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      toast.error("Failed to load pending approvals");
    } finally {
      setApprovalsLoading(false);
    }
  };

  const fetchLoggedInUsers = async () => {
    try {
      const response = await axiosInstance.get("/user/all-users");
      const loggedInUsers = response.data.users.filter(
        (u) => u.isLoginApproved
      );
      setTotalLoggedInUsers(loggedInUsers.length);
    } catch (error) {
      setTotalLoggedInUsers(0);
    }
  };

  const fetchHouseholdStats = async () => {
    try {
      const response = await axiosInstance.get(
        "/resident-data/admin/total-households"
      );
      setTotalHouseholds(response.data.data.totalHouseholds || 0);
    } catch (error) {
      setTotalHouseholds(0);
    }
  };

  const fetchRegisteredVoters = async () => {
    try {
      const response = await axiosInstance.get("/resident-data/admin/voter");
      const registeredVoterStat = response.data.statistics.find(
        (v) => v._id === "Registered"
      );
      setTotalRegisteredVoters(registeredVoterStat?.count || 0);
    } catch (error) {
      setTotalRegisteredVoters(0);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === "Active" ? "Deceased" : "Active";

      const response = await axiosInstance.put(
        `/admin/${userId}/account-status`,
        { accountStatus: newStatus }
      );

      if (response.data.success) {
        toast.success(`Account ${newStatus.toLowerCase()} successfully`);
        // Refresh the residents list
        fetchResidents();
      }
    } catch (error) {
      console.error("Error updating account status:", error);
      toast.error("Failed to update account status");
    }
  };

  const handleApprove = async (approvalId) => {
    try {
      await axiosInstance.put(`/admin/approve-request/${approvalId}`);
      // Refresh both lists after approval
      await fetchResidents();
      await fetchPendingApprovals();
      setSelectedAccount(null);
      setIsApprovalsModalOpen(false);
      toast.success("Account approved successfully");
    } catch (error) {
      console.error("Error approving account:", error);
      toast.error("Failed to approve account");
    }
  };

  const handleReject = async (approvalId) => {
    try {
      const response = await axiosInstance.put(
        `/admin/reject-request/${approvalId}`,
        {
          rejectionMessages: rejectionReasons,
        }
      );
      // Refresh pending approvals list after rejection
      await fetchPendingApprovals();
      setSelectedAccount(null);
      setIsRejectModalOpen(false);
      setIsApprovalsModalOpen(false);
      setRejectionReasons([]);
      toast.success("Account rejected successfully");
    } catch (error) {
      console.error("Error rejecting account:", error);
      toast.error("Failed to reject account");
    }
  };

  const handleViewResident = async (resident) => {
    try {
      // Fetch household information using user ID to get address and house number
      const householdResponse = await axiosInstance.get(
        `/resident-data/admin/household/${resident.id}`
      );
      const householdData = householdResponse.data;

      setSelectedResident({
        ...resident,
        isHeadOfFamily: householdData.headOfFamily?.userId === resident.id,
        householdMembers: householdData.members || [],
        headOfFamily: householdData.headOfFamily,
        householdAddress: householdData.address,
        householdNumber: householdData.houseNumber,
      });
      setIsResidentModalOpen(true);
    } catch (error) {
      console.error("Error fetching household data:", error);
      // If API fails, still show the resident details without household info
      setSelectedResident(resident);
      setIsResidentModalOpen(true);
      toast.error("Failed to load household information");
    }
  };

  const handleViewApproval = (account) => {
    setSelectedAccount(account);
    setIsApprovalsModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return "N/A";
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

  // Filtered residents based on search term
  const filteredResidents = residents
    .filter((r) => r.status === "Active")
    .filter((r) => {
      const term = searchTerm.toLowerCase();
      return (
        r.name.toLowerCase().includes(term) ||
        (r.address && r.address.toLowerCase().includes(term)) ||
        (r.contact && r.contact.toLowerCase().includes(term)) ||
        (r.houseNumber && r.houseNumber.toLowerCase().includes(term))
      );
    });

  const stats = [
    {
      label: "Total Verified Residents",
      value: totalLoggedInUsers,
      icon: <Users className="w-5 h-5" />,
      color: "bg-green-100 text-green-800",
    },
    {
      label: "Total Households",
      value: totalHouseholds,
      icon: <Home className="w-5 h-5" />,
      color: "bg-blue-100 text-blue-800",
    },
    {
      label: "Registered Voters",
      value: totalRegisteredVoters,
      icon: <ClipboardList className="w-5 h-5" />,
      color: "bg-yellow-100 text-yellow-800",
    },
  ];

  if (loading || approvalsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 pt-6">
          {stats.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        {/* Tabs for Residents List and Pending Account Approvals */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-10">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm cursor-pointer ${
                activeTab === "approvals"
                  ? "text-black border-b-2 border-black"
                  : "text-gray-500"
              }`}
              onClick={() => {
                setActiveTab("approvals");
                window.scrollTo(0, 0);
              }}
            >
              Pending Account Approvals
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm cursor-pointer ${
                activeTab === "residents"
                  ? "text-black border-b-2 border-black"
                  : "text-gray-500"
              }`}
              onClick={() => {
                setActiveTab("residents");
                window.scrollTo(0, 0);
              }}
            >
              Residents List
            </button>
          </div>

          {activeTab === "residents" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  Residents List
                </h1>
                <button
                  onClick={() => setIsAddResidentModalOpen(true)}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Resident
                </button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search residents by name, address, contact, or house number..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="overflow-x-auto">
                <ResidentsTable
                  residents={filteredResidents}
                  onRowClick={handleViewResident}
                  handletoggle={handleToggleStatus}
                  onEdit={handleEditResident}
                  onDelete={handleDeleteResident}
                />
              </div>
            </>
          )}

          {activeTab === "approvals" && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Pending Account Approvals
              </h2>
              <div className="overflow-x-auto">
                {pendingAccounts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No accounts pending approval
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Image
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingAccounts.map((account) => (
                        <tr
                          key={account.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleViewApproval(account)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <img
                              className="h-10 w-10 rounded object-cover"
                              src={account.idImage}
                              alt={account.fullName}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {account.fullName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {account.address} {account.houseNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {account.contactNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDate(account.dateSubmitted)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2 justify-center items-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewApproval(account);
                                }}
                                className="text-gray-600 hover:text-gray-800 flex gap-1 cursor-pointer"
                                title="View Details"
                              >
                                <Eye size={25} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Approvals Details Modal */}
      {isApprovalsModalOpen && selectedAccount && (
        <div className="fixed inset-0 bg-gray-950/80 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl">
            <h2 className="text-xl font-bold mb-4">Account Details</h2>
            <div className="flex flex-row gap-6">
              {/* Left column - ID Image */}
              <div className="w-1/2">
                <span className="text-xs text-gray-500 block mb-1">
                  Government ID:
                </span>
                <img
                  src={selectedAccount.idImage}
                  alt={`${selectedAccount.fullName}'s ID`}
                  className="w-full h-auto max-h-80 rounded-lg object-contain border border-gray-200 shadow-sm cursor-pointer"
                  onClick={() => setIsIDViewerOpen(true)}
                  title="Click to enlarge"
                />
              </div>

              {/* Right column - Account Details */}
              <div className="w-1/2">
                <div className="flex flex-col items-start mb-4">
                  <h3 className="font-bold text-lg">
                    {selectedAccount.fullName}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {selectedAccount.contactNumber}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Address:
                    </span>
                    <div className="text-gray-800">
                      {selectedAccount.address} {selectedAccount.houseNumber}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Contact:
                    </span>
                    <div className="text-gray-800">
                      {selectedAccount.contactNumber}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Date Submitted:
                    </span>
                    <div className="text-gray-800">
                      {formatDate(selectedAccount.dateSubmitted)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Status:</span>
                    <div className="text-gray-800">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedAccount.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : selectedAccount.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedAccount.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsRejectModalOpen(true);
                  setIsApprovalsModalOpen(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedAccount.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve Account
              </button>
              <button
                onClick={() => setIsApprovalsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 ml-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resident Details Modal */}
      {isResidentModalOpen && selectedResident && (
        <div className="fixed inset-0 bg-gray-950/80 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Resident Details</h2>
            <div className="flex flex-row gap-6">
              {/* Left column - Profile Image */}
              <div className="w-1/3">
                <span className="text-xs text-gray-500 block mb-1">
                  Profile Image:
                </span>
                <img
                  src={selectedResident.image}
                  alt={`${selectedResident.name}'s profile`}
                  className="w-auto h-auto max-h-80 rounded-lg object-contain border border-gray-200 shadow-sm cursor-pointer"
                  onClick={() => setIsIDViewerOpen(true)}
                  title="Click to enlarge"
                />

                {/* Head of Family Badge */}
                {selectedResident.isHeadOfFamily && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">
                        Head of Family
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Responsible for household {selectedResident.houseNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Right column - Resident Details */}
              <div className="w-2/3">
                <div className="flex flex-col items-start mb-4">
                  <h3 className="font-bold text-lg">{selectedResident.name}</h3>
                  <p className="text-gray-500 text-sm">
                    {selectedResident.email}
                  </p>
                </div>

                {/* Personal Information Section */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Address:
                      </span>
                      <div className="text-gray-800">
                        {selectedResident.address}{" "}
                        {selectedResident.houseNumber}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Contact Number:
                      </span>
                      <div className="text-gray-800">
                        {selectedResident.contact}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Birthdate:
                      </span>
                      <div className="text-gray-800">
                        {formatDate(selectedResident.birthdate)}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Gender:
                      </span>
                      <div className="text-gray-800">
                        {selectedResident.gender}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Civil Status:
                      </span>
                      <div className="text-gray-800">
                        {selectedResident.civilStatus}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Age (Computed):
                      </span>
                      <div className="text-gray-800">
                        {calculateAge(selectedResident.birthdate)} years old
                      </div>
                    </div>
                  </div>
                </div>

                {/* Census Information Section */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">
                    Census Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Voter Status:
                      </span>
                      <div className="text-gray-800">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            selectedResident.voterStatus === "Registered"
                              ? "bg-green-100 text-green-800"
                              : selectedResident.voterStatus ===
                                "Pre-Registered"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {selectedResident.voterStatus}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Occupation:
                      </span>
                      <div className="text-gray-800">
                        {selectedResident.occupation}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Employment Status:
                      </span>
                      <div className="text-gray-800">
                        {selectedResident.employmentStatus}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Account Status:
                      </span>
                      <div className="text-gray-800">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            selectedResident.accountStatus === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {selectedResident.accountStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Household Members Section */}
                {selectedResident.householdMembers &&
                  selectedResident.householdMembers.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3 border-b pb-2">
                        <h4 className="font-semibold text-gray-800">
                          Household Members (
                          {selectedResident.householdMembers.length})
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Home className="w-4 h-4" />
                          <span>
                            {selectedResident.householdAddress}{" "}
                            {selectedResident.householdNumber}
                          </span>
                        </div>
                      </div>

                      {/* Head of Family Info */}
                      {selectedResident.headOfFamily && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-blue-800">
                              Head of Family:
                            </span>
                          </div>
                          <div className="text-sm text-blue-700">
                            {selectedResident.headOfFamily.name}
                            {selectedResident.headOfFamily.phoneNumber && (
                              <span className="ml-2">
                                • {selectedResident.headOfFamily.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {selectedResident.householdMembers.map((member) => (
                            <div
                              key={member.id}
                              className={`p-4 rounded-lg border ${
                                member.isHeadOfFamily
                                  ? "bg-blue-50 border-blue-200"
                                  : "bg-white border-gray-200"
                              }`}
                            >
                              <div className="flex gap-4">
                                {/* Member Image */}
                                <div className="flex-shrink-0">
                                  <img
                                    src={member.image}
                                    alt={member.fullName}
                                    className="w-12 h-12 rounded-lg object-cover border"
                                  />
                                </div>

                                {/* Member Details */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium text-gray-900">
                                      {member.fullName}
                                    </span>
                                    {member.isHeadOfFamily && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center gap-1">
                                        <Crown className="w-3 h-3" />
                                        Head
                                      </span>
                                    )}
                                    {!member.hasCensusData && (
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                        No Census Data
                                      </span>
                                    )}
                                  </div>

                                  {/* Basic Information */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Calendar className="w-3 h-3" />
                                      <span>{member.age} years old</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Heart className="w-3 h-3" />
                                      <span>{member.sex}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <span>Status: {member.civilStatus}</span>
                                    </div>
                                    {member.phoneNumber && (
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="w-3 h-3" />
                                        <span>{member.phoneNumber}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Occupation and Employment */}
                                  {member.hasCensusData && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-2">
                                      <div className="flex items-center gap-2 text-gray-500">
                                        <Briefcase className="w-3 h-3" />
                                        <span>{member.occupation}</span>
                                      </div>
                                      <div className="text-gray-500">
                                        Employment: {member.employmentStatus}
                                      </div>
                                    </div>
                                  )}

                                  {/* Footer */}
                                  <div className="flex justify-between items-center mt-2">
                                    <div className="text-xs text-gray-500">
                                      {member.hasCensusData ? (
                                        <span className="text-green-600">
                                          ✓ Census Complete
                                        </span>
                                      ) : (
                                        <span className="text-yellow-600">
                                          ⚠ No Census Data
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        member.voterStatus === "Registered"
                                          ? "bg-green-100 text-green-800"
                                          : member.voterStatus ===
                                            "Pre-Registered"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {member.voterStatus}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Household Summary */}
                        <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>
                              Total Members:{" "}
                              {selectedResident.householdMembers.length}
                            </span>
                            <span>
                              Census Completed:{" "}
                              {
                                selectedResident.householdMembers.filter(
                                  (m) => m.hasCensusData
                                ).length
                              }
                              /{selectedResident.householdMembers.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsResidentModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID Image Viewer Modal */}
      {isIDViewerOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">
                {isResidentModalOpen ? "Resident ID Image" : "Account ID Image"}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  title="Rotate Image"
                >
                  <RotateCw className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setScale((prev) => Math.max(prev - 0.25, 0.5))}
                  className="p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>

                <span className="text-lg font-medium min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>

                <button
                  onClick={() => setScale((prev) => Math.min(prev + 0.25, 3))}
                  className="p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setScale(1)}
                  className="p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  title="Reset Zoom"
                >
                  100%
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsIDViewerOpen(false);
                    setScale(1);
                    setRotation(0);
                  }}
                  className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-2"
                  title="Close Viewer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Image Container */}
            <div className="flex-1 overflow-auto p-8 bg-gray-900 flex items-center justify-center">
              <div
                className="transform transition-transform duration-200"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  maxWidth: "90%",
                  maxHeight: "90%",
                }}
              >
                <img
                  src={
                    isResidentModalOpen
                      ? selectedResident.image
                      : selectedAccount.idImage
                  }
                  alt="ID"
                  className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                  style={{
                    cursor: scale > 1 ? "grab" : "default",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Resident Modal */}
      <AddResidentModal
        isOpen={isAddResidentModalOpen}
        onClose={() => setIsAddResidentModalOpen(false)}
        onResidentAdded={fetchResidents}
      />

      {/* Rejection Reason Modal */}
      {isRejectModalOpen && selectedAccount && (
        <div className="fixed inset-0 bg-gray-950/80 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Reject Account</h2>
            <p className="text-gray-600 mb-4">
              Please select one or more reasons for rejecting{" "}
              {selectedAccount.fullName}'s account application.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reasons
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
                {[
                  "Invalid ID",
                  "Incomplete Information",
                  "Duplicate Account",
                  "Not a Resident",
                  "Suspicious Activity",
                  "Unclear Photo",
                  "Expired Document",
                  "Information Mismatch",
                ].map((reason) => (
                  <div key={reason} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`reason-${reason}`}
                      value={reason}
                      checked={rejectionReasons.includes(reason)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRejectionReasons([...rejectionReasons, reason]);
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
                      className="ml-2 block text-sm text-gray-700"
                    >
                      {reason}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setIsApprovalsModalOpen(true);
                  setRejectionReasons([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedAccount.id)}
                disabled={rejectionReasons.length === 0}
                className={`px-4 py-2 rounded-md text-white ${
                  rejectionReasons.length > 0
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-300 cursor-not-allowed"
                }`}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resident Modal */}
      <EditResidentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedResidentForEdit(null);
        }}
        resident={selectedResidentForEdit}
        onResidentUpdated={handleResidentUpdated}
        onResidentDeleted={handleResidentDeleted}
      />
    </div>
  );
};

export default Residents;
