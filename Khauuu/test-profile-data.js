require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileData() {
  console.log('Testing profile data for review user...');
  
  // First, get the review and its user_id
  const { data: reviews, error: reviewError } = await supabase
    .from('reviews')
    .select('id, user_id, review_text, rating')
    .eq('restaurant_id', 'a5cd0d41-9941-4c3c-a703-b5d9afb2e695')
    .limit(1);

  if (reviewError) {
    console.error('Error fetching review:', reviewError);
    return;
  }

  if (!reviews || reviews.length === 0) {
    console.log('No reviews found');
    return;
  }

  const review = reviews[0];
  console.log('Review found:');
  console.log('  Review ID:', review.id);
  console.log('  User ID:', review.user_id);
  console.log('  Review Text:', review.review_text);
  console.log('  Rating:', review.rating);

  // Now check if there's a profile for this user_id
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', review.user_id);

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return;
  }

  console.log('\nProfile data for this user:');
  if (!profiles || profiles.length === 0) {
    console.log('  NO PROFILE FOUND - This is the issue!');
    
    // Check if the user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(review.user_id);
    
    if (authError) {
      console.error('  Error checking auth user:', authError);
    } else if (authUser.user) {
      console.log('  Auth user exists:', {
        id: authUser.user.id,
        email: authUser.user.email,
        created_at: authUser.user.created_at
      });
      console.log('  SOLUTION: Need to create a profile for this user');
    } else {
      console.log('  Auth user does not exist either');
    }
  } else {
    console.log('  Profile found:', {
      id: profiles[0].id,
      username: profiles[0].username,
      full_name: profiles[0].full_name,
      created_at: profiles[0].created_at
    });
  }
}

testProfileData().catch(console.error);