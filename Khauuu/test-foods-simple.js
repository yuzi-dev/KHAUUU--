const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Try to use service role key if available, otherwise use anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFoodsQuery() {
  console.log('Testing foods table access...');
  
  try {
    // Test basic foods query without joins first
    console.log('1. Testing basic foods query...');
    const { data: basicFoods, error: basicError } = await supabase
      .from('foods')
      .select('id, name, is_featured, is_available')
      .limit(5);
      
    if (basicError) {
      console.error('Basic foods query error:', basicError);
      return;
    }
    
    console.log('Basic foods query successful. Found', basicFoods?.length || 0, 'foods');
    if (basicFoods && basicFoods.length > 0) {
      console.log('Sample food:', basicFoods[0]);
    }
    
    // Test featured foods specifically
    console.log('2. Testing featured foods query...');
    const { data: featuredFoods, error: featuredError } = await supabase
      .from('foods')
      .select('id, name, is_featured, is_available')
      .eq('is_featured', true)
      .limit(5);
      
    if (featuredError) {
      console.error('Featured foods query error:', featuredError);
      return;
    }
    
    console.log('Featured foods query successful. Found', featuredFoods?.length || 0, 'featured foods');
    if (featuredFoods && featuredFoods.length > 0) {
      console.log('Sample featured food:', featuredFoods[0]);
    }
    
    // Test restaurants table
    console.log('3. Testing restaurants query...');
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name')
      .limit(3);
      
    if (restaurantError) {
      console.error('Restaurants query error:', restaurantError);
      return;
    }
    
    console.log('Restaurants query successful. Found', restaurants?.length || 0, 'restaurants');
    
    // Test the join query that's failing
    console.log('4. Testing foods with restaurants join...');
    const { data: joinedData, error: joinError } = await supabase
      .from('foods')
      .select(`
        id,
        name,
        is_featured,
        is_available,
        restaurants (
          id,
          name,
          cuisine
        )
      `)
      .eq('is_featured', true)
      .eq('is_available', true)
      .limit(3);
      
    if (joinError) {
      console.error('Join query error:', joinError);
    } else {
      console.log('Join query successful. Found', joinedData?.length || 0, 'items');
      if (joinedData && joinedData.length > 0) {
        console.log('Sample joined result:', JSON.stringify(joinedData[0], null, 2));
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testFoodsQuery();