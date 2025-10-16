require("dotenv").config({ path: ".env.local" });

async function testAPIBioUpdate() {
  try {
    const testUserId = "0acff238-6893-4c23-92ed-b3ec78674379";
    const newBio = `API test bio update ${new Date().toISOString()}`;
    
    console.log("Testing API bio update...");
    console.log("New bio:", newBio);
    
    // Test the API endpoint
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

    const data = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", data);
    
    if (response.ok) {
      console.log("✅ API call successful");
      console.log("Updated profile bio:", data.profile?.bio);
      
      // Verify by fetching the profile again
      console.log("\nVerifying with GET request...");
      const getResponse = await fetch(`http://localhost:3000/api/profile?userId=${testUserId}`);
      const getdata = await getResponse.json();
      
      if (getResponse.ok) {
        console.log("Current bio in database:", getdata.profile?.bio);
        console.log(getdata.profile?.bio === newBio ? "✅ Bio update verified!" : "❌ Bio update failed!");
      } else {
        console.error("Failed to fetch profile for verification:", getdata);
      }
    } else {
      console.error("❌ API call failed:", data);
    }
    
  } catch (error) {
    console.error("Test error:", error);
  }
}

testAPIBioUpdate();