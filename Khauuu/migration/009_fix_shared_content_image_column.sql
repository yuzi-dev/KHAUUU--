-- =====================================================
-- Migration: Fix Shared Content Image Column Reference
-- File: 009_fix_shared_content_image_column.sql
-- Description: Fix the get_shared_content_details function to use correct column names
-- =====================================================

-- Update the get_shared_content_details function to use correct column names
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
                        foods.images,
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