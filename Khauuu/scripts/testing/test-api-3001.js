require("dotenv").config({ path: ".env.local" });

async function testAPI3001() {
  try {
    const testUserId = "0acff238-6893-4c23-92ed-b3ec78674379";
    const newBio = `Port 3001 test ${new Date().toISOString()}`;
    
    console.log("Testing API on port 3001...");
    
    const response = await fetch('http://localhost:3001/api/profile', {
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
    
    const responseText = await response.text();
    console.log("Raw response:", responseText);
    
    const data = JSON.parse(responseText);
    console.log("Parsed data:", data);
    console.log("Profile in response:", data.profile);
    
    if (data.profile) {
      console.log("✅ Profile returned in response");
      console.log("Bio in response:", data.profile.bio);
    } else {
      console.log("❌ No profile in response");
    }
    
  } catch (error) {
    console.error("Test error:", error);
  }
}

testAPI3001();