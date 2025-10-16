import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const supabase = supabaseServer;
    
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
    
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get following for the specified user
    const { data: following, error } = await supabase
      .from('follows')
      .select(`
        followed_user_id,
        created_at,
        profiles!follows_followed_user_id_fkey (
          user_id,
          username,
          full_name,
          profile_image_url
        )
      `)
      .eq('follower_user_id', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching following:', error);
      return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 });
    }

    // Get the current user's following list to determine follow status
    const { data: currentUserFollowing } = await supabase
      .from('follows')
      .select('followed_user_id')
      .eq('follower_user_id', user.id)
      .eq('status', 'accepted');

    const followingSet = new Set(currentUserFollowing?.map(f => f.followed_user_id) || []);

    // Transform the data to match expected format
    const transformedFollowing = following?.map((follow: any) => ({
      user_id: follow.profiles?.user_id,
      username: follow.profiles?.username,
      full_name: follow.profiles?.full_name,
      avatar_url: follow.profiles?.profile_image_url,
      followed_at: follow.created_at,
      is_following: followingSet.has(follow.profiles?.user_id)
    })) || [];

    return NextResponse.json({ following: transformedFollowing });

  } catch (error) {
    console.error('Error in following API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}