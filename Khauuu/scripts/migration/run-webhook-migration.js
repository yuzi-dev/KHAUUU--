const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runWebhookMigration() {
  try {
    console.log('Running webhook migration for real-time notifications...');
    
    // Create the pg_notify function (simpler approach without HTTP extension)
    const notifyFunction = `
      CREATE OR REPLACE FUNCTION notify_new_notification()
      RETURNS TRIGGER AS $$
      DECLARE
          payload JSONB;
      BEGIN
          -- Build the payload
          payload := jsonb_build_object(
              'notification_id', NEW.id,
              'recipient_id', NEW.recipient_id,
              'type', NEW.type,
              'title', NEW.title,
              'message', NEW.message,
              'data', NEW.data,
              'created_at', NEW.created_at
          );
          
          -- Send PostgreSQL notification
          PERFORM pg_notify('new_notification', payload::text);
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    console.log('Creating notify_new_notification function...');
    const { error: functionError } = await supabase.rpc('sql', { query: notifyFunction });
    
    if (functionError) {
      console.error('Failed to create function:', functionError);
      throw functionError;
    }
    
    // Drop existing trigger if it exists
    const dropTrigger = `DROP TRIGGER IF EXISTS trigger_notify_new_notification ON notifications;`;
    
    console.log('Dropping existing trigger...');
    const { error: dropError } = await supabase.rpc('sql', { query: dropTrigger });
    
    if (dropError) {
      console.log('Note: Could not drop existing trigger (may not exist):', dropError.message);
    }
    
    // Create the trigger
    const createTrigger = `
      CREATE TRIGGER trigger_notify_new_notification
          AFTER INSERT ON notifications
          FOR EACH ROW
          EXECUTE FUNCTION notify_new_notification();
    `;
    
    console.log('Creating trigger...');
    const { error: triggerError } = await supabase.rpc('sql', { query: createTrigger });
    
    if (triggerError) {
      console.error('Failed to create trigger:', triggerError);
      throw triggerError;
    }
    
    console.log('✅ Webhook migration completed successfully!');
    console.log('📡 Real-time notifications are now enabled via PostgreSQL NOTIFY');
    
  } catch (error) {
    console.error('❌ Error running webhook migration:', error);
    process.exit(1);
  }
}

runWebhookMigration();