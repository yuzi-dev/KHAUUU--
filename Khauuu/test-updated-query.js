const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUpdatedQuery() {
  console.log('Testing updated review query (without inner join)...');
  
  const restaurantId = 'a5cd0d41-9941-4c3c-a703-b5d9afb2e695';
  console.log('Restaurant ID:', restaurantId);
  
  // Test the updated query from the service (without inner join)
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
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Query error:', error);
  } else {
    console.log('Query successful!');
    console.log('Number of reviews found:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('Review data structure:');
      data.forEach((review, index) => {
        console.log(`Review ${index + 1}:`);
        console.log('  ID:', review.id);
        console.log('  Rating:', review.rating);
        console.log('  Review Text:', review.review_text);
        console.log('  User ID:', review.user_id);
        console.log('  Profile data:', review.profiles);
        console.log('  Created at:', review.created_at);
        console.log('---');
      });
    }
  }
}

testUpdatedQuery().catch(console.error);