'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from './ui/card'
import { Separator } from './ui/separator'
import { Users, UserCheck, Heart } from 'lucide-react'

interface FollowStatsProps {
  userId: string
  username?: string
  followersCount?: number
  followingCount?: number
  showMutual?: boolean
  mutualCount?: number
  className?: string
}

export default function FollowStats({
  userId,
  username,
  followersCount = 0,
  followingCount = 0,
  showMutual = false,
  mutualCount = 0,
  className = ''
}: FollowStatsProps) {
  const [counts, setCounts] = useState({
    followers: followersCount,
    following: followingCount,
    mutual: mutualCount
  })

  useEffect(() => {
    setCounts({
      followers: followersCount,
      following: followingCount,
      mutual: mutualCount
    })
  }, [followersCount, followingCount, mutualCount])

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-around space-x-4">
          {/* Followers */}
          <Link 
            href={`/profile/${username || userId}/followers`}
            className="flex flex-col items-center space-y-1 hover:bg-muted/50 rounded-lg p-2 transition-colors"
          >
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {formatCount(counts.followers)}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              Followers
            </span>
          </Link>

          <Separator orientation="vertical" className="h-12" />

          {/* Following */}
          <Link 
            href={`/profile/${username || userId}/following`}
            className="flex flex-col items-center space-y-1 hover:bg-muted/50 rounded-lg p-2 transition-colors"
          >
            <div className="flex items-center space-x-1">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {formatCount(counts.following)}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              Following
            </span>
          </Link>

          {/* Mutual Follows (Friends) */}
          {showMutual && (
            <>
              <Separator orientation="vertical" className="h-12" />
              <Link 
                href={`/profile/${username || userId}/friends`}
                className="flex flex-col items-center space-y-1 hover:bg-muted/50 rounded-lg p-2 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-lg font-semibold">
                    {formatCount(counts.mutual)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Friends
                </span>
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}