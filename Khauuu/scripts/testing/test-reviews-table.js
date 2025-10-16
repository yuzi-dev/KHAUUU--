const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
      process.env[key.trim()] = value.trim();
    }
  });
  
  return env;
}

async function testReviewsTable() {
  console.log('Testing reviews table existence...');
  
  const env = loadEnv();
  
  // Create admin client
  const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Try to query the reviews table directly
    console.log('Checking if reviews table exists...');
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .limit(1);

    if (reviewsError) {
      console.error('❌ Reviews table does not exist or is not accessible:', reviewsError);
    } else {
      console.log('✅ Reviews table exists and is accessible');
      console.log('Reviews count:', reviews.length);
    }

    // Check if restaurants table exists (needed for the join)
    console.log('Checking if restaurants table exists...');
    const { data: restaurants, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .limit(1);

    if (restaurantError) {
      console.error('❌ Restaurants table does not exist or is not accessible:', restaurantError);
    } else {
      console.log('✅ Restaurants table exists and is accessible');
      console.log('Restaurants count:', restaurants.length);
    }

    // Check if foods table exists (needed for the join)
    console.log('Checking if foods table exists...');
    const { data: foods, error: foodError } = await supabaseAdmin
      .from('foods')
      .select('*')
      .limit(1);

    if (foodError) {
      console.error('❌ Foods table does not exist or is not accessible:', foodError);
    } else {
      console.log('✅ Foods table exists and is accessible');
      console.log('Foods count:', foods.length);
    }

    // Test the exact query from the API
    if (!reviewsError) {
      console.log('Testing the exact API query...');
      const { data: testReviews, error: testError } = await supabaseAdmin
        .from('reviews')
        .select(`
          *,
          restaurants (
            id,
            name,
            image_url
          ),
          foods (
            id,
            name,
            image_url
          )
        `)
        .limit(1);

      if (testError) {
        console.error('❌ API query test failed:', testError);
      } else {
        console.log('✅ API query test successful');
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testReviewsTable();