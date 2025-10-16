import { supabase } from '@/lib/supabase'

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

export interface FoodWithRestaurant extends Food {
  restaurant?: {
    id: string
    name: string
    cuisine: string
    address: string
    phone?: string
    rating: number
    review_count: number
    price_range?: string
    images?: any
    cover_images?: any
    opening_hours?: any
    is_open?: boolean
  }
}

export const foodService = {
  // Get food by ID with restaurant details
  async getById(id: string): Promise<FoodWithRestaurant | null> {
    try {
      const { data: food, error: foodError } = await supabase
        .from('foods')
        .select(`
          *,
          restaurants!inner (
            id,
            name,
            cuisine,
            address,
            phone,
            rating,
            review_count,
            price_range,
            images,
            cover_images,
            opening_hours,
            is_open
          )
        `)
        .eq('id', id)
        .eq('is_available', true)
        .single()

      if (foodError) {
        console.error('Error fetching food:', foodError)
        return null
      }

      return {
        ...food,
        restaurant: food.restaurants
      }
    } catch (error) {
      console.error('Error in getById:', error)
      return null
    }
  },

  // Get foods by restaurant ID
  async getByRestaurantId(restaurantId: string): Promise<Food[]> {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching foods by restaurant:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getByRestaurantId:', error)
      return []
    }
  },

  // Get all foods
  async getAll(limit = 20, offset = 0): Promise<Food[]> {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('is_available', true)
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching foods:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAll:', error)
      return []
    }
  },

  // Search foods
  async search(query: string, limit = 20): Promise<FoodWithRestaurant[]> {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select(`
          *,
          restaurants!inner (
            id,
            name,
            cuisine,
            address,
            phone,
            rating,
            review_count,
            price_range,
            images,
            cover_images,
            opening_hours,
            is_open
          )
        `)
        .eq('is_available', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error searching foods:', error)
        return []
      }

      return data?.map(food => ({
        ...food,
        restaurant: food.restaurants
      })) || []
    } catch (error) {
      console.error('Error in search:', error)
      return []
    }
  },

  // Get foods by category
  async getByCategory(category: string, limit = 20): Promise<FoodWithRestaurant[]> {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select(`
          *,
          restaurants!inner (
            id,
            name,
            cuisine,
            address,
            phone,
            rating,
            review_count,
            price_range,
            images,
            cover_images,
            opening_hours,
            is_open
          )
        `)
        .eq('is_available', true)
        .eq('category', category)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching foods by category:', error)
        return []
      }

      return data?.map(food => ({
        ...food,
        restaurant: food.restaurants
      })) || []
    } catch (error) {
      console.error('Error in getByCategory:', error)
      return []
    }
  },

  // Get popular foods
  async getPopular(limit = 10): Promise<FoodWithRestaurant[]> {
    try {
      // First try the full query with join
      let { data, error } = await supabase
        .from('foods')
        .select(`
          *,
          restaurants!inner (
            id,
            name,
            cuisine,
            address,
            phone,
            rating,
            review_count,
            price_range,
            images,
            cover_images,
            opening_hours,
            is_open
          )
        `)
        .eq('is_available', true)
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      // If we get an RLS policy error, try a simpler approach
      if (error && (error.code === '42P17' || error.message?.includes('infinite recursion'))) {
        console.warn('RLS policy issue detected, trying alternative approach...')
        
        // Try without the inner join first
        const { data: foodsData, error: foodsError } = await supabase
          .from('foods')
          .select('*')
          .eq('is_available', true)
          .eq('is_featured', true)
          .order('rating', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(limit)

        if (foodsError) {
          console.error('Error fetching foods without join:', foodsError)
          return []
        }

        if (!foodsData || foodsData.length === 0) {
          console.log('No featured foods found')
          return []
        }

        // Fetch restaurants separately
        const restaurantIds = [...new Set(foodsData.map(food => food.restaurant_id))]
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .from('restaurants')
          .select(`
            id,
            name,
            cuisine,
            address,
            phone,
            rating,
            review_count,
            price_range,
            images,
            cover_images,
            opening_hours,
            is_open
          `)
          .in('id', restaurantIds)

        if (restaurantsError) {
          console.warn('Error fetching restaurants, returning foods without restaurant data:', restaurantsError)
          return foodsData.map(food => ({ ...food, restaurant: undefined }))
        }

        // Combine the data
        const restaurantMap = new Map(restaurantsData?.map(r => [r.id, r]) || [])
        
        return foodsData.map(food => ({
          ...food,
          restaurant: restaurantMap.get(food.restaurant_id)
        }))
      }

      if (error) {
        console.error('Error fetching popular foods:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return []
      }

      if (!data || data.length === 0) {
        console.log('No featured popular foods found in database')
        return []
      }

      return data?.map(food => ({
        ...food,
        restaurant: food.restaurants
      })) || []
    } catch (err) {
      console.error('Unexpected error in getPopular:', err)
      return []
    }
  },
}