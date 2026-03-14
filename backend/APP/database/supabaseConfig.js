/** @format */

const { createClient } = require("@supabase/supabase-js");
const multer = require('multer');
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URI;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

// Lazy initialization of Supabase client
let supabase = null;

const getSupabaseClient = () => {
  if (!supabase && supabaseUrl && supabaseServiceRoleKey) {
    try {
      console.log("🔍 Initializing Supabase client...");
      console.log("📡 Supabase URL:", supabaseUrl);
      console.log("🔑 Service Role Key exists:", !!supabaseServiceRoleKey);
      
      // Initialize client immediately
      supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      console.log("✅ Supabase client initialized successfully");
      
      // Test connectivity asynchronously (don't block)
      const https = require('https');
      const url = require('url');
      const parsedUrl = url.parse(supabaseUrl);
      
      const req = https.request({
        hostname: parsedUrl.hostname,
        port: 443,
        path: '/rest/v1/',
        method: 'GET',
        timeout: 5000,
        headers: {
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`
        }
      }, (res) => {
        console.log("✅ Supabase connectivity test - status:", res.statusCode);
        if (res.statusCode !== 200) {
          console.error("⚠️ Supabase connectivity issue detected, but client is initialized");
        }
      });
      
      req.on('error', (err) => {
        console.error("⚠️ Supabase connectivity test failed:", err.message);
        console.error("⚠️ Client initialized but connectivity may be limited");
      });
      
      req.on('timeout', () => {
        console.error("⚠️ Supabase connectivity test timeout");
        req.destroy();
      });
      
      req.end();
      
    } catch (error) {
      console.error("❌ Failed to initialize Supabase client:", error.message);
      supabase = null; // Reset on error
    }
  }
  return supabase;
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

// Function to upload image to Supabase
const uploadToSupabase = async (file, folder = 'about-page') => {
  try {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const { data, error } = await client.storage
      .from('bms646-app')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = client.storage
      .from('bms646-app')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw error;
  }
};

// Function to delete image from Supabase
const deleteFromSupabase = async (imageUrl) => {
  try {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `about-page/${fileName}`;

    const { error } = await client.storage
      .from('bms646-app')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }
};

module.exports = { supabase: getSupabaseClient, upload, uploadToSupabase, deleteFromSupabase, getSupabaseClient };
