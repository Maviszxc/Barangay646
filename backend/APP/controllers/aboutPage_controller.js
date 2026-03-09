/** @format */

const AboutPage = require("../models/aboutPage_model");
const { logAdminActivity } = require("./admin_controller");
const { getSupabaseClient } = require("../database/supabaseConfig");

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

// Update about page content (with image upload support)
const updateAboutContent = async (req, res) => {
  try {
    let content = await AboutPage.getAboutContent();
    
    // Ensure content exists
    if (!content) {
      content = await AboutPage.create({});
    }
    
    console.log('Updating about content (text only):', Object.keys(req.body));
    console.log('File received:', req.file ? req.file.originalname : 'No file');
    
    // Handle hero image upload
    if (req.file && req.body.heroImage === 'true') {
      console.log('Processing hero image upload:', req.file.originalname);
      
      // Convert image to base64 for immediate display
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      content.heroImageUrl = base64Image;
      console.log('Hero image converted to base64');
    }
    
    // Add metadata
    content.lastUpdated = new Date();
    content.updatedBy = req.user?.userId;

    // Update the content with other fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'updatedBy' && key !== 'heroImage') {
        content[key] = req.body[key];
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

// Update hero image specifically
const updateHeroImage = async (req, res) => {
  try {
    console.log('=== HERO IMAGE UPLOAD DEBUG ===');
    console.log('Request received');
    console.log('Headers:', req.headers);
    console.log('File:', req.file);
    console.log('Body:', req.body);
    console.log('==============================');
    
    let content = await AboutPage.getAboutContent();
    
    // Ensure content exists
    if (!content) {
      content = await AboutPage.create({});
    }
    
    if (!req.file) {
      console.log('ERROR: No file received');
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }
    
    console.log('Processing hero image upload:', req.file.originalname);
    
    // Convert image to base64 for immediate display
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    content.heroImageUrl = base64Image;
    content.lastUpdated = new Date();
    content.updatedBy = req.user?.userId;
    
    await content.save();

    // Log admin activity
    await logAdminActivity(req.user.userId, "Updated hero image");

    res.status(200).json({
      success: true,
      message: "Hero image updated successfully",
      data: { heroImageUrl: base64Image },
    });
  } catch (error) {
    console.error("Error updating hero image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update hero image",
    });
  }
};

// Update specific section
const updateAboutSection = async (req, res) => {
  try {
    const { section } = req.params;
    const updates = req.body;
    
    let content = await AboutPage.getAboutContent();
    
    // Ensure content exists
    if (!content) {
      content = await AboutPage.create({});
    }
    
    // Add metadata
    content.lastUpdated = new Date();
    content.updatedBy = req.user?.userId;

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
    
    // Handle image upload (convert to base64)
    if (req.file) {
      console.log('Converting image to base64 for testing');
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      officialData.imageUrl = base64Image;
    }
    
    let content = await AboutPage.getAboutContent();
    
    // Ensure content exists
    if (!content) {
      content = await AboutPage.create({});
    }
    
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
      message: "Official added successfully",
      data: officialData,
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
    
    let content = await AboutPage.getAboutContent();
    
    // Ensure content exists
    if (!content) {
      content = await AboutPage.create({});
    }
    
    // Handle image upload (convert to base64)
    if (req.file) {
      console.log('Converting image to base64 for testing');
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      officialData.imageUrl = base64Image;
    }
    
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
  updateHeroImage,
  addOfficial,
  updateOfficial,
  deleteOfficial,
};
