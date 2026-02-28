import React, { useState } from "react";
import { X } from "lucide-react";
import axiosInstance from "../../components/auth/axiosInstance";
import { toast } from "react-toastify";

const AddEventModal = ({ isOpen, onClose, onEventAdded }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    color: "#a5d8ff",
    image: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("date", formData.date);
      formDataToSend.append("time", formData.time);
      formDataToSend.append("color", formData.color);

      if (formData.image) {
        formDataToSend.append("event-image", formData.image);
      }

      const response = await axiosInstance.post(
        "/event/create",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Event added successfully!");
      onClose();
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        color: "#a5d8ff",
        image: null,
      });
      if (onEventAdded) onEventAdded();
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error(error.response?.data?.message || "Failed to add event");
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
        <h2 className="text-xl font-bold mb-4">Add Event</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title
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
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md caret-black"
                rows="3"
                required
              />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md caret-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md caret-black"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Image
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer">
                <div className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 cursor-pointer">
                  Choose Image
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.files[0] })
                  }
                  className="hidden caret-black"
                />
              </label>
              {formData.image && (
                <div className="relative">
                  <span className="text-sm text-gray-500">
                    {formData.image.name}
                  </span>
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 cursor-pointer"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        image: null,
                      })
                    }
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex gap-2">
              {["#a5d8ff", "#c3f584", "#ffd6e0", "#fff3bf", "#f1c0e8"].map(
                (color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                      formData.color === color
                        ? "border-black"
                        : "border-gray-200"
                    }`}
                    style={{ background: color }}
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  />
                )
              )}
            </div>
          </div>
          <button
            type="submit"
            className="mt-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 cursor-pointer"
            disabled={submitting}
          >
            {submitting ? "Adding..." : "Add Event"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;
