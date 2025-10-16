import { supabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

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
    const target_user_id = searchParams.get('target_user_id')

    if (!target_user_id) {
      return NextResponse.json({ error: 'Missing target_user_id parameter' }, { status: 400 })
    }

    if (target_user_id === user.id) {
      return NextResponse.json({ 
        is_following: false,
        is_followed_by: false,
        is_mutual: false,
        is_self: true
      })
    }

    // Check if current user follows target user (including pending status)
    const { data: followingData } = await supabase
      .from('follows')
      .select('id, status')
      .eq('follower_user_id', user.id)
      .eq('followed_user_id', target_user_id)
      .single()

    // Check if target user follows current user
    const { data: followerData } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_user_id', target_user_id)
      .eq('followed_user_id', user.id)
      .eq('status', 'accepted')
      .single()

    const is_following = followingData?.status === 'accepted'
    const is_pending = followingData?.status === 'pending'
    const is_followed_by = !!followerData
    const is_mutual = is_following && is_followed_by

    return NextResponse.json({
      is_following,
      is_followed_by,
      is_mutual,
      is_self: false,
      is_pending
    })

  } catch (error) {
    console.error('Follow status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}