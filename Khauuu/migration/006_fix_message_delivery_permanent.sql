-- =====================================================
-- Migration: Fix Message Delivery Status (Permanent Solution)
-- File: 006_fix_message_delivery_permanent.sql
-- Description: Create triggers and functions to automatically handle message delivery status
-- =====================================================

-- Create function to automatically set delivered_at timestamp for new messages
CREATE OR REPLACE FUNCTION set_message_delivered_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically set delivered_at to the current timestamp when a message is inserted
    -- This ensures all new messages have a delivery timestamp
    NEW.delivered_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set delivered_at for new messages
DROP TRIGGER IF EXISTS trigger_set_message_delivered_at ON public.messages;
CREATE TRIGGER trigger_set_message_delivered_at
    BEFORE INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION set_message_delivered_at();

-- Update existing messages that don't have delivered_at set
-- Set their delivered_at to their created_at timestamp (retroactive delivery)
UPDATE public.messages 
SET delivered_at = created_at 
WHERE delivered_at IS NULL 
AND is_deleted = false;

-- Create function to handle message read status updates with proper delivered_at handling
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Update the last_read_at timestamp for the user in this conversation
    UPDATE public.conversation_participants
    SET last_read_at = NOW()
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
    
    -- Update read_at timestamp for all unread messages in this conversation
    -- Also ensure delivered_at is set if it's somehow null (safety measure)
    UPDATE public.messages
    SET 
        read_at = NOW(),
        delivered_at = COALESCE(delivered_at, created_at)
    WHERE conversation_id = p_conversation_id 
    AND sender_id != p_user_id 
    AND read_at IS NULL
    AND is_deleted = false;
END;
$$ LANGUAGE plpgsql;

-- Create function to get message delivery statistics (for monitoring)
CREATE OR REPLACE FUNCTION get_message_delivery_stats()
RETURNS TABLE(
    total_messages BIGINT,
    delivered_messages BIGINT,
    read_messages BIGINT,
    delivery_percentage NUMERIC,
    read_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_messages,
        COUNT(m.delivered_at) as delivered_messages,
        COUNT(m.read_at) as read_messages,
        ROUND((COUNT(m.delivered_at)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as delivery_percentage,
        ROUND((COUNT(m.read_at)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as read_percentage
    FROM public.messages m
    WHERE m.is_deleted = false;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to ensure delivered_at is never null for new messages
-- This is a safety measure to prevent any future issues
ALTER TABLE public.messages 
ADD CONSTRAINT check_delivered_at_not_null 
CHECK (delivered_at IS NOT NULL OR is_deleted = true);

-- Grant execute permissions for the new functions
GRANT EXECUTE ON FUNCTION set_message_delivered_at TO authenticated;
GRANT EXECUTE ON FUNCTION get_message_delivery_stats TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION set_message_delivered_at IS 'Automatically sets delivered_at timestamp for new messages';
COMMENT ON FUNCTION get_message_delivery_stats IS 'Returns statistics about message delivery and read status';
COMMENT ON CONSTRAINT check_delivered_at_not_null ON public.messages IS 'Ensures all non-deleted messages have a delivery timestamp';

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 006_fix_message_delivery_permanent.sql completed successfully';
    RAISE NOTICE 'All existing messages have been updated with delivery timestamps';
    RAISE NOTICE 'New messages will automatically receive delivery timestamps via trigger';
END $$;