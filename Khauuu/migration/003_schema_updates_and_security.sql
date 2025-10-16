-- =====================================================
-- CONSOLIDATED MIGRATION 003: Schema Updates and Security
-- Description: Contains all schema updates, fixes, foreign key corrections, and RLS policies
-- Consolidates: 006_add_owner_id_to_restaurants.sql, 007_fix_foreign_key_constraints.sql,
--               009_remove_menu_columns.sql, 010_update_foods_table_structure.sql,
--               011_fix_cover_images_column.sql, 011_set_featured_foods.sql,
--               012_drop_cover_image_column.sql, 014_add_restaurants_rls_policies.sql,
--               015_remove_owner_id_constraint.sql, 016_add_profiles_rls_policies.sql,
--               016_fix_reviews_profiles_relationship.sql, 017_fix_review_likes_foreign_key.sql,
--               017_fix_reviews_profiles_relationship_v2.sql
-- =====================================================

-- =====================================================
-- SCHEMA UPDATES AND MODIFICATIONS
-- =====================================================

-- Add owner_id to restaurants table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurants' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.restaurants 
        ADD COLUMN owner_id UUID;
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON public.restaurants(owner_id);
    END IF;
END $$;

-- Remove menu table columns (description and images)
DO $$
BEGIN
    -- Drop description column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'menu' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.menu DROP COLUMN description;
    END IF;
    
    -- Drop images column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'menu' 
        AND column_name = 'images'
    ) THEN
        ALTER TABLE public.menu DROP COLUMN images;
    END IF;
END $$;

-- Update foods table structure
DO $$
BEGIN
    -- Remove columns that are no longer needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'foods' 
        AND column_name = 'is_vegan'
    ) THEN
        ALTER TABLE public.foods DROP COLUMN is_vegan;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'foods' 
        AND column_name = 'is_gluten_free'
    ) THEN
        ALTER TABLE public.foods DROP COLUMN is_gluten_free;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'foods' 
        AND column_name = 'spice_level'
    ) THEN
        ALTER TABLE public.foods DROP COLUMN spice_level;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'foods' 
        AND column_name = 'preparation_time'
    ) THEN
        ALTER TABLE public.foods DROP COLUMN preparation_time;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'foods' 
        AND column_name = 'order_count'
    ) THEN
        ALTER TABLE public.foods DROP COLUMN order_count;
    END IF;
    
    -- Add is_featured column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'foods' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE public.foods 
        ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_foods_is_featured ON public.foods(is_featured);
    END IF;
END $$;

-- Add cover_images column to restaurants table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurants' 
        AND column_name = 'cover_images'
    ) THEN
        ALTER TABLE public.restaurants 
        ADD COLUMN cover_images JSONB DEFAULT '[]'::jsonb;
        
        -- Create GIN index for JSONB operations
        CREATE INDEX IF NOT EXISTS idx_restaurants_cover_images ON public.restaurants USING GIN (cover_images);
    END IF;
END $$;

-- Drop cover_image column (singular) from restaurants table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurants' 
        AND column_name = 'cover_image'
    ) THEN
        ALTER TABLE public.restaurants DROP COLUMN cover_image;
    END IF;
END $$;

-- Set featured foods (up to 10 available foods)
UPDATE public.foods 
SET is_featured = TRUE 
WHERE id IN (
    SELECT id 
    FROM public.foods 
    WHERE is_available = TRUE 
    ORDER BY rating DESC, created_at DESC 
    LIMIT 10
);

-- Add comment to foods table
COMMENT ON TABLE public.foods IS 'Foods table with featured items marked for display';

-- =====================================================
-- FOREIGN KEY CONSTRAINT FIXES
-- =====================================================

-- Fix follows table foreign key constraints
DO $$
BEGIN
    -- Drop existing constraints if they exist (with custom names)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'follows' 
        AND constraint_name = 'fk_follows_follower'
    ) THEN
        ALTER TABLE public.follows DROP CONSTRAINT fk_follows_follower;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'follows' 
        AND constraint_name = 'fk_follows_followed'
    ) THEN
        ALTER TABLE public.follows DROP CONSTRAINT fk_follows_followed;
    END IF;
    
    -- Add constraints with standard PostgreSQL naming
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'follows' 
        AND constraint_name = 'follows_follower_user_id_fkey'
    ) THEN
        ALTER TABLE public.follows 
        ADD CONSTRAINT follows_follower_user_id_fkey 
        FOREIGN KEY (follower_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'follows' 
        AND constraint_name = 'follows_followed_user_id_fkey'
    ) THEN
        ALTER TABLE public.follows 
        ADD CONSTRAINT follows_followed_user_id_fkey 
        FOREIGN KEY (followed_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Remove duplicate constraints from reviews table
DO $$
BEGIN
    -- Drop duplicate foreign key constraints if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'reviews' 
        AND constraint_name = 'reviews_user_id_fkey1'
    ) THEN
        ALTER TABLE public.reviews DROP CONSTRAINT reviews_user_id_fkey1;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'reviews' 
        AND constraint_name = 'reviews_restaurant_id_fkey1'
    ) THEN
        ALTER TABLE public.reviews DROP CONSTRAINT reviews_restaurant_id_fkey1;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'reviews' 
        AND constraint_name = 'reviews_food_id_fkey1'
    ) THEN
        ALTER TABLE public.reviews DROP CONSTRAINT reviews_food_id_fkey1;
    END IF;
