import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET /api/messages/conversations - Get user's conversations
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get conversations with last message and other participant info
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        last_read_at,
        conversations!inner (
          id,
          created_at,
          updated_at,
          last_message_at,
          last_message_id,
          participant_count,
          messages!conversations_last_message_id_fkey (
            id,
            content,
            message_type,
            created_at,
            sender_id,
            profiles!messages_sender_id_fkey (
              user_id,
              username,
              full_name,
              profile_image_url
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('conversations(last_message_at)', { ascending: false })
      .range(offset, offset + limit - 1);

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // For each conversation, get the other participant(s)
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const { data: participants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            profiles!conversation_participants_user_id_fkey (
              user_id,
              username,
              full_name,
              profile_image_url
            )
          `)
          .eq('conversation_id', conv.conversation_id)
          .eq('is_active', true)
          .neq('user_id', user.id);

        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
          return null;
        }

        // Calculate unread count for this conversation
        const { data: unreadCount, error: unreadError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.conversation_id)
          .gt('created_at', conv.last_read_at)
          .neq('sender_id', user.id)
          .eq('is_deleted', false);

        return {
          id: conv.conversations.id,
          created_at: conv.conversations.created_at,
          updated_at: conv.conversations.updated_at,
          last_message_at: conv.conversations.last_message_at,
          last_message: conv.conversations.messages,
          participants: participants?.map((p: any) => p.profiles) || [],
          unread_count: unreadError ? 0 : (unreadCount || 0),
          last_read_at: conv.last_read_at
        };
      })
    );

    // Filter out any null conversations (errors)
    const validConversations = enrichedConversations.filter((conv: any) => conv !== null);

    return NextResponse.json({
      success: true,
      conversations: validConversations
    });

  } catch (error) {
    console.error('Error in conversations GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/messages/conversations - Create a new conversation
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userIds, isGroup = false, recipientId } = body;

    // Support both old format (recipientId) and new format (userIds)
    let participantIds: string[];
    if (recipientId) {
      // Legacy support for single recipient
      participantIds = [recipientId];
    } else if (userIds && Array.isArray(userIds)) {
      participantIds = userIds;
    } else {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    // Validate participants
    if (participantIds.length === 0) {
      return NextResponse.json({ error: 'At least one participant is required' }, { status: 400 });
    }

    if (participantIds.includes(user.id)) {
      return NextResponse.json({ error: 'Cannot include yourself in the participants list' }, { status: 400 });
    }

    if (isGroup && participantIds.length < 2) {
      return NextResponse.json({ error: 'Group conversations require at least 2 participants' }, { status: 400 });
    }

    // Verify all participants exist
    const { data: participants, error: participantsError } = await supabase
      .from('profiles')
      .select('user_id, username, full_name, profile_image_url')
      .in('user_id', participantIds);

    if (participantsError || !participants || participants.length !== participantIds.length) {
      return NextResponse.json({ error: 'One or more participants not found' }, { status: 404 });
    }

    let conversationId: string;

    if (!isGroup && participantIds.length === 1) {
      // For direct messages, use existing function
      const { data: existingConversationId, error: conversationError } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: user.id,
          user2_id: participantIds[0]
        });

      if (conversationError) {
        console.error('Error getting/creating conversation:', conversationError);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }

      conversationId = existingConversationId;
    } else {
      // For group conversations, create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          is_group: true,
          created_by: user.id
        })
        .select('id')
        .single();

      if (createError || !newConversation) {
        console.error('Error creating group conversation:', createError);
        return NextResponse.json({ error: 'Failed to create group conversation' }, { status: 500 });
      }

      conversationId = newConversation.id;

      // Add all participants (including current user)
      const allParticipants = [user.id, ...participantIds];
      const participantInserts = allParticipants.map(userId => ({
        conversation_id: conversationId,
        user_id: userId,
        is_active: true,
        joined_at: new Date().toISOString()
      }));

      const { error: participantsInsertError } = await supabase
        .from('conversation_participants')
        .insert(participantInserts);

      if (participantsInsertError) {
        console.error('Error adding participants:', participantsInsertError);
        return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 });
      }
    }

    // Get the conversation details
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        updated_at,
        last_message_at,
        participant_count
      `)
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      console.error('Error fetching conversation:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        ...conversation,
        participants: participants,
        unread_count: 0,
        last_message: null
      }
    });

  } catch (error) {
    console.error('Error in conversations POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}