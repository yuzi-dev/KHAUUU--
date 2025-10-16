const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simpleVerification() {
  console.log('🔍 Simple verification of sharing system migration...\n');

  try {
    // 1. Try to access shared_content table directly
    console.log('1. Testing shared_content table access...');
    const { data: sharedContentTest, error: sharedContentError } = await supabase
      .from('shared_content')
      .select('*')
      .limit(1);

    if (sharedContentError) {
      console.log('❌ shared_content table not found:', sharedContentError.message);
    } else {
      console.log('✅ shared_content table exists and is accessible');
    }

    // 2. Check messages table structure by trying to select new columns
    console.log('\n2. Testing messages table for new columns...');
    const { data: messagesTest, error: messagesError } = await supabase
      .from('messages')
      .select('id, sender_id, shared_content_id')
      .limit(1);

    if (messagesError) {
      console.log('❌ Error accessing messages columns:', messagesError.message);
      if (messagesError.message.includes('sender_id')) {
        console.log('   - sender_id column missing');
      }
      if (messagesError.message.includes('shared_content_id')) {
        console.log('   - shared_content_id column missing');
      }
    } else {
      console.log('✅ Messages table has the new columns (sender_id, shared_content_id)');
    }

    // 3. Try to call one of the sharing functions
    console.log('\n3. Testing sharing functions...');
    try {
      const { data: functionTest, error: functionError } = await supabase
        .rpc('get_shared_content_details', { p_shared_content_id: '00000000-0000-0000-0000-000000000000' });
      
      if (functionError) {
        console.log('❌ Sharing functions not found:', functionError.message);
      } else {
        console.log('✅ Sharing functions are available');
      }
    } catch (err) {
      console.log('❌ Error testing functions:', err.message);
    }

    // 4. Check if we can insert into shared_content (will fail if table doesn't exist)
    console.log('\n4. Testing shared_content table structure...');
    try {
      const { error: insertError } = await supabase
        .from('shared_content')
        .insert({
          content_type: 'test',
          content_id: '00000000-0000-0000-0000-000000000000',
          shared_by: '00000000-0000-0000-0000-000000000000',
          share_message: 'test'
        });

      if (insertError) {
        if (insertError.message.includes('does not exist')) {
          console.log('❌ shared_content table does not exist');
        } else if (insertError.message.includes('violates check constraint')) {
          console.log('✅ shared_content table exists with proper constraints');
        } else {
          console.log('❌ Insert error:', insertError.message);
        }
      } else {
        console.log('⚠️  Test record inserted (this should not happen with invalid data)');
      }
    } catch (err) {
      console.log('❌ Error testing insert:', err.message);
    }

    console.log('\n📋 Summary:');
    console.log('If you see ❌ for shared_content table, the migration needs to be run.');
    console.log('If you see ✅ for all items, the migration was successful.');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

simpleVerification();