END $$;

-- Fix reviews-profiles relationship with comprehensive checks
DO $$
BEGIN
    -- Check if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') 
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        
        -- Check if user_id column exists in both tables
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'user_id')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
            
            -- Clean up orphaned reviews (reviews without corresponding profiles)
            DELETE FROM public.reviews 
            WHERE user_id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL);
            
            -- Drop existing foreign key constraint if it exists
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_schema = 'public' 
                AND table_name = 'reviews' 
                AND constraint_name = 'reviews_user_id_profiles_fkey'
            ) THEN
                ALTER TABLE public.reviews DROP CONSTRAINT reviews_user_id_profiles_fkey;
            END IF;
            
            -- Add the foreign key constraint with explicit schema references
            ALTER TABLE public.reviews 
            ADD CONSTRAINT reviews_user_id_profiles_fkey 
            FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
            
            -- Create performance indexes
            CREATE INDEX IF NOT EXISTS idx_reviews_user_id_profiles ON public.reviews(user_id);
            CREATE INDEX IF NOT EXISTS idx_profiles_user_id_reviews ON public.profiles(user_id);
            
            -- Analyze tables for better query planning
            ANALYZE public.reviews;
            ANALYZE public.profiles;
        END IF;
    END IF;
END $$;

-- Fix review_likes foreign key constraint
DO $$
BEGIN
    -- Check if tables and columns exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_likes')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'review_likes' AND column_name = 'user_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
        
        -- Drop existing foreign key constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'review_likes' 
            AND constraint_name = 'review_likes_user_id_fkey'
        ) THEN
            ALTER TABLE public.review_likes DROP CONSTRAINT review_likes_user_id_fkey;
        END IF;
        
        -- Clean up orphaned review_likes
        DELETE FROM public.review_likes 
        WHERE user_id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL);
        
        -- Add the foreign key constraint to reference profiles.user_id
        ALTER TABLE public.review_likes 
        ADD CONSTRAINT review_likes_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_review_likes_user_id_profiles ON public.review_likes(user_id);
    END IF;
END $$;

-- Remove owner_id foreign key constraint from restaurants (make it nullable)
DO $$
BEGIN
    -- Drop the foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'restaurants' 
        AND constraint_name = 'restaurants_owner_id_fkey'
    ) THEN
        ALTER TABLE public.restaurants DROP CONSTRAINT restaurants_owner_id_fkey;
    END IF;
    
    -- Make owner_id nullable (it should already be nullable from the ADD COLUMN above)
    ALTER TABLE public.restaurants ALTER COLUMN owner_id DROP NOT NULL;
END $$;

-- =====================================================
-- RECREATE SEARCH VECTOR FUNCTION AND TRIGGER
-- =====================================================

-- Recreate the update_reviews_search_vector function with proper dependencies
CREATE OR REPLACE FUNCTION update_reviews_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the search vector with review text and user profile information
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.review_text, '') || ' ' ||
        COALESCE((SELECT username FROM public.profiles WHERE user_id = NEW.user_id), '') || ' ' ||
        COALESCE((SELECT full_name FROM public.profiles WHERE user_id = NEW.user_id), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_reviews_search_vector ON public.reviews;
CREATE TRIGGER trigger_update_reviews_search_vector
    BEFORE INSERT OR UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_search_vector();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on restaurants table
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurants table
CREATE POLICY "Public restaurants are viewable by everyone" ON public.restaurants
    FOR SELECT USING (true);

CREATE POLICY "Users can insert restaurants" ON public.restaurants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Restaurant owners can update their restaurants" ON public.restaurants
    FOR UPDATE USING (
        auth.uid() = owner_id OR 
        owner_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

CREATE POLICY "Restaurant owners and admins can delete restaurants" ON public.restaurants
    FOR DELETE USING (
        auth.uid() = owner_id OR 
        owner_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

-- Enable RLS on foods table
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for foods table
CREATE POLICY "Public foods are viewable by everyone" ON public.foods
    FOR SELECT USING (true);

CREATE POLICY "Restaurant owners can manage their foods" ON public.foods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants r 
            WHERE r.id = public.foods.restaurant_id 
            AND (r.owner_id = auth.uid() OR r.owner_id IS NULL)
        ) OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

-- Enable RLS on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews table
CREATE POLICY "Public reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own reviews" ON public.reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on review_likes table
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

-- Update RLS policy for review_likes to reference profiles.user_id
CREATE POLICY "Users can manage their own review likes" ON public.review_likes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND user_id = public.review_likes.user_id
        )
    );

