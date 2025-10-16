import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseServer } from '@/lib/supabase-server';
import { ablyServer, MESSAGING_CHANNELS, MESSAGING_EVENTS } from '@/lib/ably';

// GET /api/messages - Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    // Try to get user from Authorization header first, then fall back to cookies
    const authHeader = request.headers.get('authorization');
    let supabase;
    let user;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = supabaseServer;
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !userData.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = userData.user;
    } else {
      supabase = await createClient();
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = userData.user;
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Verify user is participant in the conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get messages for the conversation using the dedicated function that includes shared content
    const { data: messages, error: messagesError } = await supabase
      .rpc('get_messages_with_shared_content', {
        p_conversation_id: conversationId
      });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messages: messages || []
    });

  } catch (error) {
    console.error('Error in messages GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    // Try to get user from Authorization header first, then fall back to cookies
    const authHeader = request.headers.get('authorization');
    let supabase;
    let user;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = supabaseServer;
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !userData.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = userData.user;
    } else {
      supabase = await createClient();
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = userData.user;
    }

    const body = await request.json();
    const { conversationId, content, recipientId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message content too long' }, { status: 400 });
    }

    let finalConversationId = conversationId;

    // If no conversation ID provided but recipient ID is provided, get or create conversation
    if (!finalConversationId && recipientId) {
      const { data: conversationData, error: conversationError } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: user.id,
          user2_id: recipientId
        });

      if (conversationError) {
        console.error('Error getting/creating conversation:', conversationError);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }

      finalConversationId = conversationData;
    }

    if (!finalConversationId) {
      return NextResponse.json({ error: 'Conversation ID or recipient ID is required' }, { status: 400 });
    }

    // Verify user is participant in the conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', finalConversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Insert the message with delivered_at set to now (since it's delivered immediately)
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: finalConversationId,
        sender_id: user.id,
        content: content.trim(),
        message_type: 'text',
        delivered_at: new Date().toISOString()
      })
      .select(`
        id,
        content,
        message_type,
        created_at,
        updated_at,
        is_edited,
        is_deleted,
        sender_id,
        conversation_id,
        delivered_at,
        read_at,
        profiles!messages_sender_id_fkey (
          user_id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (messageError) {
      console.error('Error inserting message:', messageError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Get conversation participants to send real-time updates
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', finalConversationId)
      .eq('is_active', true);

    if (!participantsError && participants) {
      // Publish to conversation channel
      try {
        const conversationChannel = ablyServer.channels.get(
          MESSAGING_CHANNELS.CONVERSATION(finalConversationId)
        );
        
        await conversationChannel.publish(MESSAGING_EVENTS.NEW_MESSAGE, {
          message,
          timestamp: new Date().toISOString()
        });

        // Publish to each participant's personal message channel
        for (const participant of participants) {
          if (participant.user_id !== user.id) { // Don't send to sender
            const userChannel = ablyServer.channels.get(
              MESSAGING_CHANNELS.USER_MESSAGES(participant.user_id)
            );
            
            await userChannel.publish(MESSAGING_EVENTS.NEW_MESSAGE, {
              message,
              conversationId: finalConversationId,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (ablyError) {
        console.error('Error publishing to Ably:', ablyError);
        // Don't fail the request if Ably fails
      }
    }

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Error in messages POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}