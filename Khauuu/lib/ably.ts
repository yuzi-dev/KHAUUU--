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

// Messaging channel names
export const MESSAGING_CHANNELS = {
  CONVERSATION: (conversationId: string) => `conversation:${conversationId}`,
  USER_MESSAGES: (userId: string) => `messages:${userId}`,
} as const;

// Messaging event types
export const MESSAGING_EVENTS = {
  NEW_MESSAGE: 'new-message',
  MESSAGE_UPDATED: 'message-updated',
  MESSAGE_DELETED: 'message-deleted',
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  MESSAGE_READ: 'message-read',
  CONVERSATION_UPDATED: 'conversation-updated',
} as const;

export type NotificationEvent = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS];
export type MessagingEvent = typeof MESSAGING_EVENTS[keyof typeof MESSAGING_EVENTS];