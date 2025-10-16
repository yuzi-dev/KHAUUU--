import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
    }

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

    // Verify review exists
    const { data: review, error: reviewError } = await supabaseServer
      .from('reviews')
      .select('id')
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Get threaded replies using the database function
    const { data: replies, error } = await supabaseServer
      .rpc('get_threaded_replies', { review_uuid: id })

    if (error) {
      console.error('Error fetching replies:', error)
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })
    }

    // Get user details for each reply
    const userIds = [...new Set(replies?.map((reply: any) => reply.user_id) || [])]
    const { data: users } = await supabaseServer
      .from('profiles')
      .select('user_id, username, full_name, profile_image_url, is_verified')
      .in('user_id', userIds)

    const userMap = new Map(users?.map(user => [user.user_id, user]) || [])

    // Get user likes for replies if user is authenticated
    let userLikes: Set<string> = new Set()
    if (currentUserId && replies && replies.length > 0) {
      const replyIds = replies.map((reply: any) => reply.id)
      const { data: likes } = await supabaseServer
        .from('review_likes')
        .select('reply_id')
        .eq('user_id', currentUserId)
        .in('reply_id', replyIds)
      
      if (likes) {
        userLikes = new Set(likes.map(like => like.reply_id))
      }
    }

    // Format replies with user details
    const formattedReplies = replies?.map((reply: any) => ({
      id: reply.id,
      review_id: reply.review_id,
      user: userMap.get(reply.user_id) || null,
      reply_text: reply.reply_text,
      parent_reply_id: reply.parent_reply_id,
      likes_count: reply.likes_count || 0,
      user_liked: userLikes.has(reply.id),
      level: reply.level,
      created_at: reply.created_at,
      updated_at: reply.updated_at
    })) || []

    return NextResponse.json({
      success: true,
      replies: formattedReplies
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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
    const { reply_text, parent_reply_id } = body

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
    }

    // Validation
    if (!reply_text || reply_text.trim().length === 0) {
      return NextResponse.json({ error: 'Reply text is required' }, { status: 400 })
    }

    if (reply_text.trim().length > 1000) {
      return NextResponse.json({ error: 'Reply text is too long (max 1000 characters)' }, { status: 400 })
    }

    // Verify review exists
    const { data: review, error: reviewError } = await supabaseServer
      .from('reviews')
      .select('id')
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // If parent_reply_id is provided, verify it exists and belongs to this review
    if (parent_reply_id) {
      const { data: parentReply, error: parentError } = await supabaseServer
        .from('review_replies')
        .select('id, review_id')
        .eq('id', parent_reply_id)
        .single()

      if (parentError || !parentReply) {
        return NextResponse.json({ error: 'Parent reply not found' }, { status: 404 })
      }

      if (parentReply.review_id !== id) {
        return NextResponse.json({ 
          error: 'Parent reply does not belong to this review' 
        }, { status: 400 })
      }
    }

    // Create the reply
    const { data: newReply, error: insertError } = await supabaseServer
      .from('review_replies')
      .insert({
        review_id: id,
        user_id: user.id,
        reply_text: reply_text.trim(),
        parent_reply_id: parent_reply_id || null,
        is_public: true
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating reply:', insertError)
      return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })
    }

    // Get user details for the response
    const { data: userProfile } = await supabaseServer
      .from('profiles')
      .select('user_id, username, full_name, profile_image_url, is_verified')
      .eq('user_id', user.id)
      .single()

    // Format the response
    const formattedReply = {
      id: newReply.id,
      review_id: newReply.review_id,
      user: userProfile || null,
      reply_text: newReply.reply_text,
      parent_reply_id: newReply.parent_reply_id,
      likes_count: newReply.likes_count || 0,
      level: parent_reply_id ? 1 : 0, // Simple level calculation
      created_at: newReply.created_at,
      updated_at: newReply.updated_at
    }

    return NextResponse.json({
      success: true,
      reply: formattedReply
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}