require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMessagingSchema() {
  console.log('=== Checking Messaging System Schema ===\n');

  try {
    // Check conversations table
    console.log('1. Checking conversations table...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(5);
    
    if (convError) {
      console.log('❌ Conversations table error:', convError.message);
    } else {
      console.log('✅ Conversations table exists');
      console.log(`   Found ${conversations.length} conversations`);
      if (conversations.length > 0) {
        console.log('   Sample:', conversations[0]);
      }
    }

    // Check conversation_participants table
    console.log('\n2. Checking conversation_participants table...');
    const { data: participants, error: partError } = await supabase
      .from('conversation_participants')
      .select('*')
      .limit(5);
    
    if (partError) {
      console.log('❌ Conversation_participants table error:', partError.message);
    } else {
      console.log('✅ Conversation_participants table exists');
      console.log(`   Found ${participants.length} participants`);
      if (participants.length > 0) {
        console.log('   Sample:', participants[0]);
      }
    }

    // Check messages table
    console.log('\n3. Checking messages table...');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(5);
    
    if (msgError) {
      console.log('❌ Messages table error:', msgError.message);
    } else {
      console.log('✅ Messages table exists');
      console.log(`   Found ${messages.length} messages`);
      if (messages.length > 0) {
        console.log('   Sample:', messages[0]);
      }
    }

    // Check database functions
    console.log('\n4. Checking database functions...');
    
    // Test mark_messages_as_read function
    try {
      const { data: funcTest1, error: func1Error } = await supabase
        .rpc('mark_messages_as_read', {
          p_conversation_id: '00000000-0000-0000-0000-000000000000',
          p_user_id: '00000000-0000-0000-0000-000000000000'
        });
      
      if (func1Error && func1Error.code !== 'PGRST202') {
        console.log('✅ mark_messages_as_read function exists');
      } else if (func1Error && func1Error.code === 'PGRST202') {
        console.log('❌ mark_messages_as_read function not found');
      }
    } catch (e) {
      console.log('❌ mark_messages_as_read function error:', e.message);
    }

    // Test get_unread_message_count function
    try {
      const { data: funcTest2, error: func2Error } = await supabase
        .rpc('get_unread_message_count', {
          p_user_id: '00000000-0000-0000-0000-000000000000'
        });
      
      if (func2Error && func2Error.code !== 'PGRST202') {
        console.log('✅ get_unread_message_count function exists');
      } else if (func2Error && func2Error.code === 'PGRST202') {
        console.log('❌ get_unread_message_count function not found');
      }
    } catch (e) {
      console.log('❌ get_unread_message_count function error:', e.message);
    }

    // Test get_or_create_conversation function
    try {
      const { data: funcTest3, error: func3Error } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: '00000000-0000-0000-0000-000000000000',
          user2_id: '00000000-0000-0000-0000-000000000000'
        });
      
      if (func3Error && func3Error.code !== 'PGRST202') {
        console.log('✅ get_or_create_conversation function exists');
      } else if (func3Error && func3Error.code === 'PGRST202') {
        console.log('❌ get_or_create_conversation function not found');
      }
    } catch (e) {
      console.log('❌ get_or_create_conversation function error:', e.message);
    }

    // Check profiles table for avatar_url column
    console.log('\n5. Checking profiles table structure...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, full_name, avatar_url, profile_image_url')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible');
      if (profilesData.length > 0) {
        const profile = profilesData[0];
        console.log('   Columns available:');
        Object.keys(profile).forEach(key => {
          console.log(`   - ${key}: ${profile[key] !== null ? 'has data' : 'null'}`);
        });
      }
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkMessagingSchema();