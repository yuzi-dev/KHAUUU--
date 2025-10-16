#!/usr/bin/env node

/**
 * Apply Permanent Message Delivery Fix Migration (Direct Approach)
 * 
 * This script applies the permanent fix for message delivery status
 * by executing individual SQL statements directly.
 */

const fs = require('fs');
const path = require('path');
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

    // Step 1: Create the function to set delivered_at
    console.log('1️⃣ Creating set_message_delivered_at function...');
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION set_message_delivered_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.delivered_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: funcError } = await supabase.rpc('exec', { sql: createFunctionSQL });
    if (funcError) {
      console.error('❌ Error creating function:', funcError);
      throw funcError;
    }
    console.log('✅ Function created successfully');

    // Step 2: Create the trigger
    console.log('2️⃣ Creating trigger for automatic delivered_at...');
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS trigger_set_message_delivered_at ON public.messages;
      CREATE TRIGGER trigger_set_message_delivered_at
          BEFORE INSERT ON public.messages
          FOR EACH ROW
          EXECUTE FUNCTION set_message_delivered_at();
    `;

    const { error: triggerError } = await supabase.rpc('exec', { sql: createTriggerSQL });
    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError);
      throw triggerError;
    }
    console.log('✅ Trigger created successfully');

    // Step 3: Update existing messages
    console.log('3️⃣ Updating existing messages with delivered_at...');
    const { data: updateResult, error: updateError } = await supabase
      .from('messages')
      .update({ delivered_at: supabase.raw('created_at') })
      .is('delivered_at', null)
      .eq('is_deleted', false);

    if (updateError) {
      console.error('❌ Error updating existing messages:', updateError);
      throw updateError;
    }
    console.log('✅ Existing messages updated successfully');

    // Step 4: Update the mark_messages_as_read function
    console.log('4️⃣ Updating mark_messages_as_read function...');
    const updateMarkReadSQL = `
      CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
      RETURNS VOID AS $$
      BEGIN
          UPDATE public.conversation_participants
          SET last_read_at = NOW()
          WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
          
          UPDATE public.messages
          SET 
              read_at = NOW(),
              delivered_at = COALESCE(delivered_at, created_at)
          WHERE conversation_id = p_conversation_id 
          AND sender_id != p_user_id 
          AND read_at IS NULL
          AND is_deleted = false;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: markReadError } = await supabase.rpc('exec', { sql: updateMarkReadSQL });
    if (markReadError) {
      console.error('❌ Error updating mark_messages_as_read function:', markReadError);
      throw markReadError;
    }
    console.log('✅ mark_messages_as_read function updated successfully');

    // Step 5: Verify the results
    console.log('5️⃣ Verifying migration results...\n');

    const { data: messages, error: verifyError } = await supabase
      .from('messages')
      .select('id, delivered_at, created_at')
      .eq('is_deleted', false);

    if (verifyError) {
      console.error('⚠️  Could not verify results:', verifyError);
    } else {
      const totalMessages = messages.length;
      const deliveredMessages = messages.filter(m => m.delivered_at).length;
      const deliveryPercentage = totalMessages > 0 ? ((deliveredMessages / totalMessages) * 100).toFixed(2) : 0;

      console.log('📊 Message Delivery Statistics:');
      console.log(`   Total messages: ${totalMessages}`);
      console.log(`   Delivered messages: ${deliveredMessages} (${deliveryPercentage}%)`);
      
      if (deliveryPercentage == 100) {
        console.log('✅ All messages now have delivery status!');
      } else {
        console.log('⚠️  Some messages still missing delivery status');
      }
    }

    console.log('\n🎉 Permanent message delivery fix applied successfully!');
    console.log('📝 Key changes:');
    console.log('   - Created trigger to auto-set delivered_at for new messages');
    console.log('   - Updated existing messages with delivery timestamps');
    console.log('   - Enhanced mark_messages_as_read function with safety measures');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyDeliveryFixMigration();