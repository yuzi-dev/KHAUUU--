-- Update the mark_messages_as_read function to also update individual message read_at timestamps
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