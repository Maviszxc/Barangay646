import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, Upload, Edit, Check, Image as ImageIcon } from "lucide-react";
import axiosInstance from "../../components/auth/axiosInstance";
import { toast } from "react-toastify";

const EditAboutPageModal = ({ isOpen, onClose, onAboutUpdated }) => {
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const [aboutData, setAboutData] = useState({
    heroTitle: "",
    heroDescription: "",
    historyTitle: "",
    historyContent: [],
    vision: "",
    mission: "",
    officials: [],
    kagawads: [],
    coreValues: [],
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingIndex, setEditingIndex] = useState({ type: null, index: null });

  // Form states
  const [newOfficial, setNewOfficial] = useState({ name: "", position: "", imageUrl: "" });
  const [newKagawad, setNewKagawad] = useState({ name: "", committee: "", position: "", imageUrl: "" });
  const [newCoreValue, setNewCoreValue] = useState({ title: "", description: "", icon: "shield" });

  const iconOptions = [
    { value: "shield", label: "Shield", icon: "🛡️" },
    { value: "users", label: "Users", icon: "👥" },
    { value: "trending-up", label: "Trending Up", icon: "📈" },
    { value: "star", label: "Star", icon: "⭐" },
    { value: "heart", label: "Heart", icon: "❤️" },
    { value: "lightbulb", label: "Lightbulb", icon: "💡" },
    { value: "target", label: "Target", icon: "🎯" },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchAboutData();
    }
  }, [isOpen]);

  const fetchAboutData = async () => {
    try {
      const response = await axiosInstance.get("/about");
      setAboutData(response.data.data);
    } catch (error) {
      console.error("Error fetching about data:", error);
      toast.error("Failed to load about page data");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosInstance.put("/about", aboutData);
      toast.success("About page updated successfully!");
      onClose();
      if (onAboutUpdated) onAboutUpdated();
    } catch (error) {
      console.error("Error updating about page:", error);
      toast.error(error.response?.data?.message || "Failed to update about page");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (file, type, index = null, data) => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }
    
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    
    // Add all data fields
    Object.keys(data).forEach(key => {
      if (data[key]) formData.append(key, data[key]);
    });
    
    try {
      let response;
      
      if (index === null) {
        // Adding new
        response = await axiosInstance.post(`/about/officials/${type}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Updating existing
        response = await axiosInstance.put(`/about/officials/${type}/${index}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      
      await fetchAboutData();
      toast.success(index === null ? "Added successfully!" : "Updated successfully!");
      return response.data.data;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const addOfficial = async () => {
    if (!newOfficial.name || !newOfficial.position) {
      toast.error("Please fill in name and position");
      return;
    }

    const fileInput = document.getElementById('new-official-image');
    const file = fileInput?.files?.[0];
    
    if (!file) {
      toast.error("Please select an image for the official");
      return;
    }
    
    try {
      await handleImageUpload(file, 'officials', null, newOfficial);
      setNewOfficial({ name: "", position: "", imageUrl: "" });
      fileInput.value = "";
      setEditingIndex({ type: null, index: null });
    } catch (error) {
      console.error("Error adding official:", error);
    }
  };

  const addKagawad = async () => {
    if (!newKagawad.name || !newKagawad.position) {
      toast.error("Please fill in name and position");
      return;
    }

    const fileInput = document.getElementById('new-kagawad-image');
    const file = fileInput?.files?.[0];
    
    if (!file) {
      toast.error("Please select an image for the kagawad");
      return;
    }
    
    try {
      await handleImageUpload(file, 'kagawads', null, newKagawad);
      setNewKagawad({ name: "", committee: "", position: "", imageUrl: "" });
      fileInput.value = "";
      setEditingIndex({ type: null, index: null });
    } catch (error) {
      console.error("Error adding kagawad:", error);
    }
  };

  const updateItem = async (type, index) => {
    const item = aboutData[type][index];
    const fileInput = document.getElementById(`${type}-edit-image-${index}`);
    const file = fileInput?.files?.[0];
    
    try {
      if (file) {
        await handleImageUpload(file, type, index, item);
      } else {
        await axiosInstance.put(`/about/officials/${type}/${index}`, item);
        await fetchAboutData();
        toast.success("Updated successfully!");
      }
      setEditingIndex({ type: null, index: null });
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const deleteItem = async (type, index) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/about/officials/${type}/${index}`);
      await fetchAboutData();
      toast.success("Deleted successfully!");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const addCoreValue = () => {
    if (newCoreValue.title && newCoreValue.description) {
      setAboutData(prev => ({
        ...prev,
        coreValues: [...prev.coreValues, newCoreValue]
      }));
      setNewCoreValue({ title: "", description: "", icon: "shield" });
    }
  };

  const updateCoreValue = (index, field, value) => {
    const updated = [...aboutData.coreValues];
    updated[index] = { ...updated[index], [field]: value };
    setAboutData(prev => ({ ...prev, coreValues: updated }));
  };

  const removeCoreValue = (index) => {
    if (window.confirm("Are you sure you want to remove this core value?")) {
      setAboutData(prev => ({
        ...prev,
        coreValues: prev.coreValues.filter((_, i) => i !== index)
      }));
    }
  };

  const addHistoryParagraph = () => {
    setAboutData(prev => ({
      ...prev,
      historyContent: [...prev.historyContent, ""]
    }));
  };

  const updateHistoryContent = (index, value) => {
    setAboutData(prev => ({
      ...prev,
      historyContent: prev.historyContent.map((item, i) => i === index ? value : item)
    }));
  };

  const removeHistoryParagraph = (index) => {
    if (window.confirm("Are you sure you want to remove this paragraph?")) {
      setAboutData(prev => ({
        ...prev,
        historyContent: prev.historyContent.filter((_, i) => i !== index)
      }));
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "hero", label: "Hero", icon: "🏠" },
    { id: "history", label: "History", icon: "📚" },
    { id: "vision", label: "Vision & Mission", icon: "🎯" },
    { id: "officials", label: "Officials", icon: "👔" },
    { id: "kagawads", label: "Kagawads", icon: "👥" },
    { id: "values", label: "Core Values", icon: "💎" },
  ];

  const renderProfileSection = (type, items, label, color) => (
    <div className="space-y-4">
      {/* Add New Form */}
      <div className={`bg-gradient-to-r ${color}-50 rounded-xl p-4 border ${color}-100`}>
        <h4 className="font-semibold text-gray-800 mb-3">Add New {label}</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {type === 'officials' ? (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={newOfficial.name}
                onChange={(e) => setNewOfficial(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Position"
                value={newOfficial.position}
                onChange={(e) => setNewOfficial(prev => ({ ...prev, position: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={newKagawad.name}
                onChange={(e) => setNewKagawad(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Position"
                value={newKagawad.position}
                onChange={(e) => setNewKagawad(prev => ({ ...prev, position: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Committee"
                value={newKagawad.committee}
                onChange={(e) => setNewKagawad(prev => ({ ...prev, committee: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </>
          )}
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept="image/*"
              id={`new-${type.slice(0, -1)}-image`}
              className="hidden"
            />
            <label
              htmlFor={`new-${type.slice(0, -1)}-image`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center justify-center"
            >
              <Upload size={16} className="mr-2" />
              Choose Image
            </label>
          </div>
        </div>
        <button
          onClick={type === 'officials' ? addOfficial : addKagawad}
          disabled={uploadingImage}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {uploadingImage ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Adding...
            </>
          ) : (
            <>
              <Plus size={16} className="mr-2" />
              Add {label}
            </>
          )}
        </button>
      </div>

      {/* List of Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start space-x-4">
              {/* Profile Image on LEFT */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    id={`${type}-edit-image-${index}`}
                    className="hidden"
                  />
                  <label
                    htmlFor={`${type}-edit-image-${index}`}
                    className="absolute -bottom-2 -right-2 bg-white border border-gray-300 rounded-full p-1.5 cursor-pointer hover:bg-gray-50 shadow-sm"
                    title="Change image"
                  >
                    <Upload size={12} />
                  </label>
                </div>
              </div>

              {/* Details on RIGHT */}
              <div className="flex-1">
                {editingIndex.type === type && editingIndex.index === index ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index] = { ...item, name: e.target.value };
                        setAboutData(prev => ({ ...prev, [type]: updated }));
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={item.position}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index] = { ...item, position: e.target.value };
                        setAboutData(prev => ({ ...prev, [type]: updated }));
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {type === 'kagawads' && (
                      <input
                        type="text"
                        value={item.committee}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[index] = { ...item, committee: e.target.value };
                          setAboutData(prev => ({ ...prev, [type]: updated }));
                        }}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.position}</p>
                    {type === 'kagawads' && (
                      <p className="text-sm text-blue-600 mt-1">{item.committee}</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 mt-3">
                  {editingIndex.type === type && editingIndex.index === index ? (
                    <>
                      <button
                        onClick={() => updateItem(type, index)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center text-sm"
                      >
                        <Check size={14} className="mr-1" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingIndex({ type: null, index: null })}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingIndex({ type, index })}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center text-sm"
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(type, index)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center text-sm"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">
                {type === 'officials' ? '👔' : '👥'}
              </span>
            </div>
            <p>No {label.toLowerCase()} added yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first {label.toLowerCase()} using the form above</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">About Page Editor</h2>
              <p className="text-blue-100">Manage your barangay's about page content</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-blue-700 shadow-lg"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Hero Section */}
            {activeTab === "hero" && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Hero Section</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hero Title</label>
                    <input
                      type="text"
                      value={aboutData.heroTitle}
                      onChange={(e) => setAboutData(prev => ({ ...prev, heroTitle: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter hero title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hero Description</label>
                    <textarea
                      value={aboutData.heroDescription}
                      onChange={(e) => setAboutData(prev => ({ ...prev, heroDescription: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows="4"
                      placeholder="Enter hero description"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* History Section */}
            {activeTab === "history" && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">History Section</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={aboutData.historyTitle}
                      onChange={(e) => setAboutData(prev => ({ ...prev, historyTitle: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter history title"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Content Paragraphs</label>
                      <button
                        type="button"
                        onClick={addHistoryParagraph}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Paragraph
                      </button>
                    </div>
                    <div className="space-y-3">
                      {aboutData.historyContent.map((paragraph, index) => (
                        <div key={index} className="group">
                          <textarea
                            value={paragraph}
                            onChange={(e) => updateHistoryContent(index, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows="3"
                            placeholder={`Paragraph ${index + 1}`}
                          />
                          {aboutData.historyContent.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeHistoryParagraph(index)}
                              className="mt-1 text-red-600 hover:text-red-800 text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
                            >
                              <Trash2 size={14} className="mr-1" />
                              Remove Paragraph
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vision & Mission */}
            {activeTab === "vision" && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Vision & Mission</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vision</label>
                    <textarea
                      value={aboutData.vision}
                      onChange={(e) => setAboutData(prev => ({ ...prev, vision: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows="6"
                      placeholder="Enter your barangay's vision"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mission</label>
                    <textarea
                      value={aboutData.mission}
                      onChange={(e) => setAboutData(prev => ({ ...prev, mission: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows="6"
                      placeholder="Enter your barangay's mission"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Officials */}
            {activeTab === "officials" && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Barangay Officials</h3>
                {renderProfileSection('officials', aboutData.officials, 'Official', 'blue')}
              </div>
            )}

            {/* Kagawads */}
            {activeTab === "kagawads" && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Barangay Kagawads</h3>
                {renderProfileSection('kagawads', aboutData.kagawads, 'Kagawad', 'purple')}
              </div>
            )}

            {/* Core Values */}
            {activeTab === "values" && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Core Values</h3>
                
                {/* Add New Form */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Add New Core Value</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Value Title"
                        value={newCoreValue.title}
                        onChange={(e) => setNewCoreValue(prev => ({ ...prev, title: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <select
                        value={newCoreValue.icon}
                        onChange={(e) => setNewCoreValue(prev => ({ ...prev, icon: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      >
                        {iconOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addCoreValue}
                        className="bg-amber-600 text-white px-3 py-2 rounded-lg hover:bg-amber-700 flex items-center justify-center"
                      >
                        <Plus size={16} className="mr-2" />
                        Add Value
                      </button>
                    </div>
                    <textarea
                      placeholder="Description"
                      value={newCoreValue.description}
                      onChange={(e) => setNewCoreValue(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                      rows="3"
                    />
                  </div>
                </div>

                {/* List of Core Values */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aboutData.coreValues.map((value, index) => (
                    <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white text-xl shadow-sm">
                            {iconOptions.find(opt => opt.value === value.icon)?.icon || '🛡️'}
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={value.title}
                              onChange={(e) => updateCoreValue(index, 'title', e.target.value)}
                              className="w-full font-semibold text-gray-800 px-3 py-1.5 border border-transparent hover:border-gray-300 focus:border-amber-500 focus:outline-none rounded bg-white/50"
                              placeholder="Value title"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeCoreValue(index)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          title="Remove core value"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <textarea
                        value={value.description}
                        onChange={(e) => updateCoreValue(index, 'description', e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-transparent hover:border-gray-300 focus:border-amber-500 focus:outline-none rounded bg-white/50 resize-none"
                        rows="3"
                        placeholder="Value description"
                      />
                      <div className="mt-2">
                        <select
                          value={value.icon}
                          onChange={(e) => updateCoreValue(index, 'icon', e.target.value)}
                          className="w-full text-xs px-3 py-1.5 border border-transparent hover:border-gray-300 focus:border-amber-500 focus:outline-none rounded bg-white"
                        >
                          {iconOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {aboutData.coreValues.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">💎</span>
                      </div>
                      <p>No core values added yet</p>
                      <p className="text-sm text-gray-400 mt-1">Add your first core value using the form above</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save All Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditAboutPageModal;