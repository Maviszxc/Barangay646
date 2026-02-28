/** @format */

const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema ({
    username: {
        type: String, 
        required: true, 
        unique: true, 
    }, 
    role: {
        type: String, 
        enum: ["developer", "Captain", "Admin"],
        required: true,
    },
    password: {
        type: String, 
        required: true,
    },
});


module.exports = mongoose.model("Admin", adminSchema);