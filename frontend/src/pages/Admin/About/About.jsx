import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaBullseye,
  FaLandmark,
  FaUserTie,
  FaHandsHelping,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import chairmanImg from "/src/assets/chairman.jpg";
import brgyHallImg from "/src/assets/646.jpg";
import axiosInstance from "../../../components/auth/axiosInstance";
import Loader from "../../../components/Loader";
import { toast } from "react-toastify";

const About = () => {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await axiosInstance.get("/about");
        setAboutData(response.data.data);
      } catch (error) {
        console.error("Error fetching about data:", error);
        // Fallback data
        setAboutData({
          heroTitle: "About Our Barangay",
          heroDescription: "Learn about our community, leadership, and the principles that guide our service to residents",
          historyTitle: "Barangay History",
          historyContent: [
            "Barangay 646 Zone 67 is one of the 12 barangays situated in San Miguel of District VI, Manila, a neighborhood of Malacañang Palace.",
            "The name San Miguel was added by the Augustinian missionaries who selected Michael the Archangel as the patron saint of the area.",
            "Barangay 646 is one of the 896 barangays of the City of Manila within the administrative district of San Miguel, Zone 67, District VI.",
          ],
          vision: "To promote efficiency and transparency in government with regards to the manner of transacting with the public Citizens.",
          mission: "To ensure quality public service by local government to citizens.",
          officials: [
            { name: "Roel S. Floro", position: "Barangay Captain", imageUrl: "/src/assets/chairman.jpg" },
            { name: "Raquel F. Villanueva", position: "Barangay Secretary", imageUrl: "/src/assets/Raquel.png" },
            { name: "Ma. Elena A. Xavier", position: "Barangay Treasurer", imageUrl: "/src/assets/Ma.Elena.png" },
          ],
          kagawads: [
            { name: "Charito T. Flores", committee: "Health & Sanitation Committee", position: "Kagawad – 1", imageUrl: "/src/assets/Charito.png" },
            { name: "Raymundo M. Floro", committee: "Health & Sanitation Committee", position: "Kagawad – 2", imageUrl: "/src/assets/Raymundo.png" },
            { name: "Olimpio F. Vidallo Jr.", committee: "Education Committee", position: "Kagawad – 3", imageUrl: "/src/assets/Olimpio.png" },
            { name: "Kastine F. Villanueva", committee: "Social Services Committee", position: "Kagawad – 4", imageUrl: "/src/assets/Kastine.png" },
            { name: "Jessel P. Jarilla", committee: "Infrastructure Committee", position: "Kagawad – 5", imageUrl: "/src/assets/Jessel.png" },
            { name: "Conchita P. Barretto", committee: "Women & Family Welfare Committee", position: "Kagawad – 6", imageUrl: "/src/assets/Chonchita.png" },
            { name: "Tomas S. Tecson", committee: "Youth & Sports Development Committee", position: "Kagawad – 7", imageUrl: "/src/assets/Tomas.png" },
          ],
          coreValues: [
            { title: "Integrity", description: "We uphold honesty, accountability, and transparency in all our actions and decisions to maintain public trust.", icon: "shield" },
            { title: "Service", description: "We prioritize the welfare of our constituents through quality, efficient, and effective service delivery to improve quality of life.", icon: "users" },
            { title: "Progress", description: "We commit to continuous improvement, sustainable development, and creating a self-reliant community with empowered citizens.", icon: "trending-up" },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Create a clean data object without image URLs to prevent payload size issues
      const cleanData = {
        heroTitle: aboutData.heroTitle,
        heroDescription: aboutData.heroDescription,
        historyTitle: aboutData.historyTitle,
        historyContent: aboutData.historyContent,
        vision: aboutData.vision,
        mission: aboutData.mission,
        officials: aboutData.officials.map(official => ({
          name: official.name,
          position: official.position,
        })),
        kagawads: aboutData.kagawads.map(kagawad => ({
          name: kagawad.name,
          position: kagawad.position,
          committee: kagawad.committee,
        })),
        coreValues: aboutData.coreValues,
      };
      
      await axiosInstance.put("/about", cleanData);
      toast.success("About page updated successfully!");
      setEditing(false);
    } catch (error) {
      console.error("Error updating about page:", error);
      toast.error(error.response?.data?.message || "Failed to update about page");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file, type, index = null) => {
    if (!file) return;

    try {
      // Create temporary preview URL
      const tempImageUrl = URL.createObjectURL(file);
      
      // Update state immediately for preview
      if (type === 'hero') {
        setAboutData(prev => ({ ...prev, heroImageUrl: tempImageUrl }));
      } else if (type === 'officials' || type === 'kagawads') {
        const updatedArray = [...aboutData[type]];
        updatedArray[index] = { ...updatedArray[index], imageUrl: tempImageUrl };
        setAboutData(prev => ({ ...prev, [type]: updatedArray }));
      }

      // Create FormData for upload
      const formData = new FormData();
      formData.append('image', file);
      
      if (type === 'hero') {
        // Use the same pattern as officials - go to the main endpoint with hero flag
        formData.append('heroImage', 'true');
        
        const response = await axiosInstance.put('/about', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Update only the hero image URL, not the entire state
        setAboutData(prev => ({ ...prev, heroImageUrl: response.data.data.heroImageUrl }));
      } else if (type === 'officials' || type === 'kagawads') {
        // Use the dedicated official image endpoints
        const response = await axiosInstance.put(`/about/officials/${type}/${index}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Update only the specific official/kagawad, not the entire state
        const updatedArray = [...aboutData[type]];
        updatedArray[index] = { ...updatedArray[index], imageUrl: response.data.data.imageUrl };
        setAboutData(prev => ({ ...prev, [type]: updatedArray }));
      }

      // Clean up temporary URL
      URL.revokeObjectURL(tempImageUrl);

      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');

      // Revert to original data on error by refetching
      try {
        const response = await axiosInstance.get("/about");
        setAboutData(response.data.data);
      } catch (fetchError) {
        console.error('Error refetching data:', fetchError);
      }
    }
  };

  const addOfficial = () => {
    setAboutData(prev => ({
      ...prev,
      officials: [...(prev.officials || []), { name: "", position: "", imageUrl: "" }]
    }));
  };

  const addKagawad = () => {
    setAboutData(prev => ({
      ...prev,
      kagawads: [...(prev.kagawads || []), { name: "", position: "", committee: "", imageUrl: "" }]
    }));
  };

  const removeOfficial = (index) => {
    if (window.confirm("Are you sure you want to remove this official?")) {
      setAboutData(prev => ({
        ...prev,
        officials: (prev.officials || []).filter((_, i) => i !== index)
      }));
    }
  };

  const removeKagawad = (index) => {
    if (window.confirm("Are you sure you want to remove this kagawad?")) {
      setAboutData(prev => ({
        ...prev,
        kagawads: (prev.kagawads || []).filter((_, i) => i !== index)
      }));
    }
  };

  const updateOfficial = (index, field, value) => {
    const updated = [...(aboutData.officials || [])];
    updated[index] = { ...updated[index], [field]: value };
    setAboutData(prev => ({ ...prev, officials: updated }));
  };

  const updateKagawad = (index, field, value) => {
    const updated = [...(aboutData.kagawads || [])];
    updated[index] = { ...updated[index], [field]: value };
    setAboutData(prev => ({ ...prev, kagawads: updated }));
  };

  const addHistoryParagraph = () => {
    setAboutData(prev => ({
      ...prev,
      historyContent: [...(prev.historyContent || []), ""]
    }));
  };

  const removeHistoryParagraph = (index) => {
    if ((aboutData.historyContent || []).length > 1) {
      setAboutData(prev => ({
        ...prev,
        historyContent: (prev.historyContent || []).filter((_, i) => i !== index)
      }));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  if (!aboutData) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Unable to load about page content.</p></div>;

  const getIconSvg = (iconName) => {
    switch (iconName) {
      case "shield":
        return <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>;
      case "users":
        return <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
      case "trending-up":
        return <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>;
      default:
        return <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-7xl mx-auto gap-6">
      {/* Edit/Save Buttons */}
      <div className="flex justify-end mb-4 gap-2">
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
          >
            <FaEdit className="text-lg" />
            Edit About Page
          </button>
        ) : (
          <>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaTimes className="text-lg" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <FaSave className="text-lg" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          {editing ? (
            <>
              <input
                type="text"
                value={aboutData?.heroTitle || ''}
                onChange={(e) => setAboutData(prev => ({ ...prev, heroTitle: e.target.value }))}
                className="text-4xl font-bold text-black mb-4 text-center w-full max-w-3xl mx-auto border-b-2 border-blue-500 focus:outline-none focus:border-blue-700"
              />
              <textarea
                value={aboutData?.heroDescription || ''}
                onChange={(e) => setAboutData(prev => ({ ...prev, heroDescription: e.target.value }))}
                className="text-xl text-gray-600 max-w-3xl mx-auto w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 resize-none"
                rows="3"
              />
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-black mb-4">{aboutData.heroTitle}</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">{aboutData.heroDescription}</p>
            </>
          )}
        </div>

        {/* History Section */}
        <div className="rounded-xl p-8 mb-16">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
                <FaLandmark className="mr-2 text-gray-800" />
                {editing ? (
                  <input
                    type="text"
                    value={aboutData.historyTitle}
                    onChange={(e) => setAboutData(prev => ({ ...prev, historyTitle: e.target.value }))}
                    className="text-black border-b-2 border-blue-500 focus:outline-none focus:border-blue-700"
                  />
                ) : (
                  <span className="text-black">{aboutData.historyTitle}</span>
                )}
              </h2>
              {editing ? (
                <div className="space-y-2">
                  {(aboutData.historyContent || []).map((paragraph, index) => (
                    <div key={index} className="flex gap-2">
                      <textarea
                        value={paragraph || ""}
                        onChange={(e) => {
                          const updated = [...(aboutData.historyContent || [])];
                          updated[index] = e.target.value;
                          setAboutData((prev) => ({ ...prev, historyContent: updated }));
                        }}
                        className="flex-1 text-gray-700 border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 resize-none"
                        rows="3"
                      />
                      {(aboutData.historyContent || []).length > 1 && (
                        <button
                          onClick={() => removeHistoryParagraph(index)}
                          className="text-red-600 hover:text-red-800 self-start"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addHistoryParagraph}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                  >
                    <FaPlus /> Add Paragraph
                  </button>
                </div>
              ) : (
                (aboutData.historyContent || []).map((paragraph, index) => (
                  <p key={index} className="text-gray-700 mb-4">{paragraph}</p>
                ))
              )}
            </div>
            <div className="md:w-1/2 relative group">
              <img 
                src={aboutData.heroImageUrl || brgyHallImg} 
                alt="Barangay Hall" 
                className="w-full h-auto rounded-lg" 
              />
              {editing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleImageUpload(file, 'hero');
                      }}
                      className="hidden"
                    />
                    <div className="bg-white text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors">
                      <FaUpload />
                      Change Hero Image
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-500 rounded-xl p-8">
            <div className="flex items-center mb-4">
              <FaBullseye className="text-3xl mr-3 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-100">Our Vision</h2>
            </div>
            {editing ? (
              <textarea
                value={aboutData?.vision || ''}
                onChange={(e) => setAboutData(prev => ({ ...prev, vision: e.target.value }))}
                className="w-full text-gray-300 bg-gray-600 border border-gray-400 rounded-lg p-2 focus:outline-none focus:border-blue-500 resize-none"
                rows="4"
              />
            ) : (
              <p className="text-gray-300">{aboutData.vision}</p>
            )}
          </div>
          <div className="bg-gray-700 rounded-xl p-8">
            <div className="flex items-center mb-4">
              <FaHandsHelping className="text-3xl mr-3 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-100">Our Mission</h2>
            </div>
            {editing ? (
              <textarea
                value={aboutData?.mission || ''}
                onChange={(e) => setAboutData(prev => ({ ...prev, mission: e.target.value }))}
                className="w-full text-gray-300 bg-gray-600 border border-gray-400 rounded-lg p-2 focus:outline-none focus:border-blue-500 resize-none"
                rows="4"
              />
            ) : (
              <p className="text-gray-300">{aboutData.mission}</p>
            )}
          </div>
        </div>

        {/* Officials */}
        <div className="rounded-xl p-8 mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-black flex items-center">
              <FaUserTie className="mr-2 text-black" />
              Barangay Officials
            </h2>
            {editing && (
              <button
                onClick={addOfficial}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FaPlus /> Add Official
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(aboutData.officials || []).map((official, index) => (
              <div key={index} className="text-center relative">
                {editing && (
                  <button
                    onClick={() => removeOfficial(index)}
                    className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 z-10"
                  >
                    <FaTrash size={12} />
                  </button>
                )}
                <div className="relative mb-4">
                  <img
                    src={official.imageUrl || chairmanImg}
                    alt={official.name}
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-700"
                    onError={(e) => { e.target.src = chairmanImg; }}
                  />
                  {editing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                      <FaUpload size={12} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files[0], 'officials', index)}
                      />
                    </label>
                  )}
                </div>
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={official?.name || ''}
                      onChange={(e) => updateOfficial(index, 'name', e.target.value)}
                      className="font-bold text-lg text-black w-full text-center border-b border-gray-300 focus:outline-none focus:border-blue-500 mb-1"
                    />
                    <input
                      type="text"
                      value={official?.position || ''}
                      onChange={(e) => updateOfficial(index, 'position', e.target.value)}
                      className="text-gray-700 w-full text-center border-b border-gray-300 focus:outline-none focus:border-blue-500"
                    />
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-lg text-black">{official.name}</h3>
                    <p className="text-gray-700">{official.position}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Kagawads */}
        <div className="rounded-xl p-8 mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-black flex items-center">
              <FaUsers className="mr-2 text-black" />
              Barangay Kagawads
            </h2>
            {editing && (
              <button
                onClick={addKagawad}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FaPlus /> Add Kagawad
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(aboutData.kagawads || []).map((kagawad, index) => (
              <div key={index} className="text-center relative">
                {editing && (
                  <button
                    onClick={() => removeKagawad(index)}
                    className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 z-10"
                  >
                    <FaTrash size={12} />
                  </button>
                )}
                <div className="relative mb-4">
                  <img
                    src={kagawad.imageUrl || chairmanImg}
                    alt={kagawad.name}
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-700"
                    onError={(e) => { e.target.src = chairmanImg; }}
                  />
                  {editing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                      <FaUpload size={12} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files[0], 'kagawads', index)}
                      />
                    </label>
                  )}
                </div>
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={kagawad?.name || ''}
                      onChange={(e) => updateKagawad(index, 'name', e.target.value)}
                      className="text-black text-lg font-bold w-full text-center border-b border-gray-300 focus:outline-none focus:border-blue-500 mb-1"
                    />
                    <input
                      type="text"
                      value={kagawad?.position || ''}
                      onChange={(e) => updateKagawad(index, 'position', e.target.value)}
                      className="text-gray-600 text-sm w-full text-center border-b border-gray-300 focus:outline-none focus:border-blue-500 mb-1"
                    />
                    <input
                      type="text"
                      value={kagawad?.committee || ''}
                      onChange={(e) => updateKagawad(index, 'committee', e.target.value)}
                      className="text-gray-500 text-xs w-full text-center border-b border-gray-300 focus:outline-none focus:border-blue-500"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-black text-lg font-bold">{kagawad.name}</p>
                    <p className="text-gray-600 text-sm">{kagawad.position}</p>
                    <p className="text-gray-500 text-xs">{kagawad.committee}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Core Values */}
        <div className="mt-16 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-black mb-6 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(aboutData.coreValues || []).map((value, index) => (
              <div key={index} className="border bg-white border-gray-300 shadow-sm p-6 rounded-lg text-center">
                <div className="bg-gray-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {getIconSvg(value.icon)}
                </div>
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={value.title}
                      onChange={(e) => {
                        const updated = [...(aboutData.coreValues || [])];
                        updated[index] = { ...updated[index], title: e.target.value };
                        setAboutData(prev => ({ ...prev, coreValues: updated }));
                      }}
                      className="font-bold text-lg text-black w-full text-center border-b border-gray-300 focus:outline-none focus:border-blue-500 mb-2"
                    />
                    <textarea
                      value={value.description}
                      onChange={(e) => {
                        const updated = [...(aboutData.coreValues || [])];
                        updated[index] = { ...updated[index], description: e.target.value };
                        setAboutData(prev => ({ ...prev, coreValues: updated }));
                      }}
                      className="text-gray-700 w-full text-center border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 resize-none"
                      rows="3"
                    />
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-lg text-black mb-2">{value.title}</h3>
                    <p className="text-gray-700">{value.description}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;