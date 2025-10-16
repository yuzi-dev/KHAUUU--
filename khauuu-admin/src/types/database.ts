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
  is_open: boolean
  rating: number
  review_count: number
  price_range: string
  features?: any
  tags?: any
  images?: any
  cover_images?: string[]
  menu_images?: any
  is_verified: boolean
  is_featured: boolean
  is_active: boolean
  owner_id: string
  slug?: string
  search_vector?: any
  created_at: string
  updated_at: string
}

export interface Food {
  id: string
  restaurant_id: string
  name: string
  description?: string
  price: number
  category?: string
  is_vegetarian: boolean
  images?: any
  is_available: boolean
  rating: number
  review_count: number
  slug?: string
  search_vector?: any
  tags?: any
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface RestaurantCategory {
  id: string
  name: string
  description?: string
  icon?: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface FoodCategory {
  id: string
  name: string
  description?: string
  icon?: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface CreateRestaurantData {
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
  price_range?: string
  features?: any
  tags?: any
  images?: (string | File)[]
  cover_images?: (string | File)[]
  menu_images?: (string | File)[]
  is_verified?: boolean
  is_featured?: boolean
  is_active?: boolean
  owner_id?: string // Made optional
}

export interface CreateFoodData {
  restaurant_id: string
  name: string
  description?: string
  price: number
  category?: string
  is_vegetarian?: boolean
  images?: any
  is_available?: boolean
  is_featured?: boolean
  tags?: any
}

export interface Menu {
  id: string
  restaurant_id: string
  name: string
  description?: string
  category?: string
  price: number
  is_available: boolean
  images?: any
  created_at: string
  updated_at: string
}

export interface CreateMenuData {
  restaurant_id: string
  name: string
  description?: string
  category?: string
  price: number
  is_available?: boolean
  images?: (string | File)[]
}