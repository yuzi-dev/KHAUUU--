import { supabase } from './supabase'
import type { Restaurant, Food, CreateRestaurantData, CreateFoodData } from '@/types/database'

// Restaurant API functions
export const restaurantApi = {
  // Get all restaurants
  async getAll(): Promise<Restaurant[]> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get restaurant by ID
  async getById(id: string): Promise<Restaurant | null> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Create restaurant
  async create(restaurantData: CreateRestaurantData): Promise<Restaurant> {
    const { data, error } = await supabase
      .from('restaurants')
      .insert([restaurantData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update restaurant
  async update(id: string, restaurantData: Partial<CreateRestaurantData>): Promise<Restaurant> {
    const { data, error } = await supabase
      .from('restaurants')
      .update({ ...restaurantData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete restaurant
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Search restaurants
  async search(query: string): Promise<Restaurant[]> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .or(`name.ilike.%${query}%,cuisine.ilike.%${query}%,address.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}

// Re-export foodApi from the new location for backward compatibility
export { foodApi } from './api/foods'