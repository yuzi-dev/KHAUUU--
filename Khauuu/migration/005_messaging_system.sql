-- =====================================================
-- Migration: Messaging System
-- File: 005_messaging_system.sql
-- Description: Create tables and functions for real-time messaging between users
-- =====================================================

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_message_id UUID,
    participant_count INTEGER DEFAULT 2 NOT NULL CHECK (participant_count >= 2)
);

-- Create conversation_participants table (for many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
    message_type VARCHAR(20) DEFAULT 'text' NOT NULL CHECK (message_type IN ('text')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT false NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_active ON public.conversation_participants(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted ON public.messages(conversation_id, created_at DESC) WHERE is_deleted = false;

-- Create function to update conversation's last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the conversation's last_message_at and last_message_id
    UPDATE public.conversations 
    SET 
        last_message_at = NEW.created_at,
        last_message_id = NEW.id,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation when new message is added
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON public.messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Create function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
BEGIN
    -- Check if conversation already exists between these two users
    SELECT c.id INTO conversation_id
    FROM public.conversations c
    WHERE c.id IN (
        SELECT cp1.conversation_id
        FROM public.conversation_participants cp1
        WHERE cp1.user_id = user1_id AND cp1.is_active = true
        INTERSECT
        SELECT cp2.conversation_id
        FROM public.conversation_participants cp2
        WHERE cp2.user_id = user2_id AND cp2.is_active = true
    )
    AND c.participant_count = 2
    LIMIT 1;
    
    -- If conversation doesn't exist, create it
    IF conversation_id IS NULL THEN
        INSERT INTO public.conversations (participant_count)
        VALUES (2)
        RETURNING id INTO conversation_id;
        
        -- Add both users as participants
        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES 
            (conversation_id, user1_id),
            (conversation_id, user2_id);
    END IF;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Update the last_read_at timestamp for the user in this conversation
    UPDATE public.conversation_participants
    SET last_read_at = NOW()
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
    
    -- Update read_at timestamp for all unread messages in this conversation
    UPDATE public.messages
    SET read_at = NOW()
    WHERE conversation_id = p_conversation_id 
    AND sender_id != p_user_id 
    AND read_at IS NULL
    AND is_deleted = false;
END;
$$ LANGUAGE plpgsql;

-- Create function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COALESCE(SUM(
        (SELECT COUNT(*)
         FROM public.messages m
         WHERE m.conversation_id = cp.conversation_id
         AND m.created_at > cp.last_read_at
         AND m.sender_id != p_user_id
         AND m.is_deleted = false)
    ), 0) INTO unread_count
    FROM public.conversation_participants cp
    WHERE cp.user_id = p_user_id AND cp.is_active = true;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations" ON public.conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can update their conversations" ON public.conversations
    FOR UPDATE USING (
        id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view their conversation participants" ON public.conversation_participants
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can update their own participation" ON public.conversation_participants
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can insert messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (sender_id = auth.uid());

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;

GRANT EXECUTE ON FUNCTION get_or_create_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.conversations IS 'Stores conversation metadata between users';
COMMENT ON TABLE public.conversation_participants IS 'Many-to-many relationship between users and conversations';
COMMENT ON TABLE public.messages IS 'Stores individual messages within conversations';

COMMENT ON FUNCTION get_or_create_conversation IS 'Gets existing conversation between two users or creates a new one';
COMMENT ON FUNCTION mark_messages_as_read IS 'Marks all messages in a conversation as read for a specific user';
COMMENT ON FUNCTION get_unread_message_count IS 'Returns the total number of unread messages for a user across all conversations';

-- Analyze tables for better query planning
ANALYZE public.conversations;
ANALYZE public.conversation_participants;
ANALYZE public.messages;