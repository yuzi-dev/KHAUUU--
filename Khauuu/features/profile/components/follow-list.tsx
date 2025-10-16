'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFollow } from '@/hooks/useFollow'
import { useAuth } from '@/contexts/AuthContext'
import FollowButton from './follow-button'
import { Users, UserCheck, Heart, User } from 'lucide-react'

interface FollowListProps {
  userId: string
  type: 'followers' | 'following' | 'mutual'
  title?: string
  showFollowButtons?: boolean
  maxItems?: number
  className?: string
}

interface UserProfile {
  user_id: string
  username: string
  full_name: string
  avatar_url: string | null
  bio: string | null
}

export default function FollowList({
  userId,
  type,
  title,
  showFollowButtons = true,
  maxItems,
  className = ''
}: FollowListProps) {
  const { session } = useAuth()
  const { 
    isLoading, 
    followers, 
    following, 
    mutualFollows,
    getFollowers, 
    getFollowing, 
    getMutualFollows 
  } = useFollow(session)

  const [displayData, setDisplayData] = useState<UserProfile[]>([])

  useEffect(() => {
    if (userId) {
      switch (type) {
        case 'followers':
          getFollowers(userId)
          break
        case 'following':
          getFollowing(userId)
          break
        case 'mutual':
          getMutualFollows(userId)
          break
      }
    }
  }, [userId, type, getFollowers, getFollowing, getMutualFollows])

  useEffect(() => {
    let data: UserProfile[] = []
    
    switch (type) {
      case 'followers':
        data = followers.map(item => item.profiles)
        break
      case 'following':
        data = following.map(item => item.profiles)
        break
      case 'mutual':
        data = mutualFollows
        break
    }

    if (maxItems) {
      data = data.slice(0, maxItems)
    }

    setDisplayData(data)
  }, [followers, following, mutualFollows, type, maxItems])

  const getIcon = () => {
    switch (type) {
      case 'followers':
        return <Users className="h-5 w-5" />
      case 'following':
        return <UserCheck className="h-5 w-5" />
      case 'mutual':
        return <Heart className="h-5 w-5 text-red-500" />
    }
  }

  const getDefaultTitle = () => {
    switch (type) {
      case 'followers':
        return 'Followers'
      case 'following':
        return 'Following'
      case 'mutual':
        return 'Friends'
    }
  }

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{title || getDefaultTitle()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (displayData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{title || getDefaultTitle()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No {type === 'mutual' ? 'friends' : type} yet
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getIcon()}
          <span>{title || getDefaultTitle()}</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({displayData.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayData.map((user) => (
          <div key={user.user_id} className="flex items-center space-x-3">
            <Link href={`/profile/${user.username || user.user_id}`}>
              <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                <AvatarImage 
                  src={user.avatar_url || undefined} 
                  alt={user.full_name || user.username}
                />
                <AvatarFallback>
                  {getInitials(user.full_name || user.username)}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            <div className="flex-1 min-w-0">
              <Link 
                href={`/profile/${user.username || user.user_id}`}
                className="block hover:underline"
              >
                <p className="font-medium truncate">
                  {user.full_name || user.username}
                </p>
                {user.username && user.full_name && (
                  <p className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </p>
                )}
              </Link>
              {user.bio && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {user.bio}
                </p>
              )}
            </div>

            {showFollowButtons && (
              <FollowButton
                userId={user.user_id}
                variant="outline"
                size="sm"
                showText={false}
              />
            )}
          </div>
        ))}

        {maxItems && displayData.length >= maxItems && (
          <div className="pt-4 border-t">
            <Link href={`/profile/${userId}/${type}`}>
              <Button variant="ghost" className="w-full">
                View All {getDefaultTitle()}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}