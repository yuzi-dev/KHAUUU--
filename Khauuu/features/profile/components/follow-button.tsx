'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useFollow } from '@/hooks/useFollow'
import { useAuth } from '@/contexts/AuthContext'
import { UserPlus, UserMinus, Users, Loader2, Clock } from 'lucide-react'
import ConfirmationModal from '@/components/modals/confirmation-modal'
import { supabase } from '@/lib/supabase'

interface FollowButtonProps {
  userId: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showText?: boolean
  className?: string
  onFollowChange?: (isFollowing: boolean) => void
  initialFollowStatus?: boolean
  user?: {
    id?: string
    user_id?: string
    username?: string
    full_name?: string
    avatar?: string
    avatar_url?: string
    profile_image_url?: string
  }
}

export default function FollowButton({
  userId,
  variant = 'default',
  size = 'default',
  showText = true,
  className = '',
  onFollowChange,
  initialFollowStatus,
  user
}: FollowButtonProps) {
  const { session } = useAuth()
  const { 
    isLoading, 
    followStatus, 
    followUser, 
    unfollowUser, 
    getFollowStatus 
  } = useFollow(session)
  
  const [localLoading, setLocalLoading] = useState(false)
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    user: null as any,
    action: 'unfollow' as 'follow' | 'unfollow',
    onConfirm: () => {}
  })

  useEffect(() => {
    if (userId && !initialFollowStatus) {
      getFollowStatus(userId)
    }
  }, [userId, getFollowStatus, initialFollowStatus])

  const handleFollowToggle = async () => {
    if (!followStatus && !initialFollowStatus) return
    if (followStatus?.is_self) return

    const isCurrentlyFollowing = initialFollowStatus !== undefined ? initialFollowStatus : followStatus?.is_following

    // Show confirmation modal for unfollow actions
    if (isCurrentlyFollowing) {
      setConfirmationModal({
        isOpen: true,
        user: user || { user_id: userId },
        action: 'unfollow',
        onConfirm: () => performFollowAction(true)
      })
      return
    }

    // Direct follow for new follows
    performFollowAction(false)
  }

  const performFollowAction = async (isUnfollow: boolean) => {
    setLocalLoading(true)
    try {
      let success = false
      if (isUnfollow) {
        success = await unfollowUser(userId)
      } else {
        success = await followUser(userId)
      }

      if (success && onFollowChange) {
        onFollowChange(!isUnfollow)
      }
      
      // Close confirmation modal
      setConfirmationModal(prev => ({ ...prev, isOpen: false }))
    } finally {
      setLocalLoading(false)
    }
  }

  // Use initialFollowStatus if provided, otherwise use followStatus
  const currentFollowStatus = initialFollowStatus !== undefined ? {
    is_following: initialFollowStatus,
    is_pending: false,
    is_mutual: false,
    is_self: false
  } : followStatus

  if (!currentFollowStatus) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        disabled 
        className={className}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {showText && size !== 'icon' && <span className="ml-2">Loading...</span>}
      </Button>
    )
  }

  if (currentFollowStatus.is_self) {
    return null
  }

  const isFollowing = currentFollowStatus.is_following
  const isPending = currentFollowStatus.is_pending
  const isMutual = currentFollowStatus.is_mutual
  const loading = isLoading || localLoading

  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showText && size !== 'icon' && (
            <span className="ml-2">
              {isFollowing ? 'Unfollowing...' : 'Following...'}
            </span>
          )}
        </>
      )
    }

    if (isPending) {
      return (
        <>
          <Clock className="h-4 w-4" />
          {showText && size !== 'icon' && <span className="ml-2">Requested</span>}
        </>
      )
    }

    if (isMutual) {
      return (
        <>
          <Users className="h-4 w-4" />
          {showText && size !== 'icon' && <span className="ml-2">Friends</span>}
        </>
      )
    }

    if (isFollowing) {
      return (
        <>
          <UserMinus className="h-4 w-4" />
          {showText && size !== 'icon' && <span className="ml-2">Unfollow</span>}
        </>
      )
    }

    return (
      <>
        <UserPlus className="h-4 w-4" />
        {showText && size !== 'icon' && <span className="ml-2">Follow</span>}
      </>
    )
  }

  const getButtonVariant = () => {
    if (isPending) return 'secondary'
    if (isMutual) return 'secondary'
    if (isFollowing) return 'outline'
    return variant
  }

  return (
    <>
      <Button
        variant={getButtonVariant()}
        size={size}
        onClick={handleFollowToggle}
        disabled={loading}
        className={className}
      >
        {getButtonContent()}
      </Button>

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.action === 'unfollow' ? 'Unfollow User' : 'Follow User'}
        description={confirmationModal.action === 'unfollow' 
          ? 'Are you sure you want to unfollow this user? You will no longer see their posts in your feed.'
          : 'Are you sure you want to follow this user?'
        }
        confirmText={confirmationModal.action === 'unfollow' ? 'Unfollow' : 'Follow'}
        cancelText="Cancel"
        variant={confirmationModal.action === 'unfollow' ? 'destructive' : 'default'}
        user={confirmationModal.user}
        action={confirmationModal.action}
      />
    </>
  )
}