-- =====================================================
-- Migration: Sharing System
-- File: 007_sharing_system.sql
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
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS shared_content_id UUID REFERENCES public.shared_content(id) ON DELETE SET NULL;

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
    v_conversation_id UUID;
    v_shared_content_id UUID;
    v_message_id UUID;
    v_final_message_content TEXT;
BEGIN
    -- Get or create conversation between sender and recipient
    SELECT get_or_create_conversation(p_sender_id, p_recipient_id) INTO v_conversation_id;
    
    -- Create shared content record
    INSERT INTO public.shared_content (content_type, content_id, shared_by, share_message)
    VALUES (p_content_type, p_content_id, p_sender_id, p_share_message)
    RETURNING id INTO v_shared_content_id;
    
    -- Prepare message content
    IF p_message_content IS NOT NULL AND p_message_content != '' THEN
        v_final_message_content := p_message_content;
    ELSE
        -- Default message based on content type
        IF p_content_type = 'food' THEN
            v_final_message_content := 'Shared a food item with you';
        ELSE
            v_final_message_content := 'Shared a restaurant with you';
        END IF;
    END IF;
    
    -- Create message with shared content
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
        v_final_message_content, 
        'shared_content', 
        v_shared_content_id
    )
    RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get shared content details with food/restaurant info
CREATE OR REPLACE FUNCTION get_shared_content_details(p_shared_content_id UUID)
RETURNS TABLE(
    id UUID,
    content_type VARCHAR(20),
    content_id UUID,
    shared_by UUID,
    share_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    content_data JSONB,
    sharer_info JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.content_type,
        sc.content_id,
        sc.shared_by,
        sc.share_message,
        sc.created_at,
        CASE 
            WHEN sc.content_type = 'food' THEN
                (SELECT to_jsonb(f.*) FROM (
                    SELECT 
                        foods.id,
                        foods.name,
                        foods.description,
                        foods.price,
                        foods.category,
                        foods.image_url,
                        foods.rating,
                        foods.review_count,
                        foods.is_vegetarian,
                        foods.is_featured,
                        foods.tags,
                        restaurants.name as restaurant_name,
                        restaurants.cuisine as restaurant_cuisine,
                        restaurants.rating as restaurant_rating
                    FROM public.foods 
                    LEFT JOIN public.restaurants ON foods.restaurant_id = restaurants.id
                    WHERE foods.id = sc.content_id
                ) f)
            WHEN sc.content_type = 'restaurant' THEN
                (SELECT to_jsonb(r.*) FROM (
                    SELECT 
                        restaurants.id,
                        restaurants.name,
                        restaurants.description,
                        restaurants.cuisine,
                        restaurants.address,
                        restaurants.phone,
                        restaurants.rating,
                        restaurants.review_count,
                        restaurants.price_range,
                        restaurants.images,
                        restaurants.cover_images,
                        restaurants.tags,
                        restaurants.features,
                        restaurants.opening_hours,
                        restaurants.is_open
                    FROM public.restaurants 
                    WHERE restaurants.id = sc.content_id
                ) r)
        END as content_data,
        (SELECT to_jsonb(p.*) FROM (
            SELECT 
                profiles.user_id,
                profiles.username,
                profiles.full_name,
                profiles.profile_image_url
            FROM public.profiles 
            WHERE profiles.user_id = sc.shared_by
        ) p) as sharer_info
    FROM public.shared_content sc
    WHERE sc.id = p_shared_content_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get messages with shared content details
CREATE OR REPLACE FUNCTION get_messages_with_shared_content(p_conversation_id UUID)
RETURNS TABLE(
    id UUID,
    conversation_id UUID,
    sender_id UUID,
    content TEXT,
    message_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    shared_content JSONB,
    sender_info JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.created_at,
        m.delivered_at,
        m.read_at,
        CASE 
            WHEN m.shared_content_id IS NOT NULL THEN
                (SELECT to_jsonb(scd.*) FROM get_shared_content_details(m.shared_content_id) scd)
            ELSE NULL
        END as shared_content,
        (SELECT to_jsonb(p.*) FROM (
            SELECT 
                profiles.user_id,
                profiles.username,
                profiles.full_name,
                profiles.profile_image_url
            FROM public.profiles 
            WHERE profiles.user_id = m.sender_id
        ) p) as sender_info
    FROM public.messages m
    WHERE m.conversation_id = p_conversation_id
    AND m.is_deleted = false
    ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function to handle shared content messages
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

-- Enable RLS on shared_content table
ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY;

-- Simplified policy that works with current schema
CREATE POLICY "Users can view shared content in their conversations" ON public.shared_content
    FOR SELECT USING (
        shared_by = auth.uid() OR
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

-- Create updated_at trigger for shared_content
CREATE OR REPLACE FUNCTION update_shared_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shared_content_updated_at
    BEFORE UPDATE ON public.shared_content
    FOR EACH ROW
    EXECUTE FUNCTION update_shared_content_updated_at();