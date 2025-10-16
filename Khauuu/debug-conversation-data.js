require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugConversationData() {
  console.log('=== Debugging Conversation Data ===\n');

  try {
    // Get all users
    console.log('1. All users:');
    const { data: users } = await supabase
      .from('profiles')
      .select('user_id, username, full_name');
    
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.full_name}): ${user.user_id}`);
    });

    // Get all conversations
    console.log('\n2. All conversations:');
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*');
    
    conversations.forEach(conv => {
      console.log(`   - Conversation ${conv.id}:`);
      console.log(`     Created: ${conv.created_at}`);
      console.log(`     Participants: ${conv.participant_count}`);
      console.log(`     Last message: ${conv.last_message_id}`);
    });

    // Get all participants
    console.log('\n3. All conversation participants:');
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select(`
        *,
        profiles:user_id (username, full_name)
      `);
    
    participants.forEach(part => {
      console.log(`   - Participant ${part.id}:`);
      console.log(`     User: ${part.profiles?.username} (${part.user_id})`);
      console.log(`     Conversation: ${part.conversation_id}`);
      console.log(`     Active: ${part.is_active}`);
      console.log(`     Joined: ${part.joined_at}`);
      console.log(`     Last read: ${part.last_read_at}`);
    });

    // Get all messages
    console.log('\n4. All messages:');
    const { data: messages } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (username, full_name)
      `);
    
    messages.forEach(msg => {
      console.log(`   - Message ${msg.id}:`);
      console.log(`     From: ${msg.sender?.username} (${msg.sender_id})`);
      console.log(`     Conversation: ${msg.conversation_id}`);
      console.log(`     Content: "${msg.content}"`);
      console.log(`     Created: ${msg.created_at}`);
      console.log(`     Read at: ${msg.read_at || 'Not read'}`);
    });

    // Test specific conversation access for each user
    console.log('\n5. Testing conversation access:');
    const conversationId = conversations[0]?.id;
    
    if (conversationId) {
      console.log(`   Testing access to conversation: ${conversationId}`);
      
      for (const user of users) {
        console.log(`\n   Testing user: ${user.username} (${user.user_id})`);
        
        // Check participant status
        const { data: userParticipants, error: partError } = await supabase
          .from('conversation_participants')
          .select('*')
          .eq('conversation_id', conversationId)
          .eq('user_id', user.user_id);
        
        if (partError) {
          console.log(`     ❌ Error checking participation: ${partError.message}`);
        } else if (userParticipants.length === 0) {
          console.log(`     ❌ Not a participant`);
        } else {
          console.log(`     ✅ Is participant:`, userParticipants[0]);
          
          // Test mark_messages_as_read function
          const { error: markReadError } = await supabase
            .rpc('mark_messages_as_read', {
              p_conversation_id: conversationId,
              p_user_id: user.user_id
            });
          
          if (markReadError) {
            console.log(`     ❌ mark_messages_as_read error: ${markReadError.message}`);
          } else {
            console.log(`     ✅ mark_messages_as_read successful`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error debugging conversation data:', error);
  }
}

debugConversationData();