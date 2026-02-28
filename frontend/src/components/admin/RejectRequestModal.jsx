import React, { useState, useEffect } from 'react';
import { XCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';

const RejectRequestModal = ({ request, onClose, onReject }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const predefinedReasons = [
    'Incomplete documentation',
    'Invalid information provided',
    'Does not meet eligibility requirements',
    'Duplicate request',
    'Missing required signatures',
    'Insufficient supporting documents',
    'Request outside of jurisdiction',
    'Other (please specify)'
  ];

  const handleReasonChange = (reason) => {
    setSelectedReason(reason);
    if (reason !== 'Other (please specify)') {
      setRejectionReason(reason);
    } else {
      setRejectionReason('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const rejectionData = {
        status: 'Rejected',
        rejectedDate: new Date().toISOString(),
        rejectionReason: rejectionReason.trim(),
        rejectedBy: 'Admin' // In real app, get from auth context
      };
      
      onReject(request.id, rejectionData);
      toast.success(`Request #${request.id.toString().padStart(4, '0')} has been rejected.`);
      onClose();
    } catch (error) {
      toast.error('Failed to reject request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-medium text-gray-900">Reject Request</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Request Details:</p>
          <p className="font-medium">{request.name}</p>
          <p className="text-sm text-gray-500">{request.requestType}</p>
          <p className="text-xs text-gray-400">ID: #{request.id.toString().padStart(4, '0')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rejection *
            </label>
            
            <div className="space-y-2 mb-3">
              {predefinedReasons.map((reason) => (
                <label key={reason} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => handleReasonChange(e.target.value)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>

            {selectedReason === 'Other (please specify)' && (
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                placeholder="Please specify the reason for rejection..."
                required
              />
            )}
          </div>

          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">
                <strong>Note:</strong> The applicant will be notified of this rejection and the reason provided. 
                Please ensure the reason is clear and professional.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !rejectionReason.trim()}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Reject Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectRequestModal;