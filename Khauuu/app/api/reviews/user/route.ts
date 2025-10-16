import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // First, let's try a simple query without joins to see if we can get reviews
    const { data: reviews, error: reviewsError } = await supabaseServer
      .from('reviews')
      .select(`
        *,
        restaurants!inner(id, name, cover_images),
        foods(id, name, images)
      `)
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (reviewsError) {
      console.error('Reviews fetch error:', reviewsError)
      return NextResponse.json({ error: 'Failed to fetch reviews', details: reviewsError.message }, { status: 500 })
    }

    // Format reviews with proper restaurant and food details
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      review_text: review.review_text,
      review_images: review.review_images || [],
      like_count: review.like_count || 0,
      comment_count: review.comment_count || 0,
      created_at: review.created_at,
      restaurant: {
        id: review.restaurants.id,
        name: review.restaurants.name,
        image_url: review.restaurants.cover_images && review.restaurants.cover_images.length > 0 ? review.restaurants.cover_images[0] : null
      },
      food: review.foods ? {
        id: review.foods.id,
        name: review.foods.name,
        image_url: review.foods.images && review.foods.images.length > 0 ? review.foods.images[0] : null
      } : null
    }))

    return NextResponse.json({
      success: true,
      reviews: formattedReviews
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}