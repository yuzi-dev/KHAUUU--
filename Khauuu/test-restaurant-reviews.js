const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Replicate the exact reviewService.getReviews function
async function getReviews(filters = {}) {
  try {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        profiles!inner (
          id,
          username,
          full_name,
          profile_image_url
        ),
        restaurants (
          id,
          name,
          cover_images
        ),
        foods (
          id,
          name,
          images
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.restaurant_id) {
      query = query.eq('restaurant_id', filters.restaurant_id);
    }
    if (filters.food_id) {
      query = query.eq('food_id', filters.food_id);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getReviews:', error);
    throw error;
  }
}

async function testRestaurantReviews() {
  console.log('Testing restaurant reviews functionality...\n');

  try {
    // First, get all restaurants to find one with reviews
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name')
      .limit(5);

    if (restaurantsError) {
      console.error('Error fetching restaurants:', restaurantsError);
      return;
    }

    console.log('Available restaurants:');
    restaurants.forEach(restaurant => {
      console.log(`- ${restaurant.name} (ID: ${restaurant.id})`);
    });

    // Test with the restaurant that has reviews
    const restaurantId = 'a5cd0d41-9941-4c3c-a703-b5d9afb2e695';
    console.log(`\nTesting reviews for restaurant ID: ${restaurantId}`);

    const reviews = await getReviews({ restaurant_id: restaurantId });
    
    console.log(`Found ${reviews.length} reviews for this restaurant:`);
    
    if (reviews.length > 0) {
      reviews.forEach((review, index) => {
        console.log(`\nReview ${index + 1}:`);
        console.log(`- ID: ${review.id}`);
        console.log(`- Text: "${review.review_text}"`);
        console.log(`- Rating: ${review.rating}/5`);
        console.log(`- User: ${review.profiles?.username || 'Unknown'} (${review.profiles?.full_name || 'No name'})`);
        console.log(`- Restaurant: ${review.restaurants?.name || 'Unknown'}`);
        console.log(`- Created: ${review.created_at}`);
        console.log(`- Is Public: ${review.is_public}`);
      });
    } else {
      console.log('No reviews found for this restaurant.');
      
      // Let's check if there are any reviews at all for this restaurant (without the profile join)
      const { data: rawReviews, error: rawError } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantId);
        
      if (rawError) {
        console.error('Error fetching raw reviews:', rawError);
      } else {
        console.log(`\nRaw reviews (without profile join): ${rawReviews.length}`);
        if (rawReviews.length > 0) {
          console.log('This suggests the issue is with the profile join!');
          rawReviews.forEach(review => {
            console.log(`- Review ID: ${review.id}, User ID: ${review.user_id}, Public: ${review.is_public}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRestaurantReviews();