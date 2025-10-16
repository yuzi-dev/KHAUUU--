import type { Restaurant, CreateRestaurantData } from '@/types/database'

// Restaurant API functions - now using secure API routes
export const restaurantApi = {
  // Get all restaurants
  async getAll(): Promise<Restaurant[]> {
    const response = await fetch('/api/restaurants')
    if (!response.ok) {
      throw new Error('Failed to fetch restaurants')
    }
    return response.json()
  },

  // Get restaurant by ID
  async getById(id: string): Promise<Restaurant | null> {
    const response = await fetch(`/api/restaurants/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch restaurant')
    }
    return response.json()
  },

  // Create restaurant
  async create(restaurantData: CreateRestaurantData): Promise<Restaurant> {
    const response = await fetch('/api/restaurants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(restaurantData),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create restaurant')
    }
    
    return response.json()
  },

  // Update restaurant
  async update(id: string, restaurantData: Partial<CreateRestaurantData>): Promise<Restaurant> {
    const response = await fetch(`/api/restaurants/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(restaurantData),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update restaurant')
    }
    
    return response.json()
  },

  // Delete restaurant
  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/restaurants/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete restaurant')
    }
  },

  // Search restaurants
  async search(query: string): Promise<Restaurant[]> {
    const response = await fetch(`/api/restaurants?search=${encodeURIComponent(query)}`)
    if (!response.ok) {
      throw new Error('Failed to search restaurants')
    }
    return response.json()
  }
}