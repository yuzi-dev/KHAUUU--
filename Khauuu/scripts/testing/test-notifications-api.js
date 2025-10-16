const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNotificationsAPI() {
  console.log('=== Testing Notifications API ===');
  
  try {
    // Test 1: Call the function directly
    console.log('\n1. Testing get_notifications_with_sender function directly...');
    
    // Get a test user
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, username')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.error('Error getting test user:', usersError);
      return;
    }
    
    const testUserId = users[0].user_id;
    console.log(`Using test user: ${users[0].username} (${testUserId})`);
    
    // Call the function
    const { data: notifications, error: notificationsError } = await supabase
      .rpc('get_notifications_with_sender', {
        target_user_id: testUserId,
        limit_count: 5,
        offset_count: 0,
        unread_only: false
      });
    
    if (notificationsError) {
      console.error('Error calling function:', notificationsError);
    } else {
      console.log(`✓ Function call successful! Found ${notifications?.length || 0} notifications`);
      if (notifications && notifications.length > 0) {
        console.log('Sample notification:', JSON.stringify(notifications[0], null, 2));
      }
    }
    
    // Test 2: Test the API endpoint
    console.log('\n2. Testing API endpoint...');
    
    // Get user auth token (we'll use service key for this test)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // This won't work, but let's see what happens
      password: 'test'
    });
    
    if (authError) {
      console.log('Cannot test API endpoint without valid auth token');
      console.log('But the function test above should indicate if the core functionality works');
    }
    
    // Test 3: Check if notifications table has data
    console.log('\n3. Checking notifications table...');
    
    const { data: allNotifications, error: allNotificationsError } = await supabase
      .from('notifications')
      .select('id, type, title, recipient_id, sender_id, created_at')
      .limit(5);
    
    if (allNotificationsError) {
      console.error('Error querying notifications table:', allNotificationsError);
    } else {
      console.log(`✓ Found ${allNotifications?.length || 0} notifications in table`);
      if (allNotifications && allNotifications.length > 0) {
        console.log('Sample notification from table:', JSON.stringify(allNotifications[0], null, 2));
      }
    }
    
    // Test 4: Check profiles table
    console.log('\n4. Checking profiles table...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, full_name')
      .limit(3);
    
    if (profilesError) {
      console.error('Error querying profiles table:', profilesError);
    } else {
      console.log(`✓ Found ${profiles?.length || 0} profiles in table`);
      profiles?.forEach(profile => {
        console.log(`  - ${profile.username} (${profile.user_id})`);
      });
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testNotificationsAPI();