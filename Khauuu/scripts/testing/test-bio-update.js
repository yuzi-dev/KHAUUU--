require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBioUpdate() {
  try {
    // Get a test user
    const testUserId = "0acff238-6893-4c23-92ed-b3ec78674379";
    
    console.log("1. Getting current profile...");
    const { data: currentProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", testUserId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching profile:", fetchError);
      return;
    }
    
    console.log("Current bio:", currentProfile.bio);
    
    // Update bio
    const newBio = `Test bio update ${new Date().toISOString()}`;
    console.log("2. Updating bio to:", newBio);
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ bio: newBio, updated_at: new Date().toISOString() })
      .eq("user_id", testUserId)
      .select();
    
    if (updateError) {
      console.error("Error updating profile:", updateError);
      return;
    }
    
    console.log("✅ Update successful");
    console.log("Updated profile:", updatedProfile[0]);
    
    // Verify the update
    console.log("3. Verifying update...");
    const { data: verifyProfile, error: verifyError } = await supabase
      .from("profiles")
      .select("bio")
      .eq("user_id", testUserId)
      .single();
    
    if (verifyError) {
      console.error("Error verifying update:", verifyError);
      return;
    }
    
    console.log("Verified bio:", verifyProfile.bio);
    console.log(verifyProfile.bio === newBio ? "✅ Bio update verified!" : "❌ Bio update failed!");
    
  } catch (error) {
    console.error("Test error:", error);
  }
}

testBioUpdate();