import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

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
    const { review_id, reply_id } = body

    // Validation - must have either review_id or reply_id, but not both
    if ((!review_id && !reply_id) || (review_id && reply_id)) {
      return NextResponse.json({ 
        error: 'Must provide either review_id or reply_id, but not both' 
      }, { status: 400 })
    }

    // Verify the review or reply exists
    if (review_id) {
      const { data: review, error: reviewError } = await supabaseServer
        .from('reviews')
        .select('id')
        .eq('id', review_id)
        .eq('is_public', true)
        .single()

      if (reviewError || !review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 })
      }
    }

    if (reply_id) {
      const { data: reply, error: replyError } = await supabaseServer
        .from('review_replies')
        .select('id')
        .eq('id', reply_id)
        .eq('is_public', true)
        .single()

      if (replyError || !reply) {
        return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
      }
    }

    // Check if user already liked this review/reply
    const { data: existingLike } = await supabaseServer
      .from('review_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('review_id', review_id || null)
      .eq('reply_id', reply_id || null)
      .single()

    if (existingLike) {
      return NextResponse.json({ 
        error: 'You have already liked this item' 
      }, { status: 400 })
    }

    // Create the like
    const { data: newLike, error: insertError } = await supabaseServer
      .from('review_likes')
      .insert({
        user_id: user.id,
        review_id: review_id || null,
        reply_id: reply_id || null
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating like:', insertError)
      return NextResponse.json({ error: 'Failed to create like' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      like: {
        id: newLike.id,
        review_id: newLike.review_id,
        reply_id: newLike.reply_id,
        created_at: newLike.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const review_id_param = searchParams.get('review_id')
    const reply_id_param = searchParams.get('reply_id')

    // Convert string 'null' to actual null values
    const review_id = review_id_param === 'null' ? null : review_id_param
    const reply_id = reply_id_param === 'null' ? null : reply_id_param

    // Validation - must have either review_id or reply_id, but not both
    if ((!review_id && !reply_id) || (review_id && reply_id)) {
      return NextResponse.json({ 
        error: 'Must provide either review_id or reply_id, but not both' 
      }, { status: 400 })
    }

    // Find and delete the like
    let query = supabaseServer
      .from('review_likes')
      .select('id')
      .eq('user_id', user.id)

    if (review_id) {
      query = query.eq('review_id', review_id).is('reply_id', null)
    } else if (reply_id) {
      query = query.eq('reply_id', reply_id).is('review_id', null)
    }

    const { data: existingLike, error: fetchError } = await query.single()

    if (fetchError || !existingLike) {
      return NextResponse.json({ error: 'Like not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabaseServer
      .from('review_likes')
      .delete()
      .eq('id', existingLike.id)

    if (deleteError) {
      console.error('Error deleting like:', deleteError)
      return NextResponse.json({ error: 'Failed to delete like' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Like removed successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header (optional for checking if user liked something)
    const authHeader = request.headers.get('authorization')
    let currentUserId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user } } = await supabaseServer.auth.getUser(token)
      currentUserId = user?.id
    }

    const { searchParams } = new URL(request.url)
    const review_id = searchParams.get('review_id')
    const reply_id = searchParams.get('reply_id')

    // Validation - must have either review_id or reply_id, but not both
    if ((!review_id && !reply_id) || (review_id && reply_id)) {
      return NextResponse.json({ 
        error: 'Must provide either review_id or reply_id, but not both' 
      }, { status: 400 })
    }

    // Get likes for the review or reply
    let query = supabaseServer
      .from('review_likes')
      .select(`
        id,
        user_id,
        created_at,
        profiles!inner (
          user_id,
          username,
          full_name,
          profile_image_url,
          is_verified
        )
      `)
      .order('created_at', { ascending: false })

    if (review_id) {
      query = query.eq('review_id', review_id)
    } else {
      query = query.eq('reply_id', reply_id)
    }

    const { data: likes, error } = await query

    if (error) {
      console.error('Error fetching likes:', error)
      return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 })
    }

    // Check if current user liked this item
    const userLiked = currentUserId ? likes?.some(like => like.user_id === currentUserId) : false

    // Format likes
    const formattedLikes = likes?.map((like: any) => ({
      id: like.id,
      user: {
        id: like.profiles.user_id,
        username: like.profiles.username,
        full_name: like.profiles.full_name,
        profile_image_url: like.profiles.profile_image_url,
        is_verified: like.profiles.is_verified
      },
      created_at: like.created_at
    })) || []

    return NextResponse.json({
      success: true,
      likes: formattedLikes,
      total_likes: formattedLikes.length,
      user_liked: userLiked
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}