require("dotenv").config({ path: ".env.local" });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugAPIUpdate() {
  try {
    const testUserId = "0acff238-6893-4c23-92ed-b3ec78674379";
    const profileData = {
      bio: `Debug test bio ${new Date().toISOString()}`,
      full_name: "Test Update",
      username: "laughattack496",
      website: "www.hello.com",
      location: "kathmandu",
      is_vegetarian: true
    };
    
    console.log("Testing exact Supabase query from API...");
    console.log("Profile data to update:", profileData);
    
    // This is the exact query from the API
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', testUserId)
      .select();

    console.log("Update error:", updateError);
    console.log("Updated profile data:", updatedProfile);
    console.log("Updated profile length:", updatedProfile?.length);
    console.log("First profile:", updatedProfile?.[0]);
    
    if (updateError) {
      console.error('❌ Update failed:', updateError);
    } else if (updatedProfile && updatedProfile.length > 0) {
      console.log('✅ Update successful');
      console.log('Updated bio:', updatedProfile[0].bio);
    } else {
      console.log('❌ No profile returned from update');
    }
    
  } catch (error) {
    console.error("Debug error:", error);
  }
}

debugAPIUpdate();