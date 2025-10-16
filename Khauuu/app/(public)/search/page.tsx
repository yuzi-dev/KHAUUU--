'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Loader2, Search, Users, UserPlus, UserCheck, Clock, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { useAuth } from '@/contexts/AuthContext'
import FollowButton from '@/features/profile/components/follow-button'

interface User {
  id: string
  name: string
  username: string
  bio: string
  avatar: string
  followers: number
  following: number
  reviews: number
  verified: boolean
  website?: string
  location?: string
  isVegetarian: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export default function SearchUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())
  const [pendingUsers, setPendingUsers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false
  })
  
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()

  const checkFollowStatus = async (userId: string) => {
    if (!session?.access_token) return { isFollowing: false, isPending: false };
    
    try {
      const response = await fetch(`/api/follows/status?target_user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          isFollowing: data.is_following || false,
          isPending: data.is_pending || false
        };
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
    return { isFollowing: false, isPending: false };
  };

  const fetchUsers = useCallback(async (search: string, page: number) => {
    try {
      setLoading(true)
      if (page === 1) {
        setSearchLoading(true)
      }
      setError(null)

      const params = new URLSearchParams({
        search: search.trim(),
        page: page.toString(),
        limit: '10'
      })

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      // Add authorization header if user is logged in
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/users?${params}`, { headers })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (page === 1) {
        setUsers(data.users || [])
      } else {
        setUsers(prev => [...prev, ...(data.users || [])])
      }
      
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasMore: false
      })

      // Check follow status for each user if logged in
      if (session?.access_token && data.users) {
        const followStatusPromises = data.users.map(async (user: User) => {
          const status = await checkFollowStatus(user.id);
          return { userId: user.id, ...status };
        });

        const followStatuses = await Promise.all(followStatusPromises);
        
        const newFollowedUsers = new Set<string>();
        const newPendingUsers = new Set<string>();
        
        followStatuses.forEach(({ userId, isFollowing, isPending }) => {
          if (isFollowing) {
            newFollowedUsers.add(userId);
          }
          if (isPending) {
            newPendingUsers.add(userId);
          }
        });
        
        setFollowedUsers(newFollowedUsers);
        setPendingUsers(newPendingUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }, [session?.access_token])

  // Create handleSearch function to refresh search results
  const handleSearch = useCallback(() => {
    fetchUsers(searchQuery, 1)
  }, [fetchUsers, searchQuery])

  // Debounced search effect - wait for auth to load first
  useEffect(() => {
    if (!authLoading) {
      const timeoutId = setTimeout(() => {
        fetchUsers(searchQuery, 1)
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, fetchUsers, authLoading])

  // Initial load - wait for auth to load first
  useEffect(() => {
    if (!authLoading) {
      fetchUsers('', 1)
    }
  }, [authLoading, fetchUsers])

  const handleFollow = async (userId: string) => {
    if (!session?.access_token) return;
    
    try {
      const isCurrentlyFollowing = followedUsers.has(userId);
      const isCurrentlyPending = pendingUsers.has(userId);
      
      const response = await fetch('/api/follows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          followed_user_id: userId,
          action: isCurrentlyFollowing ? 'unfollow' : 'follow'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (isCurrentlyFollowing) {
          // Unfollowing
          setFollowedUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
          setPendingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        } else {
          // Following - check if it's a private profile
          if (result.status === 'pending') {
            // Show pending state for private profiles
            setPendingUsers(prev => new Set(prev).add(userId));
          } else {
            // Direct follow for public profiles
            setFollowedUsers(prev => new Set(prev).add(userId));
          }
        }
      } else {
        // Get error details from response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to update follow status:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  }

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchUsers(searchQuery, pagination.page + 1)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && !loading) {
      fetchUsers(searchQuery, newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-warm-cream to-muted">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
              Discover Food Lovers
            </h1>
            <p className="text-muted-foreground text-lg">
              Connect with fellow food enthusiasts and discover new culinary experiences
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            {searchLoading && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 animate-spin" />
            )}
            <Input
              type="text"
              placeholder="Search users by name, username, or interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-14 text-lg bg-card/50 border-border/50 focus:border-primary"
            />
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-8 mb-6">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-destructive font-medium">Error loading users</p>
                <p className="text-destructive/80 text-sm mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => fetchUsers(searchQuery, 1)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && !error && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          )}

          {/* Results Header */}
          {!loading && !error && users.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-lg font-medium">
                  {pagination.total} {pagination.total === 1 ? 'user' : 'users'} found
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
            </div>
          )}

          {/* User Cards */}
          {!loading && !error && (
            <div className="grid gap-6">
              {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div 
                        className="flex items-center space-x-4 flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        onClick={() => router.push(`/profile/${user.id}`)}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar || '/placeholder.svg'} />
                          <AvatarFallback>{user.full_name?.[0] || user.username?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{user.full_name || user.username}</h3>
                            {user.is_verified && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground">@{user.username}</p>
                          {user.bio && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
                          )}
                        </div>
                      </div>
                      <FollowButton 
                        userId={user.id}
                        initialFollowStatus={user.is_following}
                        user={{
                          id: user.id,
                          user_id: user.id,
                          username: user.username,
                          full_name: user.full_name,
                          avatar_url: user.avatar
                        }}
                        onFollowChange={(isFollowing) => {
                          // Update the user's follow status in the local state
                          setUsers(prevUsers => 
                            prevUsers.map(u => 
                              u.id === user.id 
                                ? { ...u, is_following: isFollowing }
                                : u
                            )
                          );
                        }}
                      />
                    </div>
                  ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && !error && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(
                    pagination.totalPages - 4,
                    pagination.page - 2
                  )) + i
                  
                  if (pageNum > pagination.totalPages) return null
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={pageNum === pagination.page ? "bg-gradient-hero text-white" : ""}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Load More Button (Alternative to pagination) */}
          {!loading && !error && pagination.hasMore && pagination.totalPages <= 1 && (
            <div className="text-center mt-8">
              <Button
                onClick={handleLoadMore}
                variant="outline"
                className="bg-gradient-hero text-white hover:opacity-90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Users'
                )}
              </Button>
            </div>
          )}

          {/* No Results State */}
          {!loading && !error && users.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No users found' : 'No users available'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery 
                  ? `We couldn't find any users matching "${searchQuery}". Try adjusting your search terms.`
                  : 'There are no users to display at the moment.'
                }
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}