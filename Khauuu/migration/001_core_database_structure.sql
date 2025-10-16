-- =====================================================
-- CONSOLIDATED MIGRATION 001: Core Database Structure
-- Description: Creates all core tables, extensions, and basic structure
-- Consolidates: 001_core_tables_and_structure.sql, 006_add_owner_id_to_restaurants.sql, 
--               013_create_admin_users_table.sql
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "http";

-- =====================================================
-- PROFILES TABLE
-- =====================================================

-- Create profiles table with all necessary fields
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Basic profile information
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    bio TEXT,
    profile_image_url TEXT,
    
    -- Contact and location information
    website VARCHAR(255),
    location VARCHAR(100),
    
    -- User preferences and settings
    is_vegetarian BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    
    -- Privacy settings
    reviews_public BOOLEAN DEFAULT true,
    saved_public BOOLEAN DEFAULT false,
    
    -- User role for admin/moderator functionality
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    
    -- Statistics (these will be calculated from other tables)
    reviews_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- =====================================================
-- RESTAURANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cuisine VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    email VARCHAR(255),
    
    -- Location data
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_name VARCHAR(255),
    maps_url TEXT,
    
    -- Business hours
    opening_hours JSONB,
    is_open BOOLEAN DEFAULT true,
    
    -- Ratings and reviews
    rating DECIMAL(3, 2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    
    -- Pricing
    price_range VARCHAR(10) DEFAULT '₹₹',
    
    -- Features and amenities
    features JSONB,
    tags JSONB,
    
    -- Media
    images JSONB,
    cover_images JSONB DEFAULT '[]'::jsonb,
    menu_images JSONB DEFAULT '[]'::jsonb,
    
    -- Status and verification
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Ownership (nullable to allow admin-created restaurants)
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- SEO and search
    slug VARCHAR(255) UNIQUE,
    search_vector tsvector,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for restaurants table
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON public.restaurants(name);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON public.restaurants(cuisine);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON public.restaurants(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON public.restaurants(rating DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_price_range ON public.restaurants(price_range);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON public.restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_search_vector ON public.restaurants USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_restaurants_cover_images ON public.restaurants USING gin(cover_images);

-- =====================================================
-- FOODS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.foods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100),
    
    -- Food properties
    is_vegetarian BOOLEAN DEFAULT false,
    
    -- Media and presentation
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Availability and status
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Ratings and popularity
    rating DECIMAL(3, 2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    
    -- SEO and search
    slug VARCHAR(255),
    search_vector tsvector,
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique slug per restaurant
    UNIQUE(restaurant_id, slug)
);

-- Create indexes for foods table
CREATE INDEX IF NOT EXISTS idx_foods_restaurant_id ON public.foods(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_foods_name ON public.foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_category ON public.foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_price ON public.foods(price);
CREATE INDEX IF NOT EXISTS idx_foods_is_vegetarian ON public.foods(is_vegetarian);
CREATE INDEX IF NOT EXISTS idx_foods_is_available ON public.foods(is_available);
CREATE INDEX IF NOT EXISTS idx_foods_rating ON public.foods(rating DESC);
CREATE INDEX IF NOT EXISTS idx_foods_search_vector ON public.foods USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_foods_is_featured ON foods(is_featured);

-- =====================================================
-- RESTAURANT CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.restaurant_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FOOD CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.food_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MENU TABLE
-- =====================================================

CREATE TABLE menu (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for menu table
CREATE INDEX IF NOT EXISTS idx_menu_restaurant_id ON menu(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu(category);
CREATE INDEX IF NOT EXISTS idx_menu_is_available ON menu(is_available);

-- =====================================================
-- REVIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- References to existing entities
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_images TEXT[],
    
    -- Engagement metrics
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    
    -- Privacy and status
    is_public BOOLEAN DEFAULT true,
    
    -- Search
    search_vector tsvector,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (
        (restaurant_id IS NOT NULL AND food_id IS NULL) OR 
        (restaurant_id IS NOT NULL AND food_id IS NOT NULL)
    )
);

-- Create indexes for reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_food_id ON reviews(food_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_is_public ON reviews(is_public);
CREATE INDEX IF NOT EXISTS idx_reviews_search_vector ON reviews USING gin(search_vector);

-- =====================================================
-- SAVED ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- References to saved entities
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, restaurant_id, food_id),
    CHECK (
        (restaurant_id IS NOT NULL AND food_id IS NULL) OR 
        (restaurant_id IS NOT NULL AND food_id IS NOT NULL)
    )
);

-- Create indexes for saved_items table
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_restaurant_id ON saved_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_food_id ON saved_items(food_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_created_at ON saved_items(created_at DESC);

-- =====================================================
-- ADMIN USERS TABLE
-- =====================================================

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Create admin_sessions table for session management
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for admin_sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.restaurants IS 'Restaurants table - owner_id is optional for admin-created entries';
COMMENT ON COLUMN public.restaurants.owner_id IS 'Optional owner reference - can be null for admin-created restaurants';
COMMENT ON COLUMN public.restaurants.cover_images IS 'Array of cover image URLs for the restaurant';
COMMENT ON COLUMN foods.is_featured IS 'Indicates if the food item is featured/highlighted';
COMMENT ON TABLE foods IS 'Foods table with featured items marked for display';
COMMENT ON TABLE admin_users IS 'Separate admin users table for admin panel authentication';
COMMENT ON TABLE admin_sessions IS 'Admin session management table';
COMMENT ON COLUMN admin_users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN admin_users.role IS 'Admin role: admin or super_admin';
COMMENT ON COLUMN admin_sessions.session_token IS 'JWT or secure session token';