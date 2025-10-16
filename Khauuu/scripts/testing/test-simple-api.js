require("dotenv").config({ path: ".env.local" });

async function testSimpleAPI() {
  try {
    const testUserId = "0acff238-6893-4c23-92ed-b3ec78674379";
    const newBio = `Simple test ${Date.now()}`;
    
    console.log("Testing simple API call...");
    
    const response = await fetch('http://localhost:3001/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        bio: newBio
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers.get('content-type'));
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      console.log("JSON response:", data);
    } else {
      const text = await response.text();
      console.log("Text response (first 200 chars):", text.substring(0, 200));
    }
    
  } catch (error) {
    console.error("Test error:", error.message);
  }
}

testSimpleAPI();