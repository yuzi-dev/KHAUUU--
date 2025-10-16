import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    const { replyId } = await params

    if (!replyId) {
      return NextResponse.json({ error: 'Reply ID is required' }, { status: 400 })
    }

    // Fetch reply with user details
    const { data: reply, error } = await supabaseServer
      .from('review_replies')
      .select(`
        *,
        profiles!review_replies_user_id_fkey (
          user_id,
          username,
          full_name,
          profile_image_url,
          is_verified
        )
      `)
      .eq('id', replyId)
      .eq('is_public', true)
      .single()

    if (error || !reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    // Format the reply
    const formattedReply = {
      id: reply.id,
      review_id: reply.review_id,
      user: {
        id: reply.profiles.user_id,
        username: reply.profiles.username,
        full_name: reply.profiles.full_name,
        profile_image_url: reply.profiles.profile_image_url,
        is_verified: reply.profiles.is_verified
      },
      reply_text: reply.reply_text,
      parent_reply_id: reply.parent_reply_id,
      likes_count: reply.likes_count || 0,
      created_at: reply.created_at,
      updated_at: reply.updated_at
    }

    return NextResponse.json({
      success: true,
      reply: formattedReply
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
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

    const { replyId } = await params
    const body = await request.json()
    const { reply_text } = body

    if (!replyId) {
      return NextResponse.json({ error: 'Reply ID is required' }, { status: 400 })
    }

    // Validation
    if (!reply_text || reply_text.trim().length === 0) {
      return NextResponse.json({ error: 'Reply text cannot be empty' }, { status: 400 })
    }

    if (reply_text.trim().length > 1000) {
      return NextResponse.json({ error: 'Reply text is too long (max 1000 characters)' }, { status: 400 })
    }

    // Check if reply exists and belongs to the user
    const { data: existingReply, error: fetchError } = await supabaseServer
      .from('review_replies')
      .select('user_id')
      .eq('id', replyId)
      .single()

    if (fetchError || !existingReply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    if (existingReply.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own replies' }, { status: 403 })
    }

    // Update the reply
    const { data: updatedReply, error: updateError } = await supabaseServer
      .from('review_replies')
      .update({
        reply_text: reply_text.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', replyId)
      .select(`
        *,
        profiles!review_replies_user_id_fkey (
          user_id,
          username,
          full_name,
          profile_image_url,
          is_verified
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating reply:', updateError)
      return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 })
    }

    // Format the response
    const formattedReply = {
      id: updatedReply.id,
      review_id: updatedReply.review_id,
      user: {
        id: updatedReply.profiles.user_id,
        username: updatedReply.profiles.username,
        full_name: updatedReply.profiles.full_name,
        profile_image_url: updatedReply.profiles.profile_image_url,
        is_verified: updatedReply.profiles.is_verified
      },
      reply_text: updatedReply.reply_text,
      parent_reply_id: updatedReply.parent_reply_id,
      likes_count: updatedReply.likes_count || 0,
      created_at: updatedReply.created_at,
      updated_at: updatedReply.updated_at
    }

    return NextResponse.json({
      success: true,
      reply: formattedReply
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
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

    const { replyId } = await params

    if (!replyId) {
      return NextResponse.json({ error: 'Reply ID is required' }, { status: 400 })
    }

    // Check if reply exists and belongs to the user
    const { data: existingReply, error: fetchError } = await supabaseServer
      .from('review_replies')
      .select('user_id')
      .eq('id', replyId)
      .single()

    if (fetchError || !existingReply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    if (existingReply.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own replies' }, { status: 403 })
    }

    // Delete the reply (this will cascade delete child replies and likes)
    const { error: deleteError } = await supabaseServer
      .from('review_replies')
      .delete()
      .eq('id', replyId)

    if (deleteError) {
      console.error('Error deleting reply:', deleteError)
      return NextResponse.json({ error: 'Failed to delete reply' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Reply deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}