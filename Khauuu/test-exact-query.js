require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExactQuery() {
  console.log('Testing exact query from review service...');
  
  // This is the exact query from the review service
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (
        user_id,
        username,
        full_name,
        profile_image_url,
        is_verified
      ),
      restaurants (
        id,
        name,
        cuisine,
        address,
        cover_images
      ),
      foods (
        id,
        name,
        price,
        category,
        images
      )
    `)
    .eq('is_public', true)
    .eq('restaurant_id', 'a5cd0d41-9941-4c3c-a703-b5d9afb2e695')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Query successful!');
  console.log('Number of reviews found:', data?.length || 0);
  
  if (data && data.length > 0) {
    console.log('\nFirst review data structure:');
    console.log('Review ID:', data[0].id);
    console.log('User ID:', data[0].user_id);
    console.log('Rating:', data[0].rating);
    console.log('Review Text:', data[0].review_text);
    console.log('Profiles data:', JSON.stringify(data[0].profiles, null, 2));
    console.log('Restaurants data:', JSON.stringify(data[0].restaurants, null, 2));
    console.log('Foods data:', JSON.stringify(data[0].foods, null, 2));
    
    // Test the mapping logic
    const review = data[0];
    const mappedUser = review.profiles ? {
      id: review.profiles.user_id,
      username: review.profiles.username,
      full_name: review.profiles.full_name,
      profile_image_url: review.profiles.profile_image_url,
      is_verified: review.profiles.is_verified
    } : undefined;
    
    console.log('\nMapped user data:', JSON.stringify(mappedUser, null, 2));
    console.log('Would show as Anonymous User?', !mappedUser);
  }
}

testExactQuery().catch(console.error);