const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFollowRequestFlow() {
  try {
    console.log('Testing follow request flow...');
    
    // Step 1: Find two test users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, username, full_name')
      .limit(2);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    if (!users || users.length < 2) {
      console.log('Need at least 2 users to test follow requests');
      return;
    }
    
    const follower = users[0];
    const followed = users[1];
    
    console.log(`Follower: ${follower.username} (${follower.user_id})`);
    console.log(`Followed: ${followed.username} (${followed.user_id})`);
    
    // Step 2: Create a follow request
    console.log('\nCreating follow request...');
    const { data: followRequest, error: createError } = await supabase
      .from('follows')
      .insert({
        follower_user_id: follower.user_id,
        followed_user_id: followed.user_id,
        status: 'pending'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating follow request:', createError);
      return;
    }
    
    console.log('Follow request created:', followRequest);
    
    // Step 3: Test the API endpoint to fetch follow requests
    console.log('\nTesting GET /api/follows/requests...');
    
    // Note: This would normally require authentication
    // For testing purposes, we'll check the database directly
    const { data: requests, error: fetchError } = await supabase
      .from('follows')
      .select(`
        id,
        follower_user_id,
        created_at,
        status,
        profiles!follows_follower_user_id_fkey (
          user_id,
          username,
          full_name,
          profile_image_url
        )
      `)
      .eq('followed_user_id', followed.user_id)
      .eq('status', 'pending');
    
    if (fetchError) {
      console.error('Error fetching follow requests:', fetchError);
    } else {
      console.log('Pending follow requests:', requests);
    }
    
    // Step 4: Test accepting the follow request
    console.log('\nTesting accept follow request...');
    const { error: acceptError } = await supabase
      .from('follows')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', followRequest.id);
    
    if (acceptError) {
      console.error('Error accepting follow request:', acceptError);
    } else {
      console.log('Follow request accepted successfully');
    }
    
    // Step 5: Verify the status change
    const { data: updatedRequest, error: verifyError } = await supabase
      .from('follows')
      .select('*')
      .eq('id', followRequest.id)
      .single();
    
    if (verifyError) {
      console.error('Error verifying follow request:', verifyError);
    } else {
      console.log('Updated follow request:', updatedRequest);
    }
    
    // Cleanup: Remove the test follow request
    console.log('\nCleaning up test data...');
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('id', followRequest.id);
    
    if (deleteError) {
      console.error('Error cleaning up:', deleteError);
    } else {
      console.log('Test data cleaned up successfully');
    }
    
    console.log('\n✅ Follow request flow test completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testFollowRequestFlow();