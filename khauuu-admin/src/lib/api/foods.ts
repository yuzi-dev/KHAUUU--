import type { Food, CreateFoodData } from '@/types/database'

// Food API functions - using secure API routes
export const foodApi = {
  // Get all foods
  async getAll(restaurantId?: string): Promise<Food[]> {
    const url = restaurantId 
      ? `/api/foods?restaurant_id=${restaurantId}`
      : '/api/foods'
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch foods')
    }
    return response.json()
  },

  // Get food by ID
  async getById(id: string): Promise<Food | null> {
    const response = await fetch(`/api/foods/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch food')
    }
    return response.json()
  },

  // Create food
  async create(foodData: CreateFoodData): Promise<Food> {
    const response = await fetch('/api/foods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(foodData),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create food')
    }
    
    return response.json()
  },

  // Update food
  async update(id: string, foodData: Partial<CreateFoodData>): Promise<Food> {
    const response = await fetch(`/api/foods/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(foodData),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update food')
    }
    
    return response.json()
  },

  // Delete food
  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/foods/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete food')
    }
  },

  // Search foods
  async search(query: string, restaurantId?: string): Promise<Food[]> {
    const url = restaurantId 
      ? `/api/foods?search=${encodeURIComponent(query)}&restaurant_id=${restaurantId}`
      : `/api/foods?search=${encodeURIComponent(query)}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to search foods')
    }
    return response.json()
  }
}