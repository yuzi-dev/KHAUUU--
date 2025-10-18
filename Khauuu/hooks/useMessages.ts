'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ably, MESSAGING_CHANNELS, MESSAGING_EVENTS } from '@/lib/ably';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SharedContent {
  id: string;
  content_type: 'food' | 'restaurant';
  content_id: string;
  shared_by: string;
  share_message?: string;
  created_at: string;
  content_data?: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    category?: string;
    image_url?: string;
    images?: string[];
    cover_images?: string[];
    rating?: number;
    review_count?: number;
    is_vegetarian?: boolean;
    is_featured?: boolean;
    tags?: string[];
    restaurant_name?: string;
    restaurant_cuisine?: string;
    restaurant_rating?: number;
    cuisine?: string;
    address?: string;
    phone?: string;
    price_range?: string;
    features?: any;
    opening_hours?: any;
    is_open?: boolean;
  };
  sharer_info?: {
    user_id: string;
    username: string;
    full_name: string;
    profile_image_url?: string;
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Use refs to track state without causing re-renders
  const messagesRef = useRef<Message[]>([]);
  const activeConversationRef = useRef<string | null>(null);
  
  // Update refs when state changes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

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

  // Fetch messages for a conversation with pagination
  const fetchMessages = useCallback(async (conversationId: string, page = 1, limit = 20) => {
    if (!user) return;

    try {
      // Set appropriate loading state based on page
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const response = await fetch(`/api/messages?conversationId=${conversationId}&page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const newMessages = data.messages?.sort((a: Message, b: Message) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ) || [];
      
      if (page === 1) {
        // First page - replace all messages
        setMessages(newMessages);
        setCurrentPage(1);
      } else {
        // Subsequent pages - prepend to existing messages
        setMessages(prev => {
          const existingIds = new Set(prev.map((m: Message) => m.id));
          const uniqueNewMessages = newMessages.filter((m: Message) => !existingIds.has(m.id));
          return [...uniqueNewMessages, ...prev].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        setCurrentPage(page);
      }
      
      setHasMoreMessages(data.hasMore || false);
      
      // Mark messages as read
      await markAsRead(conversationId);
      
      return {
        messages: newMessages,
        hasMore: data.hasMore || false,
        totalCount: data.totalCount || 0
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Only show toast error for user-initiated actions (page 1)
      if (page === 1) {
        toast.error('Failed to load messages');
      }
      // Reset messages on error for first page to prevent infinite loading
      if (page === 1) {
        setMessages([]);
        setHasMoreMessages(false);
      }
    } finally {
      if (page === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [user]);

  // Load more messages for infinite scroll
  const loadMoreMessages = useCallback(async () => {
    if (!activeConversation || loadingMore || !hasMoreMessages) return;
    
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    await fetchMessages(activeConversation, nextPage);
  }, [activeConversation, loadingMore, hasMoreMessages, currentPage, fetchMessages]);

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
  }, [user, activeConversation, updateConversationsLocally]);

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

  // Load conversations on mount - only once when user is available
  useEffect(() => {
    let isMounted = true;
    
    const loadConversations = async () => {
      if (!user || conversations.length > 0) return; // Don't reload if we already have conversations
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const response = await fetch('/api/messages/conversations', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok && isMounted) {
          const data = await response.json();
          setConversations(data.conversations || []);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    loadConversations();
    
    return () => {
      isMounted = false;
    };
  }, [user]); // Only depend on user, not fetchConversations

  // Load messages when active conversation changes
  useEffect(() => {
    let isMounted = true;
    
    const loadMessages = async () => {
      if (!activeConversation) {
        setMessages([]);
        setHasMoreMessages(true);
        setCurrentPage(1);
        return;
      }
      
      // Only fetch messages if we don't have any messages for this conversation
      // This prevents unnecessary reloading when returning to the page
      if (messagesRef.current.length === 0) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) return;

          setLoading(true);
          const response = await fetch(`/api/messages?conversationId=${activeConversation}&page=1&limit=20`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const newMessages = data.messages?.sort((a: Message, b: Message) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ) || [];
            
            if (isMounted) {
              setMessages(newMessages);
              setHasMoreMessages(data.hasMore || false);
              setCurrentPage(1);
            }
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    loadMessages();
    
    return () => {
      isMounted = false;
    };
  }, [activeConversation]); // Removed fetchMessages and messages.length dependencies to prevent unnecessary re-renders

  // Note: Removed visibility change handler to prevent unnecessary reloads when switching tabs/apps
  // Real-time updates via Ably subscriptions handle new messages automatically

  return {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    loading,
    sending,
    loadingMore,
    hasMoreMessages,
    sendMessage,
    startConversation,
    fetchConversations,
    fetchMessages,
    loadMoreMessages,
  };
};