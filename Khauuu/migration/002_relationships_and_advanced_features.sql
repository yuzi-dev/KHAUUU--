-- =====================================================
-- CONSOLIDATED MIGRATION 002: Relationships and Advanced Features
-- Description: Creates follows, notifications, review replies, and all relationship tables
-- Consolidates: 002_follows_and_relationships.sql, 003_notifications_and_advanced_features.sql,
--               015_add_review_replies_support.sql
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "http";

-- =====================================================
-- FOLLOWS TABLE
-- =====================================================

-- Create follows table for user following relationships
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User relationships
    follower_user_id UUID NOT NULL,
    followed_user_id UUID NOT NULL,
    
    -- Follow status (for private account support)
    status VARCHAR(20) DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'blocked')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(follower_user_id, followed_user_id),
    CHECK (follower_user_id != followed_user_id)
);

-- Add foreign key constraints to profiles table
ALTER TABLE public.follows 
ADD CONSTRAINT fk_follows_follower 
FOREIGN KEY (follower_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.follows 
ADD CONSTRAINT fk_follows_followed 
FOREIGN KEY (followed_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_user_id ON public.follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_user_id ON public.follows(followed_user_id);
CREATE INDEX IF NOT EXISTS idx_follows_status ON public.follows(status);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at);
CREATE INDEX IF NOT EXISTS idx_follows_follower_status ON public.follows(follower_user_id, status);
CREATE INDEX IF NOT EXISTS idx_follows_followed_status ON public.follows(followed_user_id, status);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('review', 'follow', 'follow_request', 'follow_accepted', 'like', 'comment', 'mention')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, read);

-- =====================================================
-- REVIEW REPLIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS review_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Reply content (no rating for replies, only main reviews have ratings)
    reply_text TEXT NOT NULL,
    
    -- Threaded replies support
    parent_reply_id UUID REFERENCES review_replies(id) ON DELETE CASCADE,
    
    -- Engagement metrics
    likes_count INTEGER DEFAULT 0,
    
    -- Privacy and status
    is_public BOOLEAN DEFAULT true,
    
    -- Search
    search_vector tsvector,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for review_replies table
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_user_id ON review_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_parent_reply_id ON review_replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_created_at ON review_replies(created_at);
CREATE INDEX IF NOT EXISTS idx_review_replies_public ON review_replies(is_public);
CREATE INDEX IF NOT EXISTS idx_review_replies_search_vector ON review_replies USING gin(search_vector);

-- =====================================================
-- REVIEW LIKES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS review_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES review_replies(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints: can like either a review or a reply, but not both
    CHECK (
        (review_id IS NOT NULL AND reply_id IS NULL) OR 
        (review_id IS NULL AND reply_id IS NOT NULL)
    ),
    
    -- Unique constraint: user can only like a review/reply once
    UNIQUE(user_id, review_id, reply_id)
);

-- Create indexes for review_likes table
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_reply_id ON review_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_created_at ON review_likes(created_at);

-- =====================================================
-- PARTITIONED NOTIFICATIONS TABLE
-- =====================================================

-- Create partitioned notifications table
CREATE TABLE IF NOT EXISTS notifications_partitioned (
    id UUID DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    sender_id UUID,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT notifications_partitioned_pkey PRIMARY KEY (id, created_at),
    CONSTRAINT notifications_partitioned_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT notifications_partitioned_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT notifications_partitioned_type_check CHECK (type IN ('review', 'follow', 'follow_request', 'follow_accepted', 'like', 'comment', 'mention'))
) PARTITION BY RANGE (created_at);

-- Create current and next month partitions
DO $$
DECLARE
    current_month_start DATE;
    current_month_end DATE;
    next_month_start DATE;
    next_month_end DATE;
    current_partition_name TEXT;
    next_partition_name TEXT;
BEGIN
    -- Calculate current month boundaries
    current_month_start := date_trunc('month', CURRENT_DATE);
    current_month_end := current_month_start + INTERVAL '1 month';
    
    -- Calculate next month boundaries
    next_month_start := current_month_end;
    next_month_end := next_month_start + INTERVAL '1 month';
    
    -- Generate partition names
    current_partition_name := 'notifications_' || to_char(current_month_start, 'YYYY_MM');
    next_partition_name := 'notifications_' || to_char(next_month_start, 'YYYY_MM');
    
    -- Create current month partition
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF notifications_partitioned
        FOR VALUES FROM (%L) TO (%L)',
        current_partition_name, current_month_start, current_month_end
    );
    
    -- Create next month partition
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF notifications_partitioned
        FOR VALUES FROM (%L) TO (%L)',
        next_partition_name, next_month_start, next_month_end
    );
END $$;

