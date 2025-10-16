const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables manually
function loadEnv() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const lines = envContent.split('\n');
    const env = {};
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return env;
  } catch (error) {
    console.error('Error reading .env.local:', error);
    return {};
  }
}

async function checkMessagingSystem() {
  console.log('Checking messaging system status...');
  
  const env = loadEnv();
  
  // Create admin client to check database
  const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check conversations table
    console.log('\n=== Checking conversations table ===');
    const { data: conversations, error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .limit(5);
    
    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
    } else {
      console.log('Conversations found:', conversations.length);
      conversations.forEach(conv => {
        console.log(`- Conversation ID: ${conv.id} - Type: ${conv.conversation_type} - Created: ${conv.created_at}`);
      });
    }

    // Check messages table with delivered_at and read_at fields
    console.log('\n=== Checking messages table (with status fields) ===');
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, content, sender_id, conversation_id, created_at, delivered_at, read_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    } else {
      console.log('Recent messages found:', messages.length);
      messages.forEach(msg => {
        const deliveredStatus = msg.delivered_at ? `Delivered: ${msg.delivered_at}` : 'Not delivered';
        const readStatus = msg.read_at ? `Read: ${msg.read_at}` : 'Not read';
        console.log(`- Message ID: ${msg.id}`);
        console.log(`  Content: "${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}"`);
        console.log(`  Sender: ${msg.sender_id}`);
        console.log(`  Created: ${msg.created_at}`);
        console.log(`  ${deliveredStatus}`);
        console.log(`  ${readStatus}`);
        console.log('');
      });
    }

    // Check conversation participants
    console.log('\n=== Checking conversation participants ===');
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('conversation_participants')
      .select('*')
      .limit(10);
    
    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
    } else {
      console.log('Participants found:', participants.length);
      participants.forEach(p => {
        console.log(`- User: ${p.user_id} in Conversation: ${p.conversation_id} - Last read: ${p.last_read_at || 'Never'}`);
      });
    }

    // Check if mark_messages_as_read function exists
    console.log('\n=== Checking database functions ===');
    const { data: functions, error: functionsError } = await supabaseAdmin
      .rpc('mark_messages_as_read', {
        p_conversation_id: 'test',
        p_user_id: 'test'
      });
    
    if (functionsError) {
      if (functionsError.message.includes('function mark_messages_as_read')) {
        console.log('✓ mark_messages_as_read function exists (got expected error for test call)');
      } else {
        console.error('Error testing mark_messages_as_read function:', functionsError);
      }
    } else {
      console.log('✓ mark_messages_as_read function exists and responded');
    }

    // Test message status counts
    console.log('\n=== Message Status Summary ===');
    const { data: statusCounts, error: statusError } = await supabaseAdmin
      .from('messages')
      .select('delivered_at, read_at');
    
    if (!statusError && statusCounts) {
      const totalMessages = statusCounts.length;
      const deliveredMessages = statusCounts.filter(m => m.delivered_at).length;
      const readMessages = statusCounts.filter(m => m.read_at).length;
      
      console.log(`Total messages: ${totalMessages}`);
      console.log(`Delivered messages: ${deliveredMessages} (${((deliveredMessages/totalMessages)*100).toFixed(1)}%)`);
      console.log(`Read messages: ${readMessages} (${((readMessages/totalMessages)*100).toFixed(1)}%)`);
    }

  } catch (error) {
    console.error('Error checking messaging system:', error);
  }
}

checkMessagingSystem();