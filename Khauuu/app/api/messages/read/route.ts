import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ablyServer, MESSAGING_CHANNELS, MESSAGING_EVENTS } from '@/lib/ably';

// POST /api/messages/read - Mark messages as read
export async function POST(request: NextRequest) {
  try {
    // Check for Authorization header first
    const authHeader = request.headers.get('authorization');
    let user = null;
    let supabase;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Create client with service role for token validation
      const { createClient: createServiceClient } = require('@supabase/supabase-js');
      const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: { user: tokenUser }, error: tokenError } = await serviceSupabase.auth.getUser(token);
      if (!tokenError && tokenUser) {
        user = tokenUser;
        supabase = serviceSupabase;
      }
    }
    
    // Fallback to cookie-based authentication
    if (!user) {
      supabase = await createClient();
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !cookieUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = cookieUser;
    }

    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Verify user is participant in the conversation - try different approach
    const { data: participants, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    console.log('Participant check result:', { participants, participantError, conversationId, userId: user.id });

    if (participantError) {
      console.error('Participant verification failed:', participantError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!participants || participants.length === 0) {
      console.log('User is not a participant in this conversation');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Mark messages as read using the database function
    const { error: readError } = await supabase
      .rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: user.id
      });

    if (readError) {
      console.error('Error marking messages as read:', readError);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    // Get updated unread count
    const { data: unreadCount, error: unreadError } = await supabase
      .rpc('get_unread_message_count', {
        p_user_id: user.id
      });

    // Publish read event to conversation channel
    try {
      const conversationChannel = ablyServer.channels.get(
        MESSAGING_CHANNELS.CONVERSATION(conversationId)
      );
      
      await conversationChannel.publish(MESSAGING_EVENTS.MESSAGE_READ, {
        userId: user.id,
        conversationId,
        timestamp: new Date().toISOString()
      });

      // Publish unread count update to user's personal channel
      const userChannel = ablyServer.channels.get(
        MESSAGING_CHANNELS.USER_MESSAGES(user.id)
      );
      
      await userChannel.publish(MESSAGING_EVENTS.CONVERSATION_UPDATED, {
        conversationId,
        unreadCount: unreadError ? 0 : unreadCount,
        timestamp: new Date().toISOString()
      });
    } catch (ablyError) {
      console.error('Error publishing to Ably:', ablyError);
      // Don't fail the request if Ably fails
    }

    return NextResponse.json({
      success: true,
      unreadCount: unreadError ? 0 : unreadCount
    });

  } catch (error) {
    console.error('Error in messages read API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}