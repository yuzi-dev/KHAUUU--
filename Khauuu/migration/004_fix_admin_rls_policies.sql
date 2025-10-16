-- =====================================================
-- Migration: Fix Admin RLS Policies (Infinite Recursion)
-- File: 004_fix_admin_rls_policies.sql
-- Description: Fix infinite recursion in admin_users RLS policies
-- =====================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;

-- Disable RLS temporarily to avoid recursion issues
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Create a function to check if current user is an admin
-- This avoids the circular dependency in RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user exists in admin_users and is active
    -- Use a direct query without RLS to avoid recursion
    RETURN EXISTS (
        SELECT 1 
        FROM public.admin_users 
        WHERE id::text = auth.uid()::text 
        AND is_active = true
    );
END;
$$;

-- Create a function to check if current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user is a super admin
    -- Use a direct query without RLS to avoid recursion
    RETURN EXISTS (
        SELECT 1 
        FROM public.admin_users 
        WHERE id::text = auth.uid()::text 
        AND is_active = true 
        AND role = 'super_admin'
    );
END;
$$;

-- Re-enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create new non-recursive RLS policies using the functions
CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage admin users" ON public.admin_users
    FOR ALL USING (public.is_super_admin());

-- Update admin_sessions policies to use the new function
DROP POLICY IF EXISTS "Admins can view their own sessions" ON public.admin_sessions;

CREATE POLICY "Admins can view their own sessions" ON public.admin_sessions
    FOR SELECT USING (
        admin_user_id::text = auth.uid()::text OR public.is_super_admin()
    );

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.is_admin() IS 'Check if current authenticated user is an active admin';
COMMENT ON FUNCTION public.is_super_admin() IS 'Check if current authenticated user is an active super admin';

-- Analyze tables after policy changes
ANALYZE public.admin_users;
ANALYZE public.admin_sessions;