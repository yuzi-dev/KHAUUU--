const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDirectNotification() {
  try {
    console.log('🧪 Testing direct notification insertion...\n');
    
    // First, get a test user
    console.log('1. Getting test user...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('user_id, username')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('❌ No users found:', userError);
      return;
    }
    
    const testUser = users[0];
    console.log(`✅ Found test user: ${testUser.username} (${testUser.user_id})`);
    
    // Insert notification directly into the table
    console.log('\n2. Inserting test notification directly...');
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: testUser.user_id,
        sender_id: testUser.user_id,
        type: 'review',
        title: 'Direct Test Notification',
        message: 'This notification was inserted directly to test real-time functionality',
        data: { test: true, method: 'direct_insert', timestamp: new Date().toISOString() },
        read: false
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Failed to insert notification:', insertError);
      return;
    }
    
    console.log('✅ Notification inserted successfully!');
    console.log('📧 Notification details:', {
      id: notification.id,
      recipient: testUser.username,
      title: notification.title,
      created_at: notification.created_at
    });
    
    // Verify the notification exists
    console.log('\n3. Verifying notification in database...');
    const { data: verifyNotification, error: verifyError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Failed to verify notification:', verifyError);
      return;
    }
    
    console.log('✅ Notification verified in database:', {
      id: verifyNotification.id,
      title: verifyNotification.title,
      read: verifyNotification.read
    });
    
    // Check unread count
    console.log('\n4. Checking unread notification count...');
    const { data: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('recipient_id', testUser.user_id)
      .eq('read', false);
    
    if (countError) {
      console.error('❌ Failed to get unread count:', countError);
    } else {
      console.log(`✅ Unread notifications count: ${unreadCount.length || 0}`);
    }
    
    console.log('\n🎉 Direct notification test completed!');
    console.log('\n📋 What should happen:');
    console.log('   1. ✅ Notification was inserted into database');
    console.log('   2. 🔄 Database trigger should have fired (pg_notify)');
    console.log('   3. 📡 Ably should receive the notification via webhook');
    console.log('   4. 🔔 Frontend should update notification count in real-time');
    
    console.log('\n💡 To test the frontend:');
    console.log('   - Open http://localhost:3000 in your browser');
    console.log(`   - Log in as user: ${testUser.username}`);
    console.log('   - Check if notification badge shows updated count');
    console.log('   - Open notification modal to see the test notification');
    
  } catch (error) {
    console.error('❌ Error in direct notification test:', error);
  }
}

testDirectNotification();