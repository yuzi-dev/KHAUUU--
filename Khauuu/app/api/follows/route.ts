import { supabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { followed_user_id, action } = await request.json()

    if (!followed_user_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (followed_user_id === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    if (action === 'follow') {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_user_id', user.id)
        .eq('followed_user_id', followed_user_id)
        .single()

      if (existingFollow) {
        return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
      }

      // Check if target user is private
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('is_private')
        .eq('user_id', followed_user_id)
        .single()

      // Determine follow status based on privacy setting
      const followStatus = targetProfile?.is_private ? 'pending' : 'accepted'

      // Create follow relationship
      const { data, error } = await supabase
        .from('follows')
        .insert({
          follower_user_id: user.id,
          followed_user_id: followed_user_id,
          status: followStatus
        })
        .select()
        .single()

      if (error) {
        console.error('Follow error:', error)
        return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: followStatus === 'pending' ? 'Follow request sent successfully' : 'Successfully followed user',
        follow: data,
        status: followStatus
      })

    } else if (action === 'unfollow') {
      // Remove follow relationship
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_user_id', user.id)
        .eq('followed_user_id', followed_user_id)

      if (error) {
        console.error('Unfollow error:', error)
        return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Successfully unfollowed user' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Follow API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const type = searchParams.get('type') // 'followers' or 'following'

    if (!user_id || !type) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    let query = supabase
      .from('follows')
      .select(`
        id,
        created_at,
        status,
        ${type === 'followers' ? 'follower_user_id' : 'followed_user_id'},
        profiles!${type === 'followers' ? 'follows_follower_user_id_fkey' : 'follows_followed_user_id_fkey'} (
          user_id,
          username,
          full_name,
          avatar_url:profile_image_url,
          bio
        )
      `)
      .eq('status', 'accepted')

    if (type === 'followers') {
      query = query.eq('followed_user_id', user_id)
    } else if (type === 'following') {
      query = query.eq('follower_user_id', user_id)
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Get follows error:', error)
      return NextResponse.json({ error: 'Failed to fetch follows' }, { status: 500 })
    }

    return NextResponse.json({ 
      [type]: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Get follows API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}