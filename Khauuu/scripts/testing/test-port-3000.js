require("dotenv").config({ path: ".env.local" });

async function testPort3000() {
  try {
    const testUserId = "0acff238-6893-4c23-92ed-b3ec78674379";
    const newBio = `Port 3000 test ${Date.now()}`;
    
    console.log("Testing API on port 3000...");
    console.log("New bio:", newBio);
    
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
    console.log("Response headers:", response.headers.get('content-type'));
    
    const data = await response.json();
    console.log("Full response:", JSON.stringify(data, null, 2));
    
    if (data.profile) {
      console.log("✅ Profile returned in response");
      console.log("Bio in response:", data.profile.bio);
      
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
      console.log("❌ No profile in response");
    }
    
  } catch (error) {
    console.error("Test error:", error.message);
  }
}

testPort3000();