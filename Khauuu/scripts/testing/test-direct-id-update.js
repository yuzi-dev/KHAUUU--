require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectIdUpdate() {
  console.log('Testing direct ID update...');
  
  const profileId = '41c66d01-a93f-4528-a392-43921fb9f590';
  const newBio = `Direct ID update test ${Date.now()}`;
  
  console.log('Updating profile ID:', profileId);
  console.log('New bio:', newBio);
  
  // Test the exact same query as the API
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({
      bio: newBio,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId)
    .select();
  
  console.log('Update result:', { updatedProfile, updateError });
  
  if (updateError) {
    console.error('❌ Update failed:', updateError);
  } else if (updatedProfile && updatedProfile.length > 0) {
    console.log('✅ Update successful!');
    console.log('Updated bio:', updatedProfile[0].bio);
  } else {
    console.log('❌ No rows updated');
  }
}

testDirectIdUpdate().catch(console.error);