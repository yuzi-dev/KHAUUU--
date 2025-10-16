const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testProfileUpdate() {
  const userId = '0acff238-6893-4c23-92ed-b3ec78674379';
  
  try {
    console.log('Testing profile update for user:', userId);
    
    // First check if profile exists
    console.log('1. Checking if profile exists...');
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError) {
      console.error('Check error:', checkError);
      return;
    }
    
    console.log('✅ Profile exists:', existingProfile.username);
    
    // Try to update the profile
    console.log('2. Attempting to update profile...');
    const updateData = {
      full_name: 'Test Update',
      bio: 'Updated bio'
    };
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return;
    }
    
    console.log('✅ Profile updated successfully:', updatedProfile.username);
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

testProfileUpdate();