require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCurrentReviewData() {
  console.log('Testing current review data structure...')
  
  const restaurantId = 'a5cd0d41-9941-4c3c-a703-b5d9afb2e695'
  
  try {
    // First, check if there are any profiles at all
    const { data: allProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
    
    console.log('Total profiles in database:', allProfiles?.length || 0)
    if (allProfiles && allProfiles.length > 0) {
      console.log('First profile:', JSON.stringify(allProfiles[0], null, 2))
    }
    
    // Check reviews without join first
    const { data: reviewsOnly, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_public', true)
    
    console.log('\n=== Reviews without join ===')
    console.log('Found reviews:', reviewsOnly?.length || 0)
    if (reviewsOnly && reviewsOnly.length > 0) {
      console.log('First review user_id:', reviewsOnly[0].user_id)
      
      // Check if there's a profile for this user_id
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', reviewsOnly[0].user_id)
      
      console.log('Profile for this user:', JSON.stringify(userProfile, null, 2))
    }
    
    // Test the exact query from the review service
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
      .eq('restaurant_id', restaurantId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Query error:', error)
      return
    }

    console.log(`\n=== Reviews with join ===`)
    console.log(`Found ${data?.length || 0} reviews`)
    
    if (data && data.length > 0) {
      console.log('\n=== First Review Data Structure ===')
      console.log('Review ID:', data[0].id)
      console.log('User ID:', data[0].user_id)
      console.log('Rating:', data[0].rating)
      console.log('Review Text:', data[0].review_text)
      console.log('\n=== Profile Data ===')
      console.log('Profiles object:', JSON.stringify(data[0].profiles, null, 2))
      console.log('Profiles exists?', !!data[0].profiles)
      console.log('Profiles type:', typeof data[0].profiles)
      
      // Test the mapping logic from the service
      const mappedReview = {
        ...data[0],
        user: data[0].profiles ? {
          id: data[0].profiles.user_id,
          username: data[0].profiles.username,
          full_name: data[0].profiles.full_name,
          profile_image_url: data[0].profiles.profile_image_url,
          is_verified: data[0].profiles.is_verified
        } : undefined
      }
      
      console.log('\n=== Mapped User Data ===')
      console.log('Mapped user object:', mappedReview.user)
      console.log('Username:', mappedReview.user?.username)
      console.log('Full name:', mappedReview.user?.full_name)
      
      // Test the UI display logic
      const displayName = mappedReview.user?.full_name || mappedReview.user?.username || 'Anonymous User'
      console.log('\n=== UI Display Logic ===')
      console.log('Display name would be:', displayName)
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testCurrentReviewData()