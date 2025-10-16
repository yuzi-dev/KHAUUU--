import { supabase } from '@/lib/supabase'

export interface Review {
  id: string
  user_id: string
  restaurant_id?: string
  food_id?: string
  rating: number
  review_text?: string
  likes_count: number
  comments_count: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface ReviewWithDetails extends Review {
  user?: {
    id: string
    username: string
    full_name: string
    profile_image_url?: string
    is_verified: boolean
  }
  restaurant?: {
    id: string
    name: string
    cuisine: string
    address: string
    cover_images?: any
  }
  food?: {
    id: string
    name: string
    price: number
    category?: string
    images?: any
  }
  user_liked?: boolean
  replies?: ReviewReplyWithDetails[]
}

export interface ReviewReply {
  id: string
  review_id: string
  user_id: string
  parent_reply_id?: string
  reply_text: string
  likes_count: number
  is_public: boolean
  created_at: string
  updated_at: string
  depth: number
}

export interface ReviewReplyWithDetails extends ReviewReply {
  user?: {
    id: string
    username: string
    full_name: string
    profile_image_url?: string
    is_verified: boolean
  }
  user_liked?: boolean
  replies?: ReviewReplyWithDetails[]
}

export interface CreateReviewData {
  restaurant_id?: string
  food_id?: string
  rating: number
  review_text?: string
  is_public?: boolean
}

export interface CreateReplyData {
  review_id: string
  parent_reply_id?: string
  reply_text: string
  is_public?: boolean
}

export const reviewService = {
  // Get reviews with optional filters
  async getReviews(params: {
    restaurant_id?: string
    food_id?: string
    user_id?: string
    limit?: number
    offset?: number
  }): Promise<ReviewWithDetails[]> {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles (
            user_id,
            username,
            full_name,
            profile_image_url,
            is_verified
          ),
          restaurants (
            id,
            name,
            cuisine,
            address,
            cover_images
          ),
          foods (
            id,
            name,
            price,
            category,
            images
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (params.restaurant_id && params.food_id) {
        // When both restaurant_id and food_id are provided, get specific food review
        query = query.eq('restaurant_id', params.restaurant_id).eq('food_id', params.food_id)
      } else if (params.restaurant_id) {
        // When only restaurant_id is provided, get only restaurant reviews (exclude food reviews)
        query = query.eq('restaurant_id', params.restaurant_id).is('food_id', null)
      } else if (params.food_id) {
        // When only food_id is provided, get specific food review
        query = query.eq('food_id', params.food_id)
      }

      if (params.user_id) {
        query = query.eq('user_id', params.user_id)
      }

      if (params.limit) {
        const offset = params.offset || 0
        query = query.range(offset, offset + params.limit - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching reviews:', error.message || error)
        return []
      }

      return data?.map(review => ({
        ...review,
        user: review.profiles ? {
          id: review.profiles.user_id,
          username: review.profiles.username,
          full_name: review.profiles.full_name,
          profile_image_url: review.profiles.profile_image_url,
          is_verified: review.profiles.is_verified
        } : undefined,
        restaurant: review.restaurants,
        food: review.foods
      })) || []
    } catch (error) {
      console.error('Error in getReviews:', error)
      return []
    }
  },

  // Get single review by ID
  async getById(id: string): Promise<ReviewWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!inner (
            user_id,
            username,
            full_name,
            profile_image_url,
            is_verified
          ),
          restaurants (
            id,
            name,
            cuisine,
            address,
            cover_images
          ),
          foods (
            id,
            name,
            price,
            category,
            images
          )
        `)
        .eq('id', id)
        .eq('is_public', true)
        .single()

      if (error) {
        console.error('Error fetching review:', error)
        return null
      }

      return {
        ...data,
        user: data.profiles ? {
          id: data.profiles.user_id,
          username: data.profiles.username,
          full_name: data.profiles.full_name,
          profile_image_url: data.profiles.profile_image_url,
          is_verified: data.profiles.is_verified
        } : undefined,
        restaurant: data.restaurants,
        food: data.foods
      }
    } catch (error) {
      console.error('Error in getById:', error)
      return null
    }
  },

  // Create a new review
  async create(reviewData: CreateReviewData, token: string): Promise<Review | null> {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create review')
      }

      const result = await response.json()
      return result.review
    } catch (error) {
      console.error('Error creating review:', error)
      throw error
    }
  },

  // Update a review
  async update(id: string, reviewData: Partial<CreateReviewData>, token: string): Promise<Review | null> {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update review')
      }

      const result = await response.json()
      return result.review
    } catch (error) {
      console.error('Error updating review:', error)
      throw error
    }
  },

  // Delete a review
  async delete(id: string, token: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete review')
      }

      return true
    } catch (error) {
      console.error('Error deleting review:', error)
      throw error
    }
  },

  // Get replies for a review
  async getReplies(reviewId: string): Promise<ReviewReplyWithDetails[]> {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/replies`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch replies')
      }

      const result = await response.json()
      return result.replies || []
    } catch (error) {
      console.error('Error fetching replies:', error)
      return []
    }
  },

  // Create a reply
  async createReply(replyData: CreateReplyData, token: string): Promise<ReviewReply | null> {
    try {
      const response = await fetch(`/api/reviews/${replyData.review_id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(replyData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create reply')
      }

      const result = await response.json()
      return result.reply
    } catch (error) {
      console.error('Error creating reply:', error)
      throw error
    }
  },

  // Update a reply
  async updateReply(replyId: string, replyData: { reply_text: string }, token: string): Promise<ReviewReply | null> {
    try {
      const response = await fetch(`/api/reviews/replies/${replyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(replyData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update reply')
      }

      const result = await response.json()
      return result.reply
    } catch (error) {
      console.error('Error updating reply:', error)
      throw error
    }
  },

  // Delete a reply
  async deleteReply(replyId: string, token: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/reviews/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete reply')
      }

      return true
    } catch (error) {
      console.error('Error deleting reply:', error)
      throw error
    }
  },

  // Like/unlike a review or reply
  async toggleLike(params: { review_id?: string; reply_id?: string }, token: string): Promise<{ liked: boolean; likes_count: number }> {
    try {
      // First check if already liked
      const checkResponse = await fetch(`/api/reviews/likes?${new URLSearchParams(params as any)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!checkResponse.ok) {
        throw new Error('Failed to check like status')
      }

      const checkResult = await checkResponse.json()
      const isLiked = checkResult.user_liked

      let response
      if (isLiked) {
        // Unlike
        response = await fetch(`/api/reviews/likes?${new URLSearchParams(params as any)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      } else {
        // Like
        response = await fetch('/api/reviews/likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(params)
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle like')
      }

      // Get updated like count
      const updatedResponse = await fetch(`/api/reviews/likes?${new URLSearchParams(params as any)}`)
      const updatedResult = await updatedResponse.json()

      return {
        liked: !isLiked,
        likes_count: updatedResult.total_likes || 0
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      throw error
    }
  },

  // Get likes for a review or reply
  async getLikes(params: { review_id?: string; reply_id?: string }, token?: string): Promise<{
    likes: Array<{
      id: string
      user: {
        id: string
        username: string
        full_name: string
        profile_image_url?: string
        is_verified: boolean
      }
      created_at: string
    }>
    total_likes: number
    user_liked: boolean
  }> {
    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/reviews/likes?${new URLSearchParams(params as any)}`, {
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to fetch likes')
      }

      const result = await response.json()
      return {
        likes: result.likes || [],
        total_likes: result.total_likes || 0,
        user_liked: result.user_liked || false
      }
    } catch (error) {
      console.error('Error fetching likes:', error)
      return {
        likes: [],
        total_likes: 0,
        user_liked: false
      }
    }
  }
}