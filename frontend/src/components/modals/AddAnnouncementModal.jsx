import React, { useState } from "react";
import { X } from "lucide-react";
import axiosInstance from "../../components/auth/axiosInstance";
import { toast } from "react-toastify";

const AddAnnouncementModal = ({ isOpen, onClose, onAnnouncementAdded }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isUrgent: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/announcement/create", {
        title: formData.title,
        description: formData.description,
        isUrgent: formData.isUrgent,
      });

      toast.success("Announcement added successfully!");
      onClose();
      setFormData({
        title: "",
        description: "",
        isUrgent: false,
      });
      if (onAnnouncementAdded) onAnnouncementAdded();
    } catch (error) {
      console.error("Error adding announcement:", error);
      toast.error(
        error.response?.data?.message || "Failed to add announcement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/80 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-black cursor-pointer"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4">Add Announcement</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Announcement Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md caret-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md caret-black"
              rows="5"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="urgent"
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded caret-black"
              checked={formData.isUrgent}
              onChange={(e) =>
                setFormData({ ...formData, isUrgent: e.target.checked })
              }
            />
            <label
              htmlFor="urgent"
              className="ml-2 block text-sm text-gray-700 cursor-pointer"
            >
              Mark as urgent
            </label>
          </div>
          <button
            type="submit"
            className="mt-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 cursor-pointer"
            disabled={submitting}
          >
            {submitting ? "Adding..." : "Add Announcement"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAnnouncementModal;
