const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNotificationsAPI() {
  console.log('=== Testing Notifications API Fix ===');
  
  try {
    // First, let's test the new function directly
    console.log('\n1. Testing get_notifications_with_sender function...');
    
    // Get a test user
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, username')
      .limit(1);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('No users found in profiles table');
      return;
    }
    
    const testUser = users[0];
    console.log(`Using test user: ${testUser.username} (${testUser.user_id})`);
    
    // Test the function
    const { data: notifications, error: notificationsError } = await supabase
      .rpc('get_notifications_with_sender', {
        user_id: testUser.user_id,
        limit_count: 5,
        offset_count: 0,
        unread_only: false
      });
    
    if (notificationsError) {
      console.error('Error calling get_notifications_with_sender:', notificationsError);
      return;
    }
    
    console.log(`✓ Function call successful! Found ${notifications?.length || 0} notifications`);
    
    if (notifications && notifications.length > 0) {
      console.log('\nSample notification:');
      const sample = notifications[0];
      console.log({
        id: sample.id,
        type: sample.type,
        title: sample.title,
        sender_username: sample.sender_username,
        sender_full_name: sample.sender_full_name,
        created_at: sample.created_at
      });
    }
    
    // Now test the API endpoint
    console.log('\n2. Testing API endpoint...');
    
    // Get an auth token for the test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // This might not work, but let's try
      password: 'testpassword'
    });
    
    if (authError) {
      console.log('Could not authenticate test user for API test');
      console.log('But the database function test was successful!');
      return;
    }
    
    const token = authData.session?.access_token;
    
    if (!token) {
      console.log('No token available for API test');
      console.log('But the database function test was successful!');
      return;
    }
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/notifications?limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const apiResult = await response.json();
    console.log('✓ API endpoint successful!');
    console.log(`Found ${apiResult.notifications?.length || 0} notifications via API`);
    
    if (apiResult.notifications && apiResult.notifications.length > 0) {
      console.log('\nSample API notification:');
      const sample = apiResult.notifications[0];
      console.log({
        id: sample.id,
        type: sample.type,
        title: sample.title,
        user: sample.user,
        timestamp: sample.timestamp
      });
    }
    
    console.log('\n✅ All tests passed! The notifications foreign key issue has been resolved.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testNotificationsAPI();