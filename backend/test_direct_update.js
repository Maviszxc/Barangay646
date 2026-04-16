// Quick test to check if backend update is working
const mongoose = require('mongoose');
const { User, Census } = require('./APP/models/residentData_model');
require('dotenv').config();

async function testUpdateDirectly() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to Database\n');

    // Get a user to test with
    const testUser = await User.findOne({ isLoginApproved: true });
    if (!testUser) {
      console.log('❌ No approved users found');
      return;
    }

    console.log('👤 Testing with user:', testUser.firstName, testUser.lastName);
    console.log('📝 User ID:', testUser._id);
    console.log('📊 Current phone:', testUser.phoneNumber || 'Not set');

    // Test direct update
    const originalPhone = testUser.phoneNumber || 'Not set';
    const newPhone = 'TEST-' + Date.now();
    
    console.log('\n🔧 Testing direct update...');
    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      { phoneNumber: newPhone },
      { new: true, runValidators: true }
    );

    if (updatedUser) {
      console.log('✅ Direct update successful!');
      console.log('📊 New phone:', updatedUser.phoneNumber);
      
      // Verify the change
      const verifyUser = await User.findById(testUser._id);
      console.log('🔍 Verification - phone:', verifyUser.phoneNumber);
      
      // Revert back
      await User.findByIdAndUpdate(
        testUser._id,
        { phoneNumber: originalPhone === 'Not set' ? null : originalPhone }
      );
      console.log('🔄 Reverted changes');
      
    } else {
      console.log('❌ Direct update failed');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testUpdateDirectly();
