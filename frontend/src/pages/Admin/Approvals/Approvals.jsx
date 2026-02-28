import React, { useState, useEffect } from "react";
import Loader from "../../../components/Loader";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { toast } from "react-toastify";
import IDImageViewer from "../../../components/IDImageViewer";

const Approvals = () => {
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showIDViewer, setShowIDViewer] = useState(false);
  const [idImageUrl, setIdImageUrl] = useState("");

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  useEffect(() => {
    setTimeout(() => {
      setPendingAccounts([
        {
          id: 1,
          fullName: "Juan Dela Cruz",
          email: "juan.delacruz@example.com",
          address: "123 Main St, Barangay 1",
          contactNumber: "09123456789",
          idImage: "https://randomuser.me/api/portraits/men/1.jpg",
          dateSubmitted: "2024-06-15",
          additionalInfo: "Requesting account for household management",
        },
        {
          id: 2,
          fullName: "Maria Santos",
          email: "maria.santos@example.com",
          address: "456 Oak St, Barangay 1",
          contactNumber: "09234567890",
          idImage: "https://randomuser.me/api/portraits/women/1.jpg",
          dateSubmitted: "2024-06-18",
          additionalInfo: "Need access to request certificates",
        },
        {
          id: 3,
          fullName: "Pedro Reyes",
          email: "pedro.reyes@example.com",
          address: "789 Pine St, Barangay 1",
          contactNumber: "09345678901",
          idImage: "https://randomuser.me/api/portraits/men/2.jpg",
          dateSubmitted: "2024-06-20",
          additionalInfo: "Business owner needing permits",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleApprove = (id) => {
    setPendingAccounts(pendingAccounts.filter((account) => account.id !== id));
    toast.success("Account approved successfully!");
  };

  const handleReject = (id) => {
    setPendingAccounts(pendingAccounts.filter((account) => account.id !== id));
    toast.success("Account rejected successfully!");
  };

  const handleViewDetails = (account) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const handleViewIDImage = (imageUrl) => {
    setIdImageUrl(imageUrl);
    setShowIDViewer(true);
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="bg-white rounded-lg shadow-md p-6 mt-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Account Approvals
          </h1>
          <div className="text-sm text-gray-500">
            {pendingAccounts.length} pending approval
          </div>
        </div>
        <div className="overflow-x-auto">
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
                  Email
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
              {pendingAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No accounts pending approval
                  </td>
                </tr>
              ) : (
                pendingAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        className="h-10 w-10 rounded-full object-cover cursor-pointer"
                        src={account.idImage}
                        alt={account.fullName}
                        onClick={() => handleViewIDImage(account.idImage)}
                        title="Click to enlarge"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {account.fullName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {account.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {account.address}
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(account)}
                          className="text-gray-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleApprove(account.id)}
                          className="text-green-600 hover:text-green-800 flex items-center gap-1 cursor-pointer"
                          title="Approve"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          onClick={() => handleReject(account.id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 cursor-pointer"
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Details Modal */}
      {isModalOpen && selectedAccount && (
        <div className="fixed inset-0 bg-gray-950/80 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Account Details</h2>
            <div className="flex flex-col items-center mb-4">
              <img
                src={selectedAccount.idImage}
                alt={selectedAccount.fullName}
                className="w-24 h-24 rounded-full object-cover mb-2 border-4 border-white shadow-sm"
              />
              <h3 className="font-bold text-lg">{selectedAccount.fullName}</h3>
              <p className="text-gray-500 text-sm">{selectedAccount.email}</p>
            </div>
            <div className="mb-2">
              <span className="text-xs text-gray-500">Address:</span>
              <div>{selectedAccount.address}</div>
            </div>
            <div className="mb-2">
              <span className="text-xs text-gray-500">Contact:</span>
              <div>{selectedAccount.contactNumber}</div>
            </div>
            <div className="mb-2">
              <span className="text-xs text-gray-500">Date Submitted:</span>
              <div>{formatDate(selectedAccount.dateSubmitted)}</div>
            </div>
            <div className="mb-2">
              <span className="text-xs text-gray-500">Additional Info:</span>
              <div>{selectedAccount.additionalInfo}</div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  handleReject(selectedAccount.id);
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  handleApprove(selectedAccount.id);
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
              >
                Approve Account
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 ml-2 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Valid ID Image Viewer Modal */}
      {showIDViewer && (
        <IDImageViewer
          imageUrl={idImageUrl}
          onClose={() => setShowIDViewer(false)}
        />
      )}
    </div>
  );
};

export default Approvals;
