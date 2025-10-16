-- =====================================================
-- Migration: Sharing System (Fixed)
-- File: fix_migration.sql
-- Description: Create tables and functions for sharing foods and restaurants in messages
-- =====================================================

-- Create shared_content table to store references to shared items
CREATE TABLE IF NOT EXISTS public.shared_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('food', 'restaurant')),
    content_id UUID NOT NULL,
    shared_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    share_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add sender_id column to messages table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'sender_id') THEN
        ALTER TABLE public.messages ADD COLUMN sender_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update message_type constraint to include shared_content
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check 
    CHECK (message_type IN ('text', 'shared_content'));

-- Add shared_content_id column to messages table for referencing shared content
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'shared_content_id') THEN
        ALTER TABLE public.messages ADD COLUMN shared_content_id UUID REFERENCES public.shared_content(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_content_type_id ON public.shared_content(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_shared_content_shared_by ON public.shared_content(shared_by);
CREATE INDEX IF NOT EXISTS idx_shared_content_created_at ON public.shared_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_shared_content_id ON public.messages(shared_content_id);

-- Create function to create shared content and send message
CREATE OR REPLACE FUNCTION share_content_in_message(
    p_sender_id UUID,
    p_recipient_id UUID,
    p_content_type VARCHAR(20),
    p_content_id UUID,
    p_share_message TEXT DEFAULT NULL,
    p_message_content TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_shared_content_id UUID;
    v_conversation_id UUID;
    v_message_id UUID;
    v_message_text TEXT;
BEGIN
    -- Create shared content record
    INSERT INTO public.shared_content (content_type, content_id, shared_by, share_message)
    VALUES (p_content_type, p_content_id, p_sender_id, p_share_message)
    RETURNING id INTO v_shared_content_id;
    
    -- Get or create conversation between sender and recipient
    SELECT id INTO v_conversation_id
    FROM public.conversations c
    WHERE EXISTS (
        SELECT 1 FROM public.conversation_participants cp1
        WHERE cp1.conversation_id = c.id AND cp1.user_id = p_sender_id
    )
    AND EXISTS (
        SELECT 1 FROM public.conversation_participants cp2
        WHERE cp2.conversation_id = c.id AND cp2.user_id = p_recipient_id
    )
    AND c.conversation_type = 'direct'
    LIMIT 1;
    
    -- If no conversation exists, create one
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (conversation_type, created_by)
        VALUES ('direct', p_sender_id)
        RETURNING id INTO v_conversation_id;
        
        -- Add participants
        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES 
            (v_conversation_id, p_sender_id),
            (v_conversation_id, p_recipient_id);
    END IF;
    
    -- Create message content
    v_message_text := COALESCE(p_message_content, 'Shared a ' || p_content_type);
    
    -- Create message with shared content reference
    INSERT INTO public.messages (
        conversation_id, 
        sender_id, 
        content, 
        message_type, 
        shared_content_id
    )
    VALUES (
        v_conversation_id, 
        p_sender_id, 
        v_message_text, 
        'shared_content', 
        v_shared_content_id
    )
    RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on shared_content table
ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shared_content table
-- Note: Simplified policy that doesn't depend on conversation_participants.is_active
CREATE POLICY "Users can view shared content in their conversations" ON public.shared_content
    FOR SELECT USING (
        id IN (
            SELECT m.shared_content_id 
            FROM public.messages m
            JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE cp.user_id = auth.uid()
            AND m.shared_content_id IS NOT NULL
        )
    );

CREATE POLICY "Users can create shared content" ON public.shared_content
    FOR INSERT WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can update their own shared content" ON public.shared_content
    FOR UPDATE USING (shared_by = auth.uid());

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.shared_content TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.shared_content IS 'Stores references to shared food and restaurant items in messages';
COMMENT ON FUNCTION share_content_in_message IS 'Creates shared content and sends it as a message in a conversation';