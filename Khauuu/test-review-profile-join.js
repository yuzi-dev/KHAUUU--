const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testReviewProfileJoin() {
  console.log('Testing review-profile join issues...\n');

  try {
    // First, let's check all reviews for a specific restaurant
    console.log('1. Checking all reviews in the database:');
    const { data: allReviews, error: allReviewsError } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (allReviewsError) {
      console.error('Error fetching all reviews:', allReviewsError);
      return;
    }

    console.log(`Found ${allReviews?.length || 0} total reviews`);
    
    if (allReviews && allReviews.length > 0) {
      console.log('Sample reviews:');
      allReviews.slice(0, 3).forEach(review => {
        console.log(`- Review ID: ${review.id}, User ID: ${review.user_id}, Restaurant ID: ${review.restaurant_id}, Text: "${review.review_text?.substring(0, 50)}..."`);
      });
    }

    // Check reviews with INNER JOIN (current implementation)
    console.log('\n2. Checking reviews with INNER JOIN (current implementation):');
    const { data: innerJoinReviews, error: innerJoinError } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles!inner (
          user_id,
          username,
          full_name,
          profile_image_url,
          is_verified
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (innerJoinError) {
      console.error('Error with INNER JOIN:', innerJoinError);
    } else {
      console.log(`Found ${innerJoinReviews?.length || 0} reviews with INNER JOIN`);
    }

    // Check reviews with LEFT JOIN (should include all reviews)
    console.log('\n3. Checking reviews with LEFT JOIN (should include all reviews):');
    const { data: leftJoinReviews, error: leftJoinError } = await supabase
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
      .order('created_at', { ascending: false });

    if (leftJoinError) {
      console.error('Error with LEFT JOIN:', leftJoinError);
    } else {
      console.log(`Found ${leftJoinReviews?.length || 0} reviews with LEFT JOIN`);
      
      if (leftJoinReviews && leftJoinReviews.length > 0) {
        console.log('Sample reviews with LEFT JOIN:');
        leftJoinReviews.slice(0, 3).forEach(review => {
          console.log(`- Review ID: ${review.id}, User ID: ${review.user_id}, Profile: ${review.profiles ? 'Found' : 'Missing'}, Text: "${review.review_text?.substring(0, 50)}..."`);
        });
      }
    }

    // Check for orphaned reviews (reviews without matching profiles)
    console.log('\n4. Checking for orphaned reviews (reviews without matching profiles):');
    const { data: orphanedReviews, error: orphanedError } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles (
          user_id,
          username,
          full_name
        )
      `)
      .is('profiles.user_id', null)
      .eq('is_public', true);

    if (orphanedError) {
      console.error('Error checking orphaned reviews:', orphanedError);
    } else {
      console.log(`Found ${orphanedReviews?.length || 0} orphaned reviews`);
      if (orphanedReviews && orphanedReviews.length > 0) {
        console.log('Orphaned reviews:');
        orphanedReviews.forEach(review => {
          console.log(`- Review ID: ${review.id}, User ID: ${review.user_id}, Restaurant ID: ${review.restaurant_id}`);
        });
      }
    }

    // Check profiles table
    console.log('\n5. Checking profiles table:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, full_name')
      .order('created_at', { ascending: false })
      .limit(5);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else {
      console.log(`Found ${profiles?.length || 0} profiles (showing first 5)`);
      if (profiles && profiles.length > 0) {
        profiles.forEach(profile => {
          console.log(`- Profile User ID: ${profile.user_id}, Username: ${profile.username}, Full Name: ${profile.full_name}`);
        });
      }
    }

    // Test specific restaurant reviews
    console.log('\n6. Testing reviews for a specific restaurant:');
    const restaurantId = allReviews?.[0]?.restaurant_id;
    if (restaurantId) {
      console.log(`Testing restaurant ID: ${restaurantId}`);
      
      const { data: restaurantReviews, error: restaurantReviewsError } = await supabase
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
        .eq('restaurant_id', restaurantId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (restaurantReviewsError) {
        console.error('Error fetching restaurant reviews:', restaurantReviewsError);
      } else {
        console.log(`Found ${restaurantReviews?.length || 0} reviews for restaurant ${restaurantId}`);
        if (restaurantReviews && restaurantReviews.length > 0) {
          restaurantReviews.forEach(review => {
            console.log(`- Review: "${review.review_text?.substring(0, 30)}...", Profile: ${review.profiles ? 'Found' : 'Missing'}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testReviewProfileJoin();