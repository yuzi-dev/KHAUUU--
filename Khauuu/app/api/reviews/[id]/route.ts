import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
    }

    // Fetch review with user and restaurant/food details
    const { data: review, error } = await supabaseServer
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
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (error || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Format the review
    const formattedReview = {
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
      created_at: review.created_at,
      updated_at: review.updated_at
    }

    return NextResponse.json({
      success: true,
      review: formattedReview
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { rating, review_text } = body

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
    }

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (review_text !== undefined && review_text.trim().length === 0) {
      return NextResponse.json({ error: 'Review text cannot be empty' }, { status: 400 })
    }

    // Check if review exists and belongs to the user
    const { data: existingReview, error: fetchError } = await supabaseServer
      .from('reviews')
      .select('user_id, restaurant_id, food_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (existingReview.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own reviews' }, { status: 403 })
    }

    // Update the review
    const updateData: any = { updated_at: new Date().toISOString() }
    if (rating) updateData.rating = rating
    if (review_text !== undefined) updateData.review_text = review_text.trim()

    const { data: updatedReview, error: updateError } = await supabaseServer
      .from('reviews')
      .update(updateData)
      .eq('id', id)
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

    if (updateError) {
      console.error('Error updating review:', updateError)
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
    }

    // Update restaurant/food rating if rating was changed
    if (rating) {
      await updateRatingAndCount(existingReview.restaurant_id, existingReview.food_id)
    }

    // Format the response
    const formattedReview = {
      id: updatedReview.id,
      user: {
        id: updatedReview.profiles.user_id,
        username: updatedReview.profiles.username,
        full_name: updatedReview.profiles.full_name,
        profile_image_url: updatedReview.profiles.profile_image_url,
        is_verified: updatedReview.profiles.is_verified
      },
      restaurant: updatedReview.restaurants ? {
        id: updatedReview.restaurants.id,
        name: updatedReview.restaurants.name,
        image_url: updatedReview.restaurants.cover_images && updatedReview.restaurants.cover_images.length > 0 ? updatedReview.restaurants.cover_images[0] : null
      } : null,
      food: updatedReview.foods ? {
        id: updatedReview.foods.id,
        name: updatedReview.foods.name,
        image_url: updatedReview.foods.images && updatedReview.foods.images.length > 0 ? updatedReview.foods.images[0] : null
      } : null,
      rating: updatedReview.rating,
      review_text: updatedReview.review_text,
      likes_count: updatedReview.likes_count || 0,
      comments_count: updatedReview.comments_count || 0,
      created_at: updatedReview.created_at,
      updated_at: updatedReview.updated_at
    }

    return NextResponse.json({
      success: true,
      review: formattedReview
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
    }

    // Check if review exists and belongs to the user
    const { data: existingReview, error: fetchError } = await supabaseServer
      .from('reviews')
      .select('user_id, restaurant_id, food_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (existingReview.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own reviews' }, { status: 403 })
    }

    // Delete the review (this will cascade delete replies and likes)
    const { error: deleteError } = await supabaseServer
      .from('reviews')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting review:', deleteError)
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
    }

    // Update restaurant/food rating and count
    await updateRatingAndCount(existingReview.restaurant_id, existingReview.food_id)

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    })

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
          rating: Math.round(avgRating * 100) / 100,
          review_count: restaurantReviews.length
        })
        .eq('id', restaurantId)
    } else {
      // No reviews left, reset to 0
      await supabaseServer
        .from('restaurants')
        .update({
          rating: 0,
          review_count: 0
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
      } else {
        // No reviews left, reset to 0
        await supabaseServer
          .from('foods')
          .update({
            rating: 0,
            review_count: 0
          })
          .eq('id', foodId)
      }
    }
  } catch (error) {
    console.error('Error updating rating and count:', error)
  }
}