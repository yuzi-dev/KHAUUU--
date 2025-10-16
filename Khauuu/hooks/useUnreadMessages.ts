'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ably, MESSAGING_CHANNELS, MESSAGING_EVENTS } from '@/lib/ably';
import { useAuth } from '@/contexts/AuthContext';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch total unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setTotalUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setTotalUnreadCount(0);
        return;
      }

      const response = await fetch('/api/messages/unread-count', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTotalUnreadCount(data.unreadCount || 0);
      } else {
        console.error('Failed to fetch unread count:', response.status);
        setTotalUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setTotalUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up real-time subscriptions for unread count updates
  useEffect(() => {
    if (!user) return;

    const userChannel = ably.channels.get(MESSAGING_CHANNELS.USER_MESSAGES(user.id));
    
    const handleNewMessage = () => {
      // Refresh unread count when new messages arrive
      fetchUnreadCount();
    };

    const handleMessageRead = () => {
      // Refresh unread count when messages are read
      fetchUnreadCount();
    };

    const handleConversationUpdate = () => {
      // Refresh unread count when conversations are updated
      fetchUnreadCount();
    };

    userChannel.subscribe(MESSAGING_EVENTS.NEW_MESSAGE, handleNewMessage);
    userChannel.subscribe(MESSAGING_EVENTS.MESSAGE_READ, handleMessageRead);
    userChannel.subscribe(MESSAGING_EVENTS.CONVERSATION_UPDATED, handleConversationUpdate);

    return () => {
      userChannel.unsubscribe();
    };
  }, [user, fetchUnreadCount]);

  // Fetch unread count on mount and when user changes
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    totalUnreadCount,
    loading,
    refreshUnreadCount: fetchUnreadCount,
  };
};