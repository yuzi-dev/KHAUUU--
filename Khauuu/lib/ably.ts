import Ably from 'ably';

// Client-side Ably instance
export const ably = new Ably.Realtime({
  key: process.env.NEXT_PUBLIC_ABLY_KEY!,
  clientId: 'khauuu-webapp',
});

// Server-side Ably instance for publishing
export const ablyServer = new Ably.Rest({
  key: process.env.NEXT_PUBLIC_ABLY_KEY!,
});

// Notification channel names
export const NOTIFICATION_CHANNELS = {
  USER_NOTIFICATIONS: (userId: string) => `notifications:${userId}`,
  GLOBAL_NOTIFICATIONS: 'notifications:global',
} as const;

// Notification event types
export const NOTIFICATION_EVENTS = {
  NEW_NOTIFICATION: 'new-notification',
  NOTIFICATION_READ: 'notification-read',
  NOTIFICATION_DELETED: 'notification-deleted',
  UNREAD_COUNT_UPDATED: 'unread-count-updated',
} as const;

export type NotificationEvent = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS];