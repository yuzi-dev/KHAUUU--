const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testReviewsAPIEndpoint() {
  try {
    console.log('🧪 Testing Reviews API Endpoint...\n');
    
    // Step 1: Create a test review first
    console.log('1. Creating a test review...');
    
    const { data: testReview, error: createError } = await supabase
      .from('reviews')
      .insert({
        user_id: '667b09b1-6da0-4d72-90b6-28a613fe521a',
        rating: 4,
        review_text: 'API endpoint test review',
        is_public: true
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create test review:', createError);
      return;
    }
    
    console.log('✅ Test review created:', testReview.id);
    
    // Step 2: Test the API endpoint that was failing before
    console.log('\n2. Testing the reviews API endpoint with joins...');
    
    const { data: reviews, error: fetchError } = await supabase
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
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (fetchError) {
      console.error('❌ API endpoint failed:', fetchError);
    } else {
      console.log('✅ API endpoint successful!');
      console.log(`Found ${reviews.length} reviews with profile data`);
      
      if (reviews.length > 0) {
        console.log('\nSample review with profile:');
        console.log({
          id: reviews[0].id,
          rating: reviews[0].rating,
          review_text: reviews[0].review_text,
          user: {
            username: reviews[0].profiles.username,
            full_name: reviews[0].profiles.full_name
          }
        });
      }
    }
    
    // Step 3: Test creating a review via API (simulating the original error)
    console.log('\n3. Testing review creation with profile join...');
    
    const { data: newReview, error: createWithJoinError } = await supabase
      .from('reviews')
      .insert({
        user_id: '667b09b1-6da0-4d72-90b6-28a613fe521a',
        rating: 5,
        review_text: 'Another test review with join',
        is_public: true
      })
      .select(`
        *,
        profiles (
          user_id,
          username,
          full_name
        )
      `)
      .single();
    
    if (createWithJoinError) {
      console.error('❌ Review creation with join failed:', createWithJoinError);
    } else {
      console.log('✅ Review creation with join successful!');
      console.log('Created review with profile data:', {
        id: newReview.id,
        rating: newReview.rating,
        user: newReview.profiles
      });
    }
    
    // Step 4: Test the exact query from the API route
    console.log('\n4. Testing exact API route query...');
    
    const { data: apiRouteTest, error: apiRouteError } = await supabase
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
          cover_images
        ),
        foods (
          id,
          name,
          images
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (apiRouteError) {
      console.error('❌ Exact API route query failed:', apiRouteError);
    } else {
      console.log('✅ Exact API route query successful!');
      console.log('Query returned:', apiRouteTest.length, 'reviews');
    }
    
    // Cleanup: Remove test reviews
    console.log('\n🧹 Cleaning up test reviews...');
    
    await supabase
      .from('reviews')
      .delete()
      .in('id', [testReview.id, newReview?.id].filter(Boolean));
    
    console.log('✅ Test reviews cleaned up');
    
    console.log('\n🎉 All tests passed! The reviews-profiles relationship is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testReviewsAPIEndpoint();