-- Create indexes on partitioned table
CREATE INDEX IF NOT EXISTS idx_notifications_partitioned_recipient_id ON notifications_partitioned(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_partitioned_sender_id ON notifications_partitioned(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_partitioned_type ON notifications_partitioned(type);
CREATE INDEX IF NOT EXISTS idx_notifications_partitioned_read ON notifications_partitioned(read);
CREATE INDEX IF NOT EXISTS idx_notifications_partitioned_recipient_read ON notifications_partitioned(recipient_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_partitioned_data ON notifications_partitioned USING GIN (data);

-- =====================================================
-- VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate notification data structure
CREATE OR REPLACE FUNCTION validate_notification_data(data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow empty object
    IF data = '{}'::jsonb THEN
        RETURN TRUE;
    END IF;
    
    -- Check for valid JSON structure (basic validation)
    IF NOT jsonb_typeof(data) = 'object' THEN
        RETURN FALSE;
    END IF;
    
    -- Validate specific fields if they exist
    IF data ? 'user_id' AND NOT (data->>'user_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
        RETURN FALSE;
    END IF;
    
    IF data ? 'restaurant_id' AND NOT (data->>'restaurant_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
        RETURN FALSE;
    END IF;
    
    IF data ? 'food_id' AND NOT (data->>'food_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
        RETURN FALSE;
    END IF;
    
    IF data ? 'review_id' AND NOT (data->>'review_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
        RETURN FALSE;
    END IF;
    
    -- Validate numeric fields
    IF data ? 'rating' THEN
        BEGIN
            IF (data->>'rating')::NUMERIC < 1 OR (data->>'rating')::NUMERIC > 5 THEN
                RETURN FALSE;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RETURN FALSE;
        END;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate food images structure
CREATE OR REPLACE FUNCTION validate_food_images(images JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow null or empty array
    IF images IS NULL OR images = '[]'::jsonb THEN
        RETURN TRUE;
    END IF;
    
    -- Must be an array
    IF NOT jsonb_typeof(images) = 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Validate each image object in the array
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate menu images structure
CREATE OR REPLACE FUNCTION validate_menu_images(images JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow null or empty array
    IF images IS NULL OR images = '[]'::jsonb THEN
        RETURN TRUE;
    END IF;
    
    -- Must be an array
    IF NOT jsonb_typeof(images) = 'array' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate food tags structure
CREATE OR REPLACE FUNCTION validate_food_tags(tags JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow null or empty array
    IF tags IS NULL OR tags = '[]'::jsonb THEN
        RETURN TRUE;
    END IF;
    
    -- Must be an array
    IF NOT jsonb_typeof(tags) = 'array' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add JSONB constraints to notifications table
ALTER TABLE notifications 
ADD CONSTRAINT check_notification_data_valid 
CHECK (validate_notification_data(data));

-- =====================================================
-- FOLLOW RELATIONSHIP FUNCTIONS
-- =====================================================

-- Function to update follower statistics
CREATE OR REPLACE FUNCTION update_follower_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update follower count for the followed user
    IF TG_OP = 'INSERT' THEN
        -- Only count accepted follows
        IF NEW.status = 'accepted' THEN
            UPDATE profiles 
            SET followers_count = (
                SELECT COUNT(*) 
                FROM follows 
                WHERE followed_user_id = NEW.followed_user_id 
                AND status = 'accepted'
            )
            WHERE user_id = NEW.followed_user_id;
            
            -- Update following count for the follower
            UPDATE profiles 
            SET following_count = (
                SELECT COUNT(*) 
                FROM follows 
                WHERE follower_user_id = NEW.follower_user_id 
                AND status = 'accepted'
            )
            WHERE user_id = NEW.follower_user_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != NEW.status THEN
            -- Update follower count for the followed user
            UPDATE profiles 
            SET followers_count = (
                SELECT COUNT(*) 
                FROM follows 
                WHERE followed_user_id = NEW.followed_user_id 
                AND status = 'accepted'
            )
            WHERE user_id = NEW.followed_user_id;
            
            -- Update following count for the follower
            UPDATE profiles 
            SET following_count = (
                SELECT COUNT(*) 
                FROM follows 
                WHERE follower_user_id = NEW.follower_user_id 
                AND status = 'accepted'
            )
            WHERE user_id = NEW.follower_user_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Only update if the deleted follow was accepted
        IF OLD.status = 'accepted' THEN
            -- Update follower count for the followed user
            UPDATE profiles 
            SET followers_count = (
                SELECT COUNT(*) 
                FROM follows 
                WHERE followed_user_id = OLD.followed_user_id 
                AND status = 'accepted'
            )
            WHERE user_id = OLD.followed_user_id;
            
            -- Update following count for the follower
            UPDATE profiles 
            SET following_count = (
                SELECT COUNT(*) 
                FROM follows 
                WHERE follower_user_id = OLD.follower_user_id 
                AND status = 'accepted'
            )
            WHERE user_id = OLD.follower_user_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update restaurant rating
CREATE OR REPLACE FUNCTION update_restaurant_rating()
RETURNS TRIGGER AS $$
DECLARE
    restaurant_id_to_update UUID;
BEGIN
    -- Determine which restaurant to update
    IF TG_OP = 'DELETE' THEN
        restaurant_id_to_update := OLD.restaurant_id;
    ELSE
        restaurant_id_to_update := NEW.restaurant_id;
    END IF;
    
    -- Update restaurant rating and review count (ONLY for restaurant reviews, exclude food reviews)
    UPDATE public.restaurants 
    SET 
        rating = COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 2) 
            FROM reviews 
            WHERE restaurant_id = restaurant_id_to_update 
            AND is_public = true
            AND food_id IS NULL  -- Only count restaurant reviews, not food reviews
        ), 0),
        review_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE restaurant_id = restaurant_id_to_update 
            AND is_public = true
            AND food_id IS NULL  -- Only count restaurant reviews, not food reviews
        )
    WHERE id = restaurant_id_to_update;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is following another user
CREATE OR REPLACE FUNCTION is_following(follower_id UUID, followed_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_user_id = follower_id 
        AND followed_user_id = followed_id 
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get follower count for a user
CREATE OR REPLACE FUNCTION get_follower_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM follows 
        WHERE followed_user_id = user_id 
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get following count for a user
CREATE OR REPLACE FUNCTION get_following_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM follows 
        WHERE follower_user_id = user_id 
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get mutual follows between two users
CREATE OR REPLACE FUNCTION get_mutual_follows(user_id UUID)
RETURNS TABLE(mutual_user_id UUID, username VARCHAR, full_name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        p.username,
        p.full_name
    FROM profiles p
    WHERE p.user_id IN (
        -- Users that both follow each other
        SELECT f1.followed_user_id
        FROM follows f1
        WHERE f1.follower_user_id = user_id
        AND f1.status = 'accepted'
        AND EXISTS (
            SELECT 1 FROM follows f2
            WHERE f2.follower_user_id = f1.followed_user_id
            AND f2.followed_user_id = user_id
            AND f2.status = 'accepted'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER FUNCTIONS FOR REVIEW REPLIES
-- =====================================================

-- Update search vector for review replies
CREATE OR REPLACE FUNCTION update_reply_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.reply_text, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update comments count in reviews when replies are added/removed
CREATE OR REPLACE FUNCTION update_review_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews 
        SET comments_count = comments_count + 1,
            updated_at = NOW()
        WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews 
        SET comments_count = GREATEST(comments_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update likes count for reviews/replies when likes are added/removed
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.review_id IS NOT NULL THEN
            UPDATE reviews 
            SET likes_count = likes_count + 1,
                updated_at = NOW()
            WHERE id = NEW.review_id;
        ELSIF NEW.reply_id IS NOT NULL THEN
            UPDATE review_replies 
            SET likes_count = likes_count + 1,
                updated_at = NOW()
            WHERE id = NEW.reply_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.review_id IS NOT NULL THEN
            UPDATE reviews 
            SET likes_count = GREATEST(likes_count - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.review_id;
        ELSIF OLD.reply_id IS NOT NULL THEN
            UPDATE review_replies 
            SET likes_count = GREATEST(likes_count - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.reply_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger for notifications
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Trigger for follower statistics
CREATE TRIGGER trigger_update_follower_stats
    AFTER INSERT OR UPDATE OR DELETE ON follows
    FOR EACH ROW
    EXECUTE FUNCTION update_follower_stats();

-- Trigger for review reply search vector
CREATE TRIGGER trigger_update_reply_search_vector
    BEFORE INSERT OR UPDATE ON review_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_reply_search_vector();

-- Trigger for review comments count
CREATE TRIGGER trigger_update_review_comments_count
    AFTER INSERT OR DELETE ON review_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_review_comments_count();

-- Trigger for likes count
CREATE TRIGGER trigger_update_likes_count
    AFTER INSERT OR DELETE ON review_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_likes_count();

-- Trigger for notifications updated_at
CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Migrate data from old table to partitioned table
INSERT INTO notifications_partitioned (
    id, recipient_id, sender_id, type, title, message, data, read, created_at, updated_at
)
SELECT 
    id, recipient_id, sender_id, type, title, message, data, read, created_at, updated_at
FROM notifications
ON CONFLICT DO NOTHING;