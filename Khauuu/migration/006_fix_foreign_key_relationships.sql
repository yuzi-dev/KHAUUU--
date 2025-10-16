-- =====================================================
-- Migration: Fix Foreign Key Relationships
-- File: 006_fix_foreign_key_relationships.sql
-- Description: Add missing foreign key constraints and fix database schema issues
-- =====================================================

-- Add foreign key constraint for conversations.last_message_id -> messages.id
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_last_message_id_fkey 
FOREIGN KEY (last_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;

-- Add avatar_url column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'avatar_url' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Create index for better performance on avatar_url lookups
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON public.profiles(avatar_url) WHERE avatar_url IS NOT NULL;

-- Update RLS policies to include avatar_url access
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

-- Grant permissions for avatar_url column
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Add comments for documentation
COMMENT ON CONSTRAINT conversations_last_message_id_fkey ON public.conversations IS 'Foreign key relationship to the last message in the conversation';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user profile avatar image';

-- Analyze tables for better query planning
ANALYZE public.conversations;
ANALYZE public.profiles;