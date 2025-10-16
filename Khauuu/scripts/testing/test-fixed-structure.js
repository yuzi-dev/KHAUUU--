require('dotenv').config({ path: '.env.local' });

async function testAPI() {
  console.log('Testing API on port 3001 with correct data structure...');
  
  const testBio = `Fixed structure test ${Date.now()}`;
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
      console.log('✅ Profile found in response!');
      console.log('Updated bio:', data.profile.bio);
    } else {
      console.log('❌ No profile in response');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();