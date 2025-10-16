require('dotenv').config({ path: '.env.local' });

async function testAPI() {
  console.log('Testing API on port 3001 (correct port)...');
  
  const testBio = `Port 3001 test ${Date.now()}`;
  console.log('New bio:', testBio);
  
  try {
    const response = await fetch('http://localhost:3001/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: '0acff238-6893-4c23-92ed-b3ec78674379',
        profileData: {
          bio: testBio
        }
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));
    
    const data = await response.json();
    console.log('Full response:', JSON.stringify(data, null, 2));
    
    if (data.profile) {
      console.log('✅ Profile found in response:', data.profile);
    } else {
      console.log('❌ No profile in response');
    }
    
    // Test GET request to verify
    console.log('\n--- Testing GET request ---');
    const getResponse = await fetch('http://localhost:3001/api/profile?userId=0acff238-6893-4c23-92ed-b3ec78674379');
    const getStatus = getResponse.status;
    console.log('GET Response status:', getStatus);
    
    if (getStatus === 200) {
      const getData = await getResponse.json();
      console.log('GET Response:', JSON.stringify(getData, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();