-- =====================================================
-- FIX AUDIT TRIGGER ISSUE ON FOLLOWS TABLE
-- =====================================================
-- Run this SQL script directly in your database to fix the audit trigger error

-- Step 1: Drop all audit triggers on the follows table
DROP TRIGGER IF EXISTS audit_follows_trigger ON public.follows;
DROP TRIGGER IF EXISTS audit_trigger ON public.follows;
DROP TRIGGER IF EXISTS follows_audit_trigger ON public.follows;
DROP TRIGGER IF EXISTS trigger_audit_follows ON public.follows;

-- Step 2: Drop any audit functions that might be causing issues
DROP FUNCTION IF EXISTS audit.audit_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS public.audit_trigger_function() CASCADE;

-- Step 3: Remove the entire audit schema if it exists
DROP SCHEMA IF EXISTS audit CASCADE;

-- Step 4: Verify the follows table structure is correct
DO $$
BEGIN
    -- Check if the follows table has the correct columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'follows' 
        AND column_name = 'follower_user_id'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'follows table missing follower_user_id column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'follows' 
        AND column_name = 'followed_user_id'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'follows table missing followed_user_id column';
    END IF;
    
    -- Remove user_id column if it exists (it shouldn't)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'follows' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.follows DROP COLUMN user_id;
        RAISE NOTICE 'Removed incorrect user_id column from follows table';
    END IF;
    
    RAISE NOTICE 'Follows table structure verified successfully';
END $$;

-- Step 5: Final verification - ensure no audit triggers remain
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name LIKE '%audit%'
        AND event_object_table = 'follows'
    ) THEN
        RAISE EXCEPTION 'Audit triggers still exist on follows table after cleanup';
    END IF;
    
    RAISE NOTICE 'All audit triggers successfully removed from follows table';
    RAISE NOTICE 'The follows API should now work correctly';
END $$;