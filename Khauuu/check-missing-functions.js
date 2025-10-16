require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreateFunctions() {
  console.log('=== Checking and Creating Missing Database Functions ===\n');

  try {
    // Test mark_messages_as_read function
    console.log('1. Testing mark_messages_as_read function...');
    try {
      const { data, error } = await supabase
        .rpc('mark_messages_as_read', {
          p_conversation_id: '00000000-0000-0000-0000-000000000000',
          p_user_id: '00000000-0000-0000-0000-000000000000'
        });
      
      if (error && error.code === 'PGRST202') {
        console.log('❌ mark_messages_as_read function not found, creating...');
        
        const createFunctionSQL = `
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.conversation_participants
    SET last_read_at = NOW()
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION mark_messages_as_read TO authenticated;
        `;
        
        const { error: createError } = await supabase.rpc('sql', { query: createFunctionSQL });
        if (createError) {
          console.log('❌ Failed to create mark_messages_as_read:', createError.message);
        } else {
          console.log('✅ mark_messages_as_read function created successfully');
        }
      } else {
        console.log('✅ mark_messages_as_read function exists');
      }
    } catch (e) {
      console.log('❌ Error testing mark_messages_as_read:', e.message);
    }

    // Test get_unread_message_count function
    console.log('\n2. Testing get_unread_message_count function...');
    try {
      const { data, error } = await supabase
        .rpc('get_unread_message_count', {
          p_user_id: '00000000-0000-0000-0000-000000000000'
        });
      
      if (error && error.code === 'PGRST202') {
        console.log('❌ get_unread_message_count function not found, creating...');
        
        const createFunctionSQL = `
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COALESCE(SUM(
        (SELECT COUNT(*)
         FROM public.messages m
         WHERE m.conversation_id = cp.conversation_id
         AND m.created_at > cp.last_read_at
         AND m.sender_id != p_user_id
         AND m.is_deleted = false)
    ), 0) INTO unread_count
    FROM public.conversation_participants cp
    WHERE cp.user_id = p_user_id AND cp.is_active = true;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_unread_message_count TO authenticated;
        `;
        
        const { error: createError } = await supabase.rpc('sql', { query: createFunctionSQL });
        if (createError) {
          console.log('❌ Failed to create get_unread_message_count:', createError.message);
        } else {
          console.log('✅ get_unread_message_count function created successfully');
        }
      } else {
        console.log('✅ get_unread_message_count function exists');
      }
    } catch (e) {
      console.log('❌ Error testing get_unread_message_count:', e.message);
    }

    // Test with real data
    console.log('\n3. Testing functions with real data...');
    
    // Get a real user ID
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);
    
    if (profiles && profiles.length > 0) {
      const userId = profiles[0].user_id;
      console.log(`Testing with user ID: ${userId}`);
      
      // Test get_unread_message_count with real user
      const { data: unreadCount, error: unreadError } = await supabase
        .rpc('get_unread_message_count', { p_user_id: userId });
      
      if (unreadError) {
        console.log('❌ get_unread_message_count error:', unreadError.message);
      } else {
        console.log(`✅ Unread message count for user: ${unreadCount}`);
      }
      
      // Get a real conversation ID
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);
      
      if (conversations && conversations.length > 0) {
        const conversationId = conversations[0].id;
        console.log(`Testing mark_messages_as_read with conversation ID: ${conversationId}`);
        
        const { error: markReadError } = await supabase
          .rpc('mark_messages_as_read', { 
            p_conversation_id: conversationId, 
            p_user_id: userId 
          });
        
        if (markReadError) {
          console.log('❌ mark_messages_as_read error:', markReadError.message);
        } else {
          console.log('✅ mark_messages_as_read executed successfully');
        }
      }
    }

  } catch (error) {
    console.error('Error checking functions:', error);
  }
}

checkAndCreateFunctions();