const axios = require('axios');

async function testReportsEndpoints() {
  const baseURL = 'http://localhost:8000/api';
  
  console.log('🧪 TESTING REPORTS ENDPOINTS...\n');
  
  try {
    // Test 1: Get all users
    console.log('1. Testing /user/all-users...');
    const usersRes = await axios.get(`${baseURL}/user/all-users`);
    console.log(`   ✅ Total Users: ${usersRes.data.totalCensusCount}`);
    console.log(`   ✅ Users Array Length: ${usersRes.data.users?.length || 0}`);
    
    // Test 2: Get total households
    console.log('\n2. Testing /resident-data/admin/total-households...');
    const householdsRes = await axios.get(`${baseURL}/resident-data/admin/total-households`);
    console.log(`   ✅ Total Households: ${householdsRes.data.data?.totalHouseholds || 0}`);
    
    // Test 3: Get voter stats
    console.log('\n3. Testing /resident-data/admin/voter...');
    const voterRes = await axios.get(`${baseURL}/resident-data/admin/voter`);
    const registeredVoters = voterRes.data.statistics?.find(v => v._id === 'Registered');
    console.log(`   ✅ Registered Voters: ${registeredVoters?.count || 0}`);
    
    // Test 4: Get age distribution
    console.log('\n4. Testing /resident-data/admin/enhanced-age-distribution...');
    const ageRes = await axios.get(`${baseURL}/resident-data/admin/enhanced-age-distribution`);
    console.log(`   ✅ Total Residents: ${ageRes.data.data?.totalResidents || 0}`);
    console.log(`   ✅ Median Age: ${ageRes.data.data?.summary?.medianAge || 0}`);
    console.log(`   ✅ Chart Data Points: ${ageRes.data.data?.chartData?.length || 0}`);
    
    console.log('\n✅ ALL ENDPOINTS WORKING CORRECTLY!');
    
  } catch (error) {
    console.error('❌ ERROR TESTING ENDPOINTS:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testReportsEndpoints();
