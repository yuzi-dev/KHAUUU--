#!/usr/bin/env node

/**
 * Test Message Delivery Fix
 * 
 * This script tests the permanent fix for message delivery status
 * by creating test messages and verifying they have proper delivery timestamps.
 */

require('dotenv').config({ path: '.env.local' });

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testMessageDeliveryFix() {
  try {
    console.log('🧪 Testing message delivery fix...\n');

    // Step 1: Get existing conversations and users for testing
    console.log('1️⃣ Getting test data...');
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);

    if (convError || !conversations || conversations.length === 0) {
      console.error('❌ No conversations found for testing:', convError);
      console.log('ℹ️  Please create a conversation first to test message delivery');
      return;
    }

    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(2);

    if (userError || !users || users.length < 2) {
      console.error('❌ Need at least 2 users for testing:', userError);
      return;
    }

    const conversationId = conversations[0].id;
    const senderId = users[0].id;
    
    console.log(`   Using conversation: ${conversationId}`);
    console.log(`   Using sender: ${senderId}`);

    // Step 2: Create a test message
    console.log('2️⃣ Creating test message...');
    
    const testMessage = {
      conversation_id: conversationId,
      sender_id: senderId,
      content: `Test message for delivery fix - ${new Date().toISOString()}`,
      is_deleted: false
    };

    const { data: newMessage, error: createError } = await supabase
      .from('messages')
      .insert(testMessage)
      .select('*')
      .single();

    if (createError) {
      console.error('❌ Error creating test message:', createError);
      throw createError;
    }

    console.log('✅ Test message created successfully');
    console.log(`   Message ID: ${newMessage.id}`);

    // Step 3: Verify the message has delivered_at timestamp
    console.log('3️⃣ Verifying delivery timestamp...');
    
    const { data: verifyMessage, error: verifyError } = await supabase
      .from('messages')
      .select('id, content, created_at, delivered_at, read_at')
      .eq('id', newMessage.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying message:', verifyError);
      throw verifyError;
    }

    console.log('📊 Message Details:');
    console.log(`   ID: ${verifyMessage.id}`);
    console.log(`   Content: ${verifyMessage.content}`);
    console.log(`   Created: ${verifyMessage.created_at}`);
    console.log(`   Delivered: ${verifyMessage.delivered_at}`);
    console.log(`   Read: ${verifyMessage.read_at || 'Not read yet'}`);

    // Step 4: Check if delivery timestamp is set
    if (verifyMessage.delivered_at) {
      console.log('✅ SUCCESS: Message has delivery timestamp!');
      
      // Check if delivered_at is close to created_at (should be within seconds)
      const createdTime = new Date(verifyMessage.created_at);
      const deliveredTime = new Date(verifyMessage.delivered_at);
      const timeDiff = Math.abs(deliveredTime - createdTime);
      
      if (timeDiff < 5000) { // Within 5 seconds
        console.log('✅ SUCCESS: Delivery timestamp is properly set (within 5 seconds of creation)');
      } else {
        console.log(`⚠️  WARNING: Delivery timestamp differs from creation by ${timeDiff}ms`);
      }
    } else {
      console.log('❌ FAILURE: Message does not have delivery timestamp!');
      console.log('   This indicates the trigger is not working properly');
    }

    // Step 5: Test overall delivery statistics
    console.log('4️⃣ Checking overall delivery statistics...');
    
    const { data: allMessages, error: statsError } = await supabase
      .from('messages')
      .select('id, delivered_at')
      .eq('is_deleted', false);

    if (statsError) {
      console.error('⚠️  Could not get delivery statistics:', statsError);
    } else {
      const totalMessages = allMessages.length;
      const deliveredMessages = allMessages.filter(m => m.delivered_at).length;
      const deliveryPercentage = totalMessages > 0 ? ((deliveredMessages / totalMessages) * 100).toFixed(2) : 0;

      console.log('📊 Overall Delivery Statistics:');
      console.log(`   Total messages: ${totalMessages}`);
      console.log(`   Delivered messages: ${deliveredMessages} (${deliveryPercentage}%)`);
      
      if (deliveryPercentage == 100) {
        console.log('✅ SUCCESS: All messages have delivery status!');
      } else {
        console.log('⚠️  Some messages still missing delivery status');
      }
    }

    // Step 6: Clean up test message
    console.log('5️⃣ Cleaning up test message...');
    
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', newMessage.id);

    if (deleteError) {
      console.error('⚠️  Could not delete test message:', deleteError);
      console.log(`   Please manually delete message ID: ${newMessage.id}`);
    } else {
      console.log('✅ Test message cleaned up successfully');
    }

    console.log('\n🎉 Message delivery fix test completed!');
    
    if (verifyMessage.delivered_at && deliveryPercentage == 100) {
      console.log('✅ OVERALL RESULT: Permanent fix is working correctly!');
    } else {
      console.log('❌ OVERALL RESULT: Fix needs attention - check migration status');
    }

  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run the test
testMessageDeliveryFix();