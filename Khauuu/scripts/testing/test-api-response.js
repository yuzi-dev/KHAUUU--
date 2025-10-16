require("dotenv").config({ path: ".env.local" });

async function testAPIResponse() {
  try {
    const testUserId = "0acff238-6893-4c23-92ed-b3ec78674379";
    const newBio = `API response test ${new Date().toISOString()}`;
    
    console.log("Testing API response structure...");
    
    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        bio: newBio,
        full_name: "Test Update",
        username: "laughattack496",
        website: "www.hello.com",
        location: "kathmandu",
        is_vegetarian: true
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log("Raw response text:", responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log("Parsed response data:", data);
      console.log("Has profile field:", 'profile' in data);
      console.log("Profile value:", data.profile);
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
    }
    
  } catch (error) {
    console.error("Test error:", error);
  }
}

testAPIResponse();