import { supabase } from '@/lib/supabase'

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  description?: string
  address: string
  phone?: string
  website?: string
  email?: string
  latitude?: number
  longitude?: number
  location_name?: string
  maps_url?: string
  opening_hours?: any
  is_open?: boolean
  rating: number
  review_count: number
  price_range?: string
  features?: any
  tags?: any
  images?: any
  cover_images?: any
  menu_images?: any
  is_verified?: boolean
  is_featured?: boolean
  is_active?: boolean
  owner_id?: string
  slug?: string
  created_at: string
  updated_at: string
}

export interface RestaurantWithFoods extends Restaurant {
  foods?: Food[]
  menu_images?: any
}

export interface Food {
  id: string
  restaurant_id: string
  name: string
  description?: string
  price: number
  category?: string
  is_vegetarian?: boolean
  is_vegan?: boolean
  is_gluten_free?: boolean
  spice_level?: number
  images?: any
  is_available?: boolean
  preparation_time?: number
  rating: number
  review_count: number
  order_count: number
  slug?: string
  tags?: any
  created_at: string
  updated_at: string
}

export const restaurantService = {
  // Get restaurant by ID with foods
  async getById(id: string): Promise<RestaurantWithFoods | null> {
    try {
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (restaurantError) {
        console.error('Error fetching restaurant:', restaurantError)
        return null
      }

      // Get foods for this restaurant
      const { data: foods, error: foodsError } = await supabase
        .from('foods')
        .select('*')
        .eq('restaurant_id', id)
        .eq('is_available', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (foodsError) {
        console.error('Error fetching foods:', foodsError)
      }

      return {
        ...restaurant,
        foods: foods || []
      }
    } catch (error) {
      console.error('Error in getById:', error)
      return null
    }
  },

  // Get all restaurants
  async getAll(limit = 20, offset = 0): Promise<Restaurant[]> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching restaurants:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAll:', error)
      return []
    }
  },

  // Search restaurants
  async search(query: string, limit = 20): Promise<Restaurant[]> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,cuisine.ilike.%${query}%,address.ilike.%${query}%`)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error searching restaurants:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in search:', error)
      return []
    }
  },

  // Get featured restaurants
  async getFeatured(limit = 10): Promise<Restaurant[]> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching featured restaurants:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getFeatured:', error)
      return []
    }
  }
}