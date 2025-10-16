require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUnreadCount() {
  try {
    console.log('Testing unread count functionality...\n');

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, username, full_name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log('Found users:', users.length);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.full_name}) - ID: ${user.user_id}`);
    });
    console.log();

    // Test unread count for each user
    for (const user of users) {
      console.log(`Testing unread count for ${user.username}...`);
      
      const { data: unreadCount, error } = await supabase.rpc('get_unread_message_count', {
        p_user_id: user.user_id
      });

      if (error) {
        console.error(`Error getting unread count for ${user.username}:`, error);
      } else {
        console.log(`Unread count for ${user.username}: ${unreadCount || 0}`);
      }
      console.log();
    }

    // Test the API endpoint directly
    console.log('Testing API endpoint...');
    
    // Get a user token for testing
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`Testing API with user: ${testUser.username}`);
      
      // Create a session for the user (this is a simplified test)
      const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `${testUser.username}@test.com`, // This won't work in real scenario
        options: {
          redirectTo: 'http://localhost:3001'
        }
      });

      if (authError) {
        console.log('Note: Cannot test API endpoint without proper authentication');
        console.log('The unread count functionality should work when users are properly authenticated');
      }
    }

  } catch (error) {
    console.error('Error in test:', error);
  }
}

testUnreadCount();