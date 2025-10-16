const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testQuery() {
  console.log('Testing featured foods query...');
  
  // First, check if there are any featured foods
  const { data: featuredCount, error: countError } = await supabase
    .from('foods')
    .select('id, name, is_featured')
    .eq('is_featured', true);
    
  if (countError) {
    console.error('Error checking featured foods:', countError);
    return;
  }
  
  console.log('Featured foods found:', featuredCount?.length || 0);
  if (featuredCount && featuredCount.length > 0) {
    console.log('Sample featured food:', featuredCount[0]);
  }
  
  // Test the actual query from getPopular
  const { data, error } = await supabase
    .from('foods')
    .select(`
      *,
      restaurants!inner (
        id,
        name,
        cuisine,
        address,
        phone,
        rating,
        review_count,
        price_range,
        images,
        cover_images,
        opening_hours,
        is_open
      )
    `)
    .eq('is_available', true)
    .eq('is_featured', true)
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error in getPopular query:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  } else {
    console.log('Query successful, found', data?.length || 0, 'items');
    if (data && data.length > 0) {
      console.log('Sample result:', JSON.stringify(data[0], null, 2));
    }
  }
}

testQuery().catch(console.error);