#!/usr/bin/env node

/**
 * Apply Permanent Message Delivery Fix Migration (Supabase Native Approach)
 * 
 * This script applies the permanent fix for message delivery status
 * using Supabase's native query methods and table operations.
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

async function applyDeliveryFixMigration() {
  try {
    console.log('🚀 Applying permanent message delivery fix migration...\n');

    // Step 1: Update existing messages that don't have delivered_at
    console.log('1️⃣ Updating existing messages with delivered_at...');
    
    // First, get messages without delivered_at
    const { data: messagesWithoutDelivery, error: fetchError } = await supabase
      .from('messages')
      .select('id, created_at')
      .is('delivered_at', null)
      .eq('is_deleted', false);

    if (fetchError) {
      console.error('❌ Error fetching messages:', fetchError);
      throw fetchError;
    }

    console.log(`   Found ${messagesWithoutDelivery.length} messages without delivery status`);

    if (messagesWithoutDelivery.length > 0) {
      // Update messages in batches to avoid timeout
      const batchSize = 100;
      let updatedCount = 0;

      for (let i = 0; i < messagesWithoutDelivery.length; i += batchSize) {
        const batch = messagesWithoutDelivery.slice(i, i + batchSize);
        const messageIds = batch.map(m => m.id);

        const { error: updateError } = await supabase
          .from('messages')
          .update({ 
            delivered_at: supabase.raw('created_at')
          })
          .in('id', messageIds);

        if (updateError) {
          console.error(`❌ Error updating batch ${i / batchSize + 1}:`, updateError);
          throw updateError;
        }

        updatedCount += batch.length;
        console.log(`   Updated ${updatedCount}/${messagesWithoutDelivery.length} messages`);
      }

      console.log('✅ All existing messages updated with delivery timestamps');
    } else {
      console.log('✅ All messages already have delivery timestamps');
    }

    // Step 2: Verify the results
    console.log('2️⃣ Verifying migration results...\n');

    const { data: allMessages, error: verifyError } = await supabase
      .from('messages')
      .select('id, delivered_at, read_at, created_at')
      .eq('is_deleted', false);

    if (verifyError) {
      console.error('⚠️  Could not verify results:', verifyError);
    } else {
      const totalMessages = allMessages.length;
      const deliveredMessages = allMessages.filter(m => m.delivered_at).length;
      const readMessages = allMessages.filter(m => m.read_at).length;
      const deliveryPercentage = totalMessages > 0 ? ((deliveredMessages / totalMessages) * 100).toFixed(2) : 0;
      const readPercentage = totalMessages > 0 ? ((readMessages / totalMessages) * 100).toFixed(2) : 0;

      console.log('📊 Message Delivery Statistics:');
      console.log(`   Total messages: ${totalMessages}`);
      console.log(`   Delivered messages: ${deliveredMessages} (${deliveryPercentage}%)`);
      console.log(`   Read messages: ${readMessages} (${readPercentage}%)`);
      
      if (deliveryPercentage == 100) {
        console.log('✅ All messages now have delivery status!');
      } else {
        console.log('⚠️  Some messages still missing delivery status');
      }
    }

    console.log('\n🎉 Message delivery fix applied successfully!');
    console.log('📝 Changes made:');
    console.log('   - Updated all existing messages with delivery timestamps');
    console.log('   - Set delivered_at to created_at for retroactive delivery status');
    
    console.log('\n📋 Next steps:');
    console.log('   - Apply the SQL migration file manually in Supabase dashboard');
    console.log('   - This will create the trigger for automatic delivery timestamps');
    console.log('   - File location: migration/006_fix_message_delivery_permanent.sql');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyDeliveryFixMigration();