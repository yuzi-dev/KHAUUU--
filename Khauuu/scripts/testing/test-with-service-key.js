require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWithServiceKey() {
  console.log('Testing with service key (bypasses RLS)...');
  
  const profileId = '41c66d01-a93f-4528-a392-43921fb9f590';
  const newBio = `Service key update test ${Date.now()}`;
  
  console.log('Updating profile ID:', profileId);
  console.log('New bio:', newBio);
  
  // Test the exact same query as the API but with service key
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
    console.log('✅ Update successful with service key!');
    console.log('Updated bio:', updatedProfile[0].bio);
  } else {
    console.log('❌ No rows updated even with service key');
  }
}

testWithServiceKey().catch(console.error);