const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testReviewQuery() {
  console.log('Testing review query directly...');
  
  const restaurantId = 'a5cd0d41-9941-4c3c-a703-b5d9afb2e695';
  console.log('Restaurant ID:', restaurantId);
  
  // First, check if any reviews exist for this restaurant
  const { data: allReviews, error: allError } = await supabase
    .from('reviews')
    .select('*')
    .eq('restaurant_id', restaurantId);
    
  console.log('All reviews for restaurant (without joins):', allReviews?.length || 0);
  if (allError) {
    console.error('Error fetching all reviews:', allError);
  }
  
  // Test the exact query from the service
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles!inner (
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
    console.log('Number of reviews found with joins:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('First review data:', JSON.stringify(data[0], null, 2));
    }
  }
  
  // Test without the inner join to see if that's the issue
  const { data: dataWithoutInner, error: errorWithoutInner } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (
        user_id,
        username,
        full_name,
        profile_image_url,
        is_verified
      )
    `)
    .eq('is_public', true)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
    
  if (errorWithoutInner) {
    console.error('Query error without inner join:', errorWithoutInner);
  } else {
    console.log('Query without inner join successful!');
    console.log('Number of reviews found without inner join:', dataWithoutInner?.length || 0);
  }
}

testReviewQuery().catch(console.error);