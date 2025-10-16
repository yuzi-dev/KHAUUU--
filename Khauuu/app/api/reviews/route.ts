import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurant_id')
    const foodId = searchParams.get('food_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const offset = (page - 1) * limit

    // Get user from authorization header
    const authHeader = request.headers.get('authorization')
    let currentUserId: string | null = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { user } } = await supabase.auth.getUser(token)
        currentUserId = user?.id || null
      } catch (error) {
        console.error('Error getting user from token:', error)
      }
    }

    // Build query based on filters
    let query = supabaseServer
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
      .range(offset, offset + limit - 1)

    if (restaurantId && !foodId) {
      // For restaurant reviews, only get reviews where food_id is null
      query = query.eq('restaurant_id', restaurantId).is('food_id', null)
    } else if (restaurantId && foodId) {
      // For food reviews, get reviews for specific food
      query = query.eq('restaurant_id', restaurantId).eq('food_id', foodId)
    } else if (foodId) {
      // For food reviews without restaurant filter
      query = query.eq('food_id', foodId)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    // Get user likes if user is authenticated
    let userLikes: Set<string> = new Set()
    if (currentUserId && reviews && reviews.length > 0) {
      const reviewIds = reviews.map(review => review.id)
      const { data: likes } = await supabaseServer
        .from('review_likes')
        .select('review_id')
        .eq('user_id', currentUserId)
        .in('review_id', reviewIds)
        .not('review_id', 'is', null) // Ensure we only get review likes, not reply likes
      
      if (likes) {
        userLikes = new Set(likes.map(like => like.review_id))
      }
    }

    // Format reviews with proper structure
    const formattedReviews = reviews?.map(review => ({
      id: review.id,
      user: {
        id: review.profiles.user_id,
        username: review.profiles.username,
        full_name: review.profiles.full_name,
        profile_image_url: review.profiles.profile_image_url,
        is_verified: review.profiles.is_verified
      },
      restaurant: review.restaurants ? {
        id: review.restaurants.id,
        name: review.restaurants.name,
        image_url: review.restaurants.cover_images && review.restaurants.cover_images.length > 0 ? review.restaurants.cover_images[0] : null
      } : null,
      food: review.foods ? {
        id: review.foods.id,
        name: review.foods.name,
        image_url: review.foods.images && review.foods.images.length > 0 ? review.foods.images[0] : null
      } : null,
      rating: review.rating,
      review_text: review.review_text,
      likes_count: review.likes_count || 0,
      comments_count: review.comments_count || 0,
      user_liked: userLikes.has(review.id),
      created_at: review.created_at,
      updated_at: review.updated_at
    })) || []

    return NextResponse.json({
      success: true,
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        has_more: formattedReviews.length === limit
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { restaurant_id, food_id, rating, review_text } = body

    // Validation
    if (!restaurant_id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (!review_text || review_text.trim().length === 0) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 })
    }

    // Check if user already reviewed this restaurant/food combination
    const { data: existingReview } = await supabaseServer
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurant_id)
      .eq('food_id', food_id || null)
      .single()

    if (existingReview) {
      return NextResponse.json({ 
        error: 'You have already reviewed this item' 
      }, { status: 400 })
    }

    // Verify restaurant exists
    const { data: restaurant, error: restaurantError } = await supabaseServer
      .from('restaurants')
      .select('id')
      .eq('id', restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Verify food exists if food_id is provided
    if (food_id) {
      const { data: food, error: foodError } = await supabaseServer
        .from('foods')
        .select('id, restaurant_id')
        .eq('id', food_id)
        .single()

      if (foodError || !food) {
        return NextResponse.json({ error: 'Food item not found' }, { status: 404 })
      }

      if (food.restaurant_id !== restaurant_id) {
        return NextResponse.json({ 
          error: 'Food item does not belong to the specified restaurant' 
        }, { status: 400 })
      }
    }

    // Create the review
    const { data: newReview, error: insertError } = await supabaseServer
      .from('reviews')
      .insert({
        user_id: user.id,
        restaurant_id,
        food_id: food_id || null,
        rating,
        review_text: review_text.trim(),
        is_public: true
      })
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
      .single()

    if (insertError) {
      console.error('Error creating review:', insertError)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    // Update restaurant/food rating and review count
    await updateRatingAndCount(restaurant_id, food_id)

    // Format the response
    const formattedReview = {
      id: newReview.id,
      user: {
        id: newReview.profiles.user_id,
        username: newReview.profiles.username,
        full_name: newReview.profiles.full_name,
        profile_image_url: newReview.profiles.profile_image_url,
        is_verified: newReview.profiles.is_verified
      },
      restaurant: newReview.restaurants ? {
        id: newReview.restaurants.id,
        name: newReview.restaurants.name,
        image_url: newReview.restaurants.cover_images && newReview.restaurants.cover_images.length > 0 ? newReview.restaurants.cover_images[0] : null
      } : null,
      food: newReview.foods ? {
        id: newReview.foods.id,
        name: newReview.foods.name,
        image_url: newReview.foods.images && newReview.foods.images.length > 0 ? newReview.foods.images[0] : null
      } : null,
      rating: newReview.rating,
      review_text: newReview.review_text,
      likes_count: newReview.likes_count || 0,
      comments_count: newReview.comments_count || 0,
      created_at: newReview.created_at,
      updated_at: newReview.updated_at
    }

    return NextResponse.json({
      success: true,
      review: formattedReview
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to update rating and review count
async function updateRatingAndCount(restaurantId: string, foodId?: string) {
  try {
    // Update restaurant rating and count (exclude food reviews)
    const { data: restaurantReviews } = await supabaseServer
      .from('reviews')
      .select('rating')
      .eq('restaurant_id', restaurantId)
      .eq('is_public', true)
      .is('food_id', null)  // Only count restaurant reviews, not food reviews

    if (restaurantReviews && restaurantReviews.length > 0) {
      const avgRating = restaurantReviews.reduce((sum, review) => sum + review.rating, 0) / restaurantReviews.length
      
      await supabaseServer
        .from('restaurants')
        .update({
          rating: Math.round(avgRating * 100) / 100, // Round to 2 decimal places
          review_count: restaurantReviews.length
        })
        .eq('id', restaurantId)
    }

    // Update food rating and count if food_id is provided
    if (foodId) {
      const { data: foodReviews } = await supabaseServer
        .from('reviews')
        .select('rating')
        .eq('food_id', foodId)
        .eq('is_public', true)

      if (foodReviews && foodReviews.length > 0) {
        const avgRating = foodReviews.reduce((sum, review) => sum + review.rating, 0) / foodReviews.length
        
        await supabaseServer
          .from('foods')
          .update({
            rating: Math.round(avgRating * 100) / 100,
            review_count: foodReviews.length
          })
          .eq('id', foodId)
      }
    }
  } catch (error) {
    console.error('Error updating rating and count:', error)
  }
}