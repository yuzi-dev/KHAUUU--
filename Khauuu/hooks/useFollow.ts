import { useState, useCallback } from 'react'
import { useToast } from './use-toast'
import { Session } from '@supabase/supabase-js'

interface FollowStatus {
  is_following: boolean
  is_followed_by: boolean
  is_mutual: boolean
  is_self: boolean
  is_pending: boolean
}

interface FollowData {
  id: string
  created_at: string
  status: string
  profiles: {
    user_id: string
    username: string
    full_name: string
    avatar_url: string | null
    bio: string | null
  }
}

interface UseFollowReturn {
  isLoading: boolean
  followStatus: FollowStatus | null
  followers: FollowData[]
  following: FollowData[]
  mutualFollows: any[]
  followUser: (userId: string) => Promise<boolean>
  unfollowUser: (userId: string) => Promise<boolean>
  getFollowStatus: (userId: string) => Promise<void>
  getFollowers: (userId: string) => Promise<void>
  getFollowing: (userId: string) => Promise<void>
  getMutualFollows: (userId: string) => Promise<void>
  refreshFollowData: (userId: string) => Promise<void>
}

export const useFollow = (session?: Session | null): UseFollowReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null)
  const [followers, setFollowers] = useState<FollowData[]>([])
  const [following, setFollowing] = useState<FollowData[]>([])
  const [mutualFollows, setMutualFollows] = useState<any[]>([])
  const { toast } = useToast()

  const followUser = useCallback(async (userId: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // Add authorization header if session exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/follows', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          followed_user_id: userId,
          action: 'follow'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to follow user')
      }

      // Update follow status based on response
      if (data.status === 'pending') {
        setFollowStatus(prev => prev ? { ...prev, is_following: false } : null)
      } else {
        setFollowStatus(prev => prev ? { ...prev, is_following: true } : null)
      }

      toast({
        title: "Success",
        description: data.message || "Successfully followed user",
      })

      return true
    } catch (error) {
      console.error('Follow error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to follow user",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [toast, session?.access_token])

  const unfollowUser = useCallback(async (userId: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // Add authorization header if session exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/follows', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          followed_user_id: userId,
          action: 'unfollow'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unfollow user')
      }

      // Update follow status
      setFollowStatus(prev => prev ? { ...prev, is_following: false } : null)

      toast({
        title: "Success",
        description: "Successfully unfollowed user",
      })

      return true
    } catch (error) {
      console.error('Unfollow error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unfollow user",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [toast, session?.access_token])

  const getFollowStatus = useCallback(async (userId: string): Promise<void> => {
    try {
      const headers: HeadersInit = {}

      // Add authorization header if session exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/follows/status?target_user_id=${userId}`, { headers })
      const data = await response.json()

      if (!response.ok) {
        // If unauthorized and no session, set empty follow status instead of throwing error
        if (response.status === 401 && !session?.access_token) {
          setFollowStatus({
            is_following: false,
            is_followed_by: false,
            is_mutual: false,
            is_self: false,
            is_pending: false
          })
          return
        }
        throw new Error(data.error || 'Failed to get follow status')
      }

      setFollowStatus(data)
    } catch (error) {
      console.error('Get follow status error:', error)
      // Set default status when there's an error
      setFollowStatus({
        is_following: false,
        is_followed_by: false,
        is_mutual: false,
        is_self: false,
        is_pending: false
      })
    }
  }, [session?.access_token])

  const getFollowers = useCallback(async (userId: string): Promise<void> => {
    setIsLoading(true)
    try {
      const headers: HeadersInit = {}

      // Add authorization header if session exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/follows?user_id=${userId}&type=followers`, { headers })
      const data = await response.json()

      if (!response.ok) {
        // If unauthorized and no session, set empty followers instead of throwing error
        if (response.status === 401 && !session?.access_token) {
          setFollowers([])
          return
        }
        throw new Error(data.error || 'Failed to get followers')
      }

      setFollowers(data.followers || [])
    } catch (error) {
      console.error('Get followers error:', error)
      setFollowers([])
      if (session?.access_token) {
        toast({
          title: "Error",
          description: "Failed to load followers",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast, session?.access_token])

  const getFollowing = useCallback(async (userId: string): Promise<void> => {
    setIsLoading(true)
    try {
      const headers: HeadersInit = {}

      // Add authorization header if session exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/follows?user_id=${userId}&type=following`, { headers })
      const data = await response.json()

      if (!response.ok) {
        // If unauthorized and no session, set empty following instead of throwing error
        if (response.status === 401 && !session?.access_token) {
          setFollowing([])
          return
        }
        throw new Error(data.error || 'Failed to get following')
      }

      setFollowing(data.following || [])
    } catch (error) {
      console.error('Get following error:', error)
      setFollowing([])
      if (session?.access_token) {
        toast({
          title: "Error",
          description: "Failed to load following",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast, session?.access_token])

  const getMutualFollows = useCallback(async (userId: string): Promise<void> => {
    try {
      const headers: HeadersInit = {}

      // Add authorization header if session exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/follows/mutual?user_id=${userId}`, { headers })
      const data = await response.json()

      if (!response.ok) {
        // If unauthorized and no session, set empty mutual follows instead of throwing error
        if (response.status === 401 && !session?.access_token) {
          setMutualFollows([])
          return
        }
        throw new Error(data.error || 'Failed to get mutual follows')
      }

      setMutualFollows(data.mutual_follows || [])
    } catch (error) {
      console.error('Get mutual follows error:', error)
      setMutualFollows([])
    }
  }, [session?.access_token])

  const refreshFollowData = useCallback(async (userId: string): Promise<void> => {
    await Promise.all([
      getFollowStatus(userId),
      getFollowers(userId),
      getFollowing(userId),
      getMutualFollows(userId)
    ])
  }, [getFollowStatus, getFollowers, getFollowing, getMutualFollows])

  return {
    isLoading,
    followStatus,
    followers,
    following,
    mutualFollows,
    followUser,
    unfollowUser,
    getFollowStatus,
    getFollowers,
    getFollowing,
    getMutualFollows,
    refreshFollowData,
  }
}