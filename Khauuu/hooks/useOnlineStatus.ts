'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ably } from '@/lib/ably';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from 'ably';

export interface OnlineStatus {
  [userId: string]: {
    isOnline: boolean;
    lastSeen: string;
  };
}

export interface UseOnlineStatusReturn {
  onlineStatus: OnlineStatus;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  isUserOnline: (userId: string) => boolean;
}

export function useOnlineStatus(): UseOnlineStatusReturn {
  const { user } = useAuth();
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>({});
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const isInitializedRef = useRef(false);

  // Set user as online
  const setUserOnline = useCallback((userId: string) => {
    setOnlineStatus(prev => ({
      ...prev,
      [userId]: {
        isOnline: true,
        lastSeen: new Date().toISOString()
      }
    }));
  }, []);

  // Set user as offline
  const setUserOffline = useCallback((userId: string) => {
    setOnlineStatus(prev => ({
      ...prev,
      [userId]: {
        isOnline: false,
        lastSeen: new Date().toISOString()
      }
    }));
  }, []);

  // Check if user is online
  const isUserOnline = useCallback((userId: string) => {
    return onlineStatus[userId]?.isOnline || false;
  }, [onlineStatus]);

  // Initialize presence tracking
  useEffect(() => {
    if (!user || isInitializedRef.current) return;

    const initializePresence = async () => {
      try {
        const channel = ably.channels.get('presence:global');
        presenceChannelRef.current = channel;
        isInitializedRef.current = true;

        // Enter presence with user data
        await channel.presence.enter({
          userId: user.id,
          username: user.user_metadata?.username || user.email,
          timestamp: new Date().toISOString(),
          status: 'online'
        });

        // Set current user as online immediately
        setUserOnline(user.id);

        // Listen for presence events
        channel.presence.subscribe('enter', (member) => {
          if (member.data?.userId && member.data.userId !== user.id) {
            setUserOnline(member.data.userId);
          }
        });

        channel.presence.subscribe('leave', (member) => {
          if (member.data?.userId && member.data.userId !== user.id) {
            setUserOffline(member.data.userId);
          }
        });

        channel.presence.subscribe('update', (member) => {
          if (member.data?.userId && member.data.userId !== user.id) {
            if (member.data.status === 'online') {
              setUserOnline(member.data.userId);
            } else {
              setUserOffline(member.data.userId);
            }
          }
        });

        // Get initial presence members
        const members = await channel.presence.get();

        if (members && Array.isArray(members)) {
          const initialStatus: OnlineStatus = {};
          members.forEach((member: any) => {
            if (member.data?.userId) {
              initialStatus[member.data.userId] = {
                isOnline: true,
                lastSeen: member.data.timestamp || new Date().toISOString()
              };
            }
          });
          setOnlineStatus(initialStatus);
        }
      } catch (error) {
        console.error('Failed to initialize presence:', error);
      }
    };

    initializePresence();

    // Cleanup on unmount
    return () => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.presence.leave();
        presenceChannelRef.current.presence.unsubscribe();
        presenceChannelRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [user, setUserOnline, setUserOffline]);

  // Handle visibility change to maintain presence
  useEffect(() => {
    if (!user || !presenceChannelRef.current) return;

    const handleVisibilityChange = async () => {
      if (!presenceChannelRef.current) return;

      try {
        if (document.hidden) {
          // User is going away but still connected
          await presenceChannelRef.current.presence.update({
            userId: user.id,
            username: user.user_metadata?.username || user.email,
            timestamp: new Date().toISOString(),
            status: 'away'
          });
        } else {
          // User is back and active
          await presenceChannelRef.current.presence.update({
            userId: user.id,
            username: user.user_metadata?.username || user.email,
            timestamp: new Date().toISOString(),
            status: 'online'
          });
          setUserOnline(user.id);
        }
      } catch (error) {
        console.error('Failed to update presence:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, setUserOnline]);

  return {
    onlineStatus,
    setUserOnline,
    setUserOffline,
    isUserOnline
  };
}