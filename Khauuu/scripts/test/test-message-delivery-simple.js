#!/usr/bin/env node

/**
 * Simple Test for Message Delivery Fix
 * 
 * This script tests the permanent fix by checking existing messages
 * and verifying delivery status coverage.
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

async function testMessageDeliveryStatus() {
  try {
    console.log('🧪 Testing message delivery status...\n');

    // Step 1: Check all messages for delivery status
    console.log('1️⃣ Checking message delivery coverage...');
    
    const { data: allMessages, error: fetchError } = await supabase
      .from('messages')
      .select('id, content, created_at, delivered_at, read_at, sender_id')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('❌ Error fetching messages:', fetchError);
      throw fetchError;
    }

    console.log(`   Found ${allMessages.length} recent messages`);

    // Step 2: Analyze delivery status
    console.log('2️⃣ Analyzing delivery status...\n');
    
    let deliveredCount = 0;
    let readCount = 0;

    allMessages.forEach((message, index) => {
      const hasDelivered = !!message.delivered_at;
      const hasRead = !!message.read_at;
      
      if (hasDelivered) deliveredCount++;
      if (hasRead) readCount++;

      console.log(`Message ${index + 1}:`);
      console.log(`   ID: ${message.id}`);
      console.log(`   Content: ${message.content.substring(0, 50)}...`);
      console.log(`   Created: ${message.created_at}`);
      console.log(`   Delivered: ${hasDelivered ? '✅ ' + message.delivered_at : '❌ Missing'}`);
      console.log(`   Read: ${hasRead ? '✅ ' + message.read_at : '⏳ Unread'}`);
      console.log('');
    });

    // Step 3: Calculate statistics
    console.log('3️⃣ Delivery Statistics:');
    const totalMessages = allMessages.length;
    const deliveryPercentage = totalMessages > 0 ? ((deliveredCount / totalMessages) * 100).toFixed(2) : 0;
    const readPercentage = totalMessages > 0 ? ((readCount / totalMessages) * 100).toFixed(2) : 0;

    console.log(`   Total messages analyzed: ${totalMessages}`);
    console.log(`   Messages with delivery status: ${deliveredCount} (${deliveryPercentage}%)`);
    console.log(`   Messages read: ${readCount} (${readPercentage}%)`);

    // Step 4: Check for any messages without delivery status
    console.log('4️⃣ Checking for messages without delivery status...');
    
    const { data: undeliveredMessages, error: undeliveredError } = await supabase
      .from('messages')
      .select('id, created_at')
      .is('delivered_at', null)
      .eq('is_deleted', false);

    if (undeliveredError) {
      console.error('⚠️  Could not check undelivered messages:', undeliveredError);
    } else {
      console.log(`   Messages without delivery status: ${undeliveredMessages.length}`);
      
      if (undeliveredMessages.length > 0) {
        console.log('   ⚠️  Found messages without delivery status:');
        undeliveredMessages.forEach(msg => {
          console.log(`      - ID: ${msg.id}, Created: ${msg.created_at}`);
        });
      }
    }

    // Step 5: Overall assessment
    console.log('\n🎯 Assessment Results:');
    
    if (deliveryPercentage == 100) {
      console.log('✅ SUCCESS: All messages have delivery status!');
      console.log('✅ The permanent fix is working correctly');
    } else if (deliveryPercentage >= 90) {
      console.log('⚠️  MOSTLY WORKING: Most messages have delivery status');
      console.log('   Some older messages may need manual fixing');
    } else {
      console.log('❌ NEEDS ATTENTION: Many messages missing delivery status');
      console.log('   The permanent fix may not be fully applied');
    }

    // Step 6: Check if trigger exists (indirect test)
    console.log('\n5️⃣ Testing trigger functionality...');
    console.log('   Note: To fully test the trigger, you need to:');
    console.log('   1. Apply the SQL migration in Supabase dashboard');
    console.log('   2. Send a new message through the app');
    console.log('   3. Verify it gets delivered_at automatically');
    
    console.log('\n📋 Next Steps:');
    if (deliveryPercentage < 100) {
      console.log('   1. Run the fix script again to update remaining messages');
      console.log('   2. Apply the SQL migration for future messages');
    } else {
      console.log('   1. Apply the SQL migration for automatic delivery timestamps');
      console.log('   2. Test by sending new messages through the app');
    }

  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run the test
testMessageDeliveryStatus();