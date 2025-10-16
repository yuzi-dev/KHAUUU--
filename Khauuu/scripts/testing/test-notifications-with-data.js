const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNotificationsWithData() {
  console.log('=== Testing Notifications Function with User Who Has Notifications ===');
  
  try {
    // Get the user who has notifications (recipient_id from the sample notification)
    const recipientUserId = '0acff238-6893-4c23-92ed-b3ec78674379'; // laughattack496
    
    console.log(`\nTesting with user ID: ${recipientUserId}`);
    
    // Call the function
    const { data: notifications, error: notificationsError } = await supabase
      .rpc('get_notifications_with_sender', {
        target_user_id: recipientUserId,
        limit_count: 5,
        offset_count: 0,
        unread_only: false
      });
    
    if (notificationsError) {
      console.error('Error calling function:', notificationsError);
    } else {
      console.log(`✓ Function call successful! Found ${notifications?.length || 0} notifications`);
      if (notifications && notifications.length > 0) {
        console.log('\nNotification with sender info:');
        notifications.forEach((notification, index) => {
          console.log(`\n--- Notification ${index + 1} ---`);
          console.log(`ID: ${notification.id}`);
          console.log(`Type: ${notification.type}`);
          console.log(`Title: ${notification.title}`);
          console.log(`Sender ID: ${notification.sender_id}`);
          console.log(`Sender Username: ${notification.sender_username}`);
          console.log(`Sender Full Name: ${notification.sender_full_name}`);
          console.log(`Sender Profile Image: ${notification.sender_profile_image_url}`);
          console.log(`Read: ${notification.read}`);
          console.log(`Created: ${notification.created_at}`);
        });
      }
    }
    
    // Test unread_only filter
    console.log('\n=== Testing unread_only filter ===');
    
    const { data: unreadNotifications, error: unreadError } = await supabase
      .rpc('get_notifications_with_sender', {
        target_user_id: recipientUserId,
        limit_count: 5,
        offset_count: 0,
        unread_only: true
      });
    
    if (unreadError) {
      console.error('Error calling function with unread_only:', unreadError);
    } else {
      console.log(`✓ Unread filter successful! Found ${unreadNotifications?.length || 0} unread notifications`);
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testNotificationsWithData();