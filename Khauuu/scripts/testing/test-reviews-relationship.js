const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testReviewsRelationship() {
  try {
    console.log('🔍 Testing reviews-profiles relationship...\n');
    
    // Test 1: Check if we can query reviews table
    console.log('1. Testing reviews table access...');
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, user_id, review_text')
      .limit(3);
    
    if (reviewsError) {
      console.error('❌ Reviews table error:', reviewsError);
      return;
    }
    
    console.log(`✅ Found ${reviews.length} reviews`);
    if (reviews.length > 0) {
      console.log('Sample review:', reviews[0]);
    }
    
    // Test 2: Check if we can query profiles table
    console.log('\n2. Testing profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, full_name')
      .limit(3);
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError);
      return;
    }
    
    console.log(`✅ Found ${profiles.length} profiles`);
    if (profiles.length > 0) {
      console.log('Sample profile:', profiles[0]);
    }
    
    // Test 3: Try the join that's failing in the API
    console.log('\n3. Testing the problematic join...');
    const { data: joinedData, error: joinError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        review_text,
        profiles!inner (
          user_id,
          username,
          full_name
        )
      `)
      .limit(1);
    
    if (joinError) {
      console.error('❌ Join failed:', joinError);
      console.log('\n🔧 Trying alternative approach...');
      
      // Test 4: Try manual join approach
      if (reviews.length > 0) {
        const reviewUserId = reviews[0].user_id;
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name')
          .eq('user_id', reviewUserId)
          .single();
        
        if (userError) {
          console.error('❌ Manual join failed:', userError);
        } else {
          console.log('✅ Manual join works:', {
            review: reviews[0],
            profile: userProfile
          });
        }
      }
    } else {
      console.log('✅ Join successful!', joinedData);
    }
    
    // Test 5: Check foreign key constraints
    console.log('\n4. Checking foreign key constraints...');
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, table_name, constraint_type')
      .eq('table_name', 'reviews')
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (constraintError) {
      console.log('Could not check constraints:', constraintError.message);
    } else {
      console.log('Foreign key constraints on reviews table:', constraints);
    }
    
    // Test 6: Try creating a test review
    console.log('\n5. Testing review creation...');
    
    if (profiles.length > 0) {
      const testUserId = profiles[0].user_id;
      
      // First check if we have any restaurants
      const { data: restaurants, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name')
        .limit(1);
      
      if (restaurantError || !restaurants || restaurants.length === 0) {
        console.log('❌ No restaurants found for testing');
        return;
      }
      
      const testReview = {
        user_id: testUserId,
        restaurant_id: restaurants[0].id,
        rating: 5,
        review_text: 'Test review for relationship testing',
        is_public: true
      };
      
      const { data: newReview, error: createError } = await supabase
        .from('reviews')
        .insert(testReview)
        .select(`
          id,
          rating,
          review_text,
          profiles!inner (
            user_id,
            username,
            full_name
          )
        `)
        .single();
      
      if (createError) {
        console.error('❌ Test review creation failed:', createError);
      } else {
        console.log('✅ Test review created successfully:', newReview);
        
        // Clean up - delete the test review
        await supabase
          .from('reviews')
          .delete()
          .eq('id', newReview.id);
        
        console.log('🧹 Test review cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testReviewsRelationship();