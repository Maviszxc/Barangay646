/** @format */

const AboutPage = require("../models/aboutPage_model");
const { logAdminActivity } = require("./admin_controller");
const { supabase } = require("../database/supabaseConfig");

// Get about page content
const getAboutContent = async (req, res) => {
  try {
    const content = await AboutPage.getAboutContent();
    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error("Error fetching about content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch about page content",
    });
  }
};

// Update about page content
const updateAboutContent = async (req, res) => {
  try {
    const updates = req.body;
    
    // Add metadata
    updates.lastUpdated = new Date();
    updates.updatedBy = req.user?.userId;

    let content = await AboutPage.getAboutContent();
    
    // Update the content
    Object.keys(updates).forEach(key => {
      if (key !== 'updatedBy') { // Don't overwrite the reference directly
        content[key] = updates[key];
      }
    });
    
    await content.save();

    // Log admin activity
    await logAdminActivity(req.user.userId, "Updated About Page content");

    res.status(200).json({
      success: true,
      message: "About page content updated successfully",
      data: content,
    });
  } catch (error) {
    console.error("Error updating about content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update about page content",
    });
  }
};

// Update specific section
const updateAboutSection = async (req, res) => {
  try {
    const { section } = req.params;
    const updates = req.body;
    
    updates.lastUpdated = new Date();
    updates.updatedBy = req.user?.userId;

    let content = await AboutPage.getAboutContent();
    
    // Update specific section
    if (content[section] !== undefined) {
      if (Array.isArray(content[section]) && Array.isArray(updates)) {
        content[section] = updates;
      } else if (typeof content[section] === 'object' && typeof updates === 'object') {
        content[section] = { ...content[section], ...updates };
      } else {
        content[section] = updates;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Section '${section}' not found`,
      });
    }
    
    await content.save();

    // Log admin activity
    await logAdminActivity(req.user.userId, `Updated About Page section: ${section}`);

    res.status(200).json({
      success: true,
      message: `Section '${section}' updated successfully`,
      data: content,
    });
  } catch (error) {
    console.error("Error updating about section:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update about page section",
    });
  }
};

// Add official
const addOfficial = async (req, res) => {
  try {
    console.log('addOfficial called with:', { 
      type: req.params.type, 
      body: req.body, 
      file: req.file?.originalname 
    });
    
    const { type } = req.params; // 'officials' or 'kagawads'
    const officialData = req.body;
    
    // Handle image upload to Supabase
    if (req.file) {
      console.log('Processing image upload for type:', type);
      const fileExt = require('path').extname(req.file.originalname);
      const fileName = `${type}-${Date.now()}${fileExt}`;
      const filePath = `about-images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("bms646-app")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return res.status(500).json({
          message: "Image upload failed",
          error: uploadError.message,
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from("bms646-app")
        .getPublicUrl(filePath);

      officialData.imageUrl = publicUrlData.publicUrl;
      console.log('Image uploaded successfully, URL:', publicUrlData.publicUrl);
    }
    
    let content = await AboutPage.getAboutContent();
    
    if (!content[type]) {
      return res.status(400).json({
        success: false,
        message: `Section '${type}' not found`,
      });
    }

    content[type].push(officialData);
    content.lastUpdated = new Date();
    content.updatedBy = req.user?.userId;
    
    await content.save();

    // Log admin activity
    await logAdminActivity(req.user.userId, `Added new ${type.slice(0, -1)}`);

    res.status(201).json({
      success: true,
      message: `Official added to ${type} successfully`,
      data: content[type],
    });
  } catch (error) {
    console.error("Error adding official:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add official",
    });
  }
};

// Update official
const updateOfficial = async (req, res) => {
  try {
    const { type, index } = req.params;
    const officialData = req.body;
    
    // Handle image upload to Supabase
    if (req.file) {
      const fileExt = require('path').extname(req.file.originalname);
      const fileName = `${type}-${Date.now()}${fileExt}`;
      const filePath = `about-images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("bms646-app")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return res.status(500).json({
          message: "Image upload failed",
          error: uploadError.message,
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from("bms646-app")
        .getPublicUrl(filePath);

      officialData.imageUrl = publicUrlData.publicUrl;
    }
    
    let content = await AboutPage.getAboutContent();
    
    if (!content[type] || !content[type][index]) {
      return res.status(404).json({
        success: false,
        message: "Official not found",
      });
    }

    content[type][index] = { ...content[type][index], ...officialData };
    content.lastUpdated = new Date();
    content.updatedBy = req.user?.userId;
    
    await content.save();

    // Log admin activity
    await logAdminActivity(req.user.userId, `Updated ${type.slice(0, -1)} at index ${index}`);

    res.status(200).json({
      success: true,
      message: "Official updated successfully",
      data: content[type][index],
    });
  } catch (error) {
    console.error("Error updating official:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update official",
    });
  }
};

// Delete official
const deleteOfficial = async (req, res) => {
  try {
    const { type, index } = req.params;

    let content = await AboutPage.getAboutContent();
    
    if (!content[type] || !content[type][index]) {
      return res.status(404).json({
        success: false,
        message: "Official not found",
      });
    }

    const deletedOfficial = content[type].splice(index, 1);
    content.lastUpdated = new Date();
    content.updatedBy = req.user?.userId;
    
    await content.save();

    // Log admin activity
    await logAdminActivity(req.user.userId, `Deleted ${type.slice(0, -1)}: ${deletedOfficial[0]?.name}`);

    res.status(200).json({
      success: true,
      message: "Official deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting official:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete official",
    });
  }
};

module.exports = {
  getAboutContent,
  updateAboutContent,
  updateAboutSection,
  addOfficial,
  updateOfficial,
  deleteOfficial,
};
