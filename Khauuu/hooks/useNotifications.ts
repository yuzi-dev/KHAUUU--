import { useState, useEffect, useCallback, useRef } from 'react';
import { ably, NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS } from '@/lib/ably';
import { useAuth } from '@/contexts/AuthContext';
import type { Channel } from 'ably';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  user?: {
    user_id: string;
    username: string;
    full_name: string;
    profile_image_url?: string;
  };
  timestamp: string;
  read: boolean;
  data?: Record<string, any>;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (options?: { limit?: number; offset?: number; unreadOnly?: boolean }) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user, session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}) => {
    if (!user || !session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const { limit = 20, offset = 0, unreadOnly = false } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(unreadOnly && { unread_only: 'true' })
      });

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      if (offset === 0) {
        setNotifications(data.notifications || []);
      } else {
        setNotifications(prev => [...prev, ...(data.notifications || [])]);
      }
      
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user || !session?.access_token) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_id: notificationId,
          read: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state optimistically
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }, [user, session]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user || !session?.access_token) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mark_all_read: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }, [user, session]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user || !session?.access_token) return;

    try {

      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_id: notificationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, [user, session, notifications]);

  // Refetch notifications
  const refetch = useCallback(() => {
    return fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const channel = ably.channels.get(NOTIFICATION_CHANNELS.USER_NOTIFICATIONS(user.id));
    channelRef.current = channel;

    // Subscribe to new notifications
    const handleNewNotification = (message: any) => {
      const newNotification = message.data;
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Subscribe to notification read events
    const handleNotificationRead = (message: any) => {
      const { type, notificationId } = message.data;
      
      if (type === 'bulk_read') {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
      } else if (type === 'single_read' && notificationId) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: message.data.read }
              : notif
          )
        );
      }
    };

    // Subscribe to notification deleted events
    const handleNotificationDeleted = (message: any) => {
      const { notificationId } = message.data;
      const deletedNotification = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };

    // Subscribe to unread count updates
    const handleUnreadCountUpdate = () => {
      // Refetch to get accurate count
      fetchNotifications();
    };

    channel.subscribe(NOTIFICATION_EVENTS.NEW_NOTIFICATION, handleNewNotification);
    channel.subscribe(NOTIFICATION_EVENTS.NOTIFICATION_READ, handleNotificationRead);
    channel.subscribe(NOTIFICATION_EVENTS.NOTIFICATION_DELETED, handleNotificationDeleted);
    channel.subscribe(NOTIFICATION_EVENTS.UNREAD_COUNT_UPDATED, handleUnreadCountUpdate);

    // Initial fetch
    fetchNotifications();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  };
}