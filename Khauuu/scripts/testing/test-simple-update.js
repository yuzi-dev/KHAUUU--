require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDirectUpdate() {
  console.log('Testing direct Supabase update...');
  
  const userId = '0acff238-6893-4c23-92ed-b3ec78674379';
  const profileId = '41c66d01-a93f-4528-a392-43921fb9f590';
  const testBio = `Direct update test ${Date.now()}`;
  
  console.log('Updating profile ID:', profileId);
  console.log('New bio:', testBio);
  
  try {
    // Test update by profile ID
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        bio: testBio,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select();
    
    console.log('Update result:', { updatedProfile, updateError });
    
    if (updateError) {
      console.error('Update error:', updateError);
    } else if (updatedProfile && updatedProfile.length > 0) {
      console.log('✅ Update successful!');
      console.log('Updated bio:', updatedProfile[0].bio);
    } else {
      console.log('❌ No rows updated');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDirectUpdate();