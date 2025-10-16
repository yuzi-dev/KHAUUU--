const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNotificationFlow() {
  try {
    console.log('🧪 Testing real-time notification flow...\n');
    
    // First, get a test user to create a notification for
    console.log('1. Getting test user...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('user_id, username')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('❌ No users found in database:', userError);
      console.log('💡 Please make sure you have at least one user in your profiles table');
      return;
    }
    
    const testUser = users[0];
    console.log(`✅ Found test user: ${testUser.username} (${testUser.user_id})`);
    
    // Create a test notification using the create_notification function
    console.log('\n2. Creating test notification...');
    const { data: result, error: notificationError } = await supabase
      .rpc('create_notification', {
        p_recipient_id: testUser.user_id,
        p_sender_id: testUser.user_id, // Self-notification for testing
        p_type: 'test',
        p_title: 'Test Notification',
        p_message: 'This is a test notification to verify real-time functionality',
        p_data: { test: true, timestamp: new Date().toISOString() }
      });
    
    if (notificationError) {
      console.error('❌ Failed to create notification:', notificationError);
      return;
    }
    
    console.log('✅ Test notification created successfully!');
    console.log('📧 Notification details:', {
      recipient: testUser.username,
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification to verify real-time functionality'
    });
    
    // Check if the notification was created
    console.log('\n3. Verifying notification in database...');
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', testUser.user_id)
      .eq('type', 'test')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Failed to fetch notification:', fetchError);
      return;
    }
    
    if (notifications && notifications.length > 0) {
      console.log('✅ Notification found in database:', {
        id: notifications[0].id,
        title: notifications[0].title,
        created_at: notifications[0].created_at
      });
    } else {
      console.log('❌ Notification not found in database');
      return;
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 What happened:');
    console.log('   1. ✅ Test notification was created in the database');
    console.log('   2. ✅ Database trigger should have fired (pg_notify)');
    console.log('   3. 🔄 Frontend should receive real-time update via Ably');
    console.log('   4. 🔔 Notification count should update in the navbar');
    
    console.log('\n💡 Next steps:');
    console.log('   - Open your application at http://localhost:3000');
    console.log('   - Log in as the test user if needed');
    console.log('   - Check if the notification badge shows the new count');
    console.log('   - Open the notification modal to see the test notification');
    
  } catch (error) {
    console.error('❌ Error testing notification flow:', error);
  }
}

testNotificationFlow();