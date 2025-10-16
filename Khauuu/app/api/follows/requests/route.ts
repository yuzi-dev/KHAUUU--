import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer;
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch pending follow requests for the current user
    const { data: requests, error } = await supabase
      .from('follows')
      .select(`
        id,
        follower_user_id,
        created_at,
        status,
        profiles!follows_follower_user_id_fkey (
          user_id,
          username,
          full_name,
          profile_image_url
        )
      `)
      .eq('followed_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching follow requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch follow requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requests: requests || []
    });

  } catch (error) {
    console.error('Error in follow requests API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = supabaseServer;
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { request_id, action } = body;

    if (!request_id || !action) {
      return NextResponse.json(
        { error: 'request_id and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be either "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Verify the follow request exists and is for the current user
    const { data: followRequest, error: fetchError } = await supabase
      .from('follows')
      .select('id, follower_user_id, followed_user_id, status')
      .eq('id', request_id)
      .eq('followed_user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !followRequest) {
      return NextResponse.json(
        { error: 'Follow request not found' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      // Accept the follow request - update status to 'accepted'
      const { error: updateError } = await supabase
        .from('follows')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', request_id);

      if (updateError) {
        console.error('Error accepting follow request:', updateError);
        return NextResponse.json(
          { error: 'Failed to accept follow request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Follow request accepted'
      });
    } else {
      // Reject the follow request - delete the record
      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .eq('id', request_id);

      if (deleteError) {
        console.error('Error rejecting follow request:', deleteError);
        return NextResponse.json(
          { error: 'Failed to reject follow request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Follow request rejected'
      });
    }

  } catch (error) {
    console.error('Error in follow requests PATCH API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}