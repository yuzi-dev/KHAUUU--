import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { requestId, accept } = await request.json();

    if (!requestId || typeof accept !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: requestId and accept' },
        { status: 400 }
      );
    }

    // First, verify the follow request exists and belongs to the current user
    const { data: followRequest, error: fetchError } = await supabaseAdmin
      .from('follows')
      .select('*')
      .eq('id', requestId)
      .eq('followed_user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !followRequest) {
      return NextResponse.json(
        { error: 'Follow request not found' },
        { status: 404 }
      );
    }

    if (accept) {
      // Accept the follow request - update status to 'accepted'
      const { error: updateError } = await supabaseAdmin
        .from('follows')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

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
      // Decline the follow request - delete the record
      const { error: deleteError } = await supabaseAdmin
        .from('follows')
        .delete()
        .eq('id', requestId);

      if (deleteError) {
        console.error('Error declining follow request:', deleteError);
        return NextResponse.json(
          { error: 'Failed to decline follow request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Follow request declined'
      });
    }

  } catch (error) {
    console.error('Error in follow respond API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}