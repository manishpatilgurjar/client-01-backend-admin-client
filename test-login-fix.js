// Test script to verify login fix with the provided credentials
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLoginFix() {
  console.log('🚀 Testing login fix with provided credentials...\n');

  try {
    console.log('📝 Sending login request...');
    
    const response = await axios.post(`${BASE_URL}/admin/auth/login`, {
      "email": "manishpatil1412@gmail.com",
      "password": "Admin@123",
      "deviceData": {
        "deviceType": "desktop",
        "os": "Windows",
        "browser": "Chrome"
      },
      "ipAddress": "49.43.2.146",
      "location": {
        "latitude": 22.740992,
        "longitude": 75.8874112
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500; // Accept all status codes less than 500
      }
    });

    console.log('✅ Login successful!');
    console.log('📊 Status Code:', response.status);
    console.log('📄 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    // Check if user role is returned
    if (response.data.data && response.data.data.user) {
      console.log('\n🎭 User Role:', response.data.data.user.role);
      console.log('👤 Username:', response.data.data.user.username);
      console.log('📧 Email:', response.data.data.user.email);
    }

  } catch (error) {
    console.log('❌ Login failed!');
    console.log('📊 Error Type:', error.name);
    console.log('📝 Error Message:', error.message);
    
    if (error.response) {
      console.log('📊 Response Status:', error.response.status);
      console.log('📊 Response Status Text:', error.response.statusText);
      console.log('📄 Response Data:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('❌ No response received - server might not be running');
    } else {
      console.log('❌ Error setting up request:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 Check your server console for detailed logs');
}

// Instructions
console.log('📋 Instructions:');
console.log('1. Make sure your server is running (npm run start:dev)');
console.log('2. Check your server console for detailed logs');
console.log('3. Run: node test-login-fix.js');
console.log('\n' + '='.repeat(60));

// Run the test
testLoginFix(); 