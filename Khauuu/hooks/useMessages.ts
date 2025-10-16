'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ably, MESSAGING_CHANNELS, MESSAGING_EVENTS } from '@/lib/ably';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SharedContent {
  id: string;
  content_type: 'food' | 'restaurant';
  content_id: string;
  shared_by: string;
  created_at: string;
  food?: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    price?: number;
    rating?: number;
    restaurant?: {
      id: string;
      name: string;
      location?: string;
    };
  };
  restaurant?: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    cuisine_type?: string;
    rating?: number;
    location?: string;
    price_range?: string;
  };
}

export interface Message {
  id: string;
  content: string;
  message_type: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  sender_id: string;
  conversation_id: string;
  shared_content_id?: string;
  shared_content?: SharedContent;
  profiles: {
    user_id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  delivered_at?: string;
  read_at?: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_message: Message | null;
  participants: Array<{
    user_id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  }>;
  unread_count: number;
  last_read_at: string;
}

export const useMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages?.sort((a: Message, b: Message) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || []);
        
        // Mark messages as read
        await markAsRead(conversationId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update conversations locally without triggering loading state
  const updateConversationsLocally = useCallback((messageOrData: any) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === messageOrData.conversation_id) {
          return {
            ...conv,
            last_message_at: messageOrData.created_at || new Date().toISOString(),
            last_message: messageOrData,
            unread_count: conv.unread_count + (messageOrData.sender_id !== user?.id ? 1 : 0)
          };
        }
        return conv;
      });
    });
  }, [user]);

  // Send a message
  const sendMessage = useCallback(async (content: string, recipientId?: string) => {
    if (!user || !content.trim()) return;

    try {
      setSending(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          conversationId: activeConversation,
          recipientId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add message to local state immediately with deduplication
        setMessages(prev => {
          // Check if message already exists
          if (prev.some(m => m.id === data.message.id)) {
            return prev;
          }
          return [...prev, data.message].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        
        // Update conversation list without refetching messages
        setConversations(prev => {
          return prev.map(conv => {
            if (conv.id === activeConversation) {
              return {
                ...conv,
                last_message: data.message,
                last_message_at: data.message.created_at,
                updated_at: data.message.created_at
              };
            }
            return conv;
          });
        });
        
        return data.message;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }, [user, activeConversation, fetchConversations]);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch('/api/messages/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ conversationId }),
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  // Start a new conversation
  const startConversation = useCallback(async (userIds: string[], isGroup?: boolean) => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          userIds,
          isGroup: isGroup || false
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveConversation(data.conversation.id);
        await fetchConversations();
        return data.conversation.id;
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  }, [user, fetchConversations]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const userChannel = ably.channels.get(MESSAGING_CHANNELS.USER_MESSAGES(user.id));
    
    const handleNewMessage = (message: any) => {
      const messageData = message.data;
      
      // Add to messages if it's for the active conversation
      if (messageData.message.conversation_id === activeConversation) {
        setMessages(prev => {
        // Check if message already exists
        if (prev.some(m => m.id === messageData.message.id)) {
          return prev;
        }
        return [...prev, messageData.message].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      }
      
      // Update conversations list without triggering loading state
      updateConversationsLocally(messageData.message);
    };

    const handleConversationUpdate = (message: any) => {
      // Update conversations list without triggering loading state
      updateConversationsLocally(message.data);
    };

    userChannel.subscribe(MESSAGING_EVENTS.NEW_MESSAGE, handleNewMessage);
    userChannel.subscribe(MESSAGING_EVENTS.CONVERSATION_UPDATED, handleConversationUpdate);

    return () => {
      userChannel.unsubscribe();
    };
  }, [user, activeConversation, fetchConversations]);

  // Set up conversation-specific real-time subscriptions
  useEffect(() => {
    if (!activeConversation) return;

    const conversationChannel = ably.channels.get(MESSAGING_CHANNELS.CONVERSATION(activeConversation));
    
    const handleNewMessage = (message: any) => {
      const messageData = message.data;
      
      setMessages(prev => {
        // Check if message already exists
        if (prev.some(m => m.id === messageData.message.id)) {
          return prev;
        }
        return [...prev, messageData.message].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    };

    const handleMessageRead = (message: any) => {
      // Update message read status if needed
      console.log('Message read:', message.data);
    };

    conversationChannel.subscribe(MESSAGING_EVENTS.NEW_MESSAGE, handleNewMessage);
    conversationChannel.subscribe(MESSAGING_EVENTS.MESSAGE_READ, handleMessageRead);

    return () => {
      conversationChannel.unsubscribe();
    };
  }, [activeConversation]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    } else {
      setMessages([]);
    }
  }, [activeConversation, fetchMessages]);

  // Remove automatic refetching on visibility change to prevent unwanted refreshes
  // This was causing the app to refresh when switching between applications

  return {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    loading,
    sending,
    sendMessage,
    startConversation,
    fetchConversations,
    fetchMessages,
  };
};