-- Enable RLS on follows table
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows table
CREATE POLICY "Users can view follows" ON public.follows
    FOR SELECT USING (
        follower_user_id = auth.uid() OR 
        followed_user_id = auth.uid() OR
        status = 'accepted'
    );

CREATE POLICY "Users can manage their own follows" ON public.follows
    FOR ALL USING (follower_user_id = auth.uid());

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Enable RLS on review_replies table
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_replies table
CREATE POLICY "Public review replies are viewable by everyone" ON public.review_replies
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own review replies" ON public.review_replies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review replies" ON public.review_replies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review replies" ON public.review_replies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review replies" ON public.review_replies
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users table
CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.id::text = auth.uid()::text AND au.is_active = true
        )
    );

CREATE POLICY "Admins can manage admin users" ON public.admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.id::text = auth.uid()::text AND au.is_active = true AND au.role = 'super_admin'
        )
    );

-- Enable RLS on admin_sessions table
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_sessions table
CREATE POLICY "Admins can view their own sessions" ON public.admin_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.id = public.admin_sessions.admin_user_id AND au.id::text = auth.uid()::text
        )
    );

CREATE POLICY "Admins can manage their own sessions" ON public.admin_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.id = public.admin_sessions.admin_user_id AND au.id::text = auth.uid()::text
        )
    );

-- =====================================================
-- NOTIFICATION FUNCTIONS
-- =====================================================

-- Function to get notifications with sender info
CREATE OR REPLACE FUNCTION get_notifications_with_sender(
    target_user_id UUID,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0,
    unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    recipient_id UUID,
    sender_id UUID,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    data JSONB,
    read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    sender_username VARCHAR(50),
    sender_full_name VARCHAR(255),
    sender_profile_image_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.recipient_id,
        n.sender_id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.read,
        n.created_at,
        n.updated_at,
        p.username,
        p.full_name,
        p.profile_image_url
    FROM notifications n
    LEFT JOIN profiles p ON n.sender_id = p.user_id
    WHERE n.recipient_id = target_user_id
    AND (unread_only = FALSE OR n.read = FALSE)
    ORDER BY n.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_notifications_with_sender TO authenticated;

-- =====================================================
-- REVIEW REPLIES FUNCTIONS
-- =====================================================

-- Function to get threaded replies for a review
CREATE OR REPLACE FUNCTION get_threaded_replies(review_uuid UUID)
RETURNS TABLE (
    id UUID,
    review_id UUID,
    user_id UUID,
    reply_text TEXT,
    parent_reply_id UUID,
    likes_count INTEGER,
    is_public BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE reply_tree AS (
        -- Base case: top-level replies (no parent)
        SELECT 
            rr.id,
            rr.review_id,
            rr.user_id,
            rr.reply_text,
            rr.parent_reply_id,
            rr.likes_count,
            rr.is_public,
            rr.created_at,
            rr.updated_at,
            0 as level
        FROM review_replies rr
        WHERE rr.review_id = review_uuid 
        AND rr.parent_reply_id IS NULL
        AND rr.is_public = true
        
        UNION ALL
        
        -- Recursive case: child replies
        SELECT 
            rr.id,
            rr.review_id,
            rr.user_id,
            rr.reply_text,
            rr.parent_reply_id,
            rr.likes_count,
            rr.is_public,
            rr.created_at,
            rr.updated_at,
            rt.level + 1
        FROM review_replies rr
        INNER JOIN reply_tree rt ON rr.parent_reply_id = rt.id
        WHERE rr.is_public = true
        AND rt.level < 5  -- Limit nesting depth to prevent infinite recursion
    )
    SELECT * FROM reply_tree
    ORDER BY level, created_at;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_threaded_replies TO authenticated;

-- =====================================================
-- REFRESH MATERIALIZED VIEWS AND ANALYZE TABLES
-- =====================================================

-- Refresh any materialized views that might depend on the updated schema
-- (Add specific materialized view refreshes here if they exist)

-- Analyze all updated tables for better query planning
ANALYZE public.restaurants;
ANALYZE public.foods;
ANALYZE public.reviews;
ANALYZE public.profiles;
ANALYZE public.review_likes;
ANALYZE public.follows;
ANALYZE public.notifications;
ANALYZE public.review_replies;
ANALYZE public.admin_users;
ANALYZE public.admin_sessions;