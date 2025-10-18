"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSkeleton } from "@/components/loading/message-skeleton";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import SharedContent from "@/components/shared-content";
import { 
  Send, 
  Phone, 
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Camera,
  Heart,
  Info,
  Plus,
  Check,
  CheckCheck
} from "lucide-react";

const ConversationPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isUserOnline } = useOnlineStatus();
  const {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    loading,
    sending,
    loadingMore,
    hasMoreMessages,
    sendMessage,
    loadMoreMessages,
  } = useMessages();

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const conversationId = params.conversationId as string;

  // Set active conversation when component mounts or conversationId changes
  useEffect(() => {
    if (conversationId && conversationId !== activeConversation) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, activeConversation, setActiveConversation]);

  // Track if this is the initial load of messages for a conversation
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Reset initial load flag when conversation changes
  useEffect(() => {
    setIsInitialLoad(true);
  }, [activeConversation]);

  // Auto-scroll to bottom - always scroll on initial load, then preserve user position
  useEffect(() => {
    if (messages.length > 0) {
      const container = messagesContainerRef.current;
      
      if (isInitialLoad && container) {
        // Always scroll to bottom on initial load using scrollTop
        // Use multiple attempts to ensure scroll happens
        const scrollToBottom = () => {
          container.scrollTop = container.scrollHeight;
        };
        
        // Immediate scroll
        scrollToBottom();
        
        // Delayed scrolls to handle dynamic content loading
        requestAnimationFrame(scrollToBottom);
        setTimeout(scrollToBottom, 50);
        setTimeout(() => {
          scrollToBottom();
          setIsInitialLoad(false);
        }, 200);
      } else if (container && messagesEndRef.current) {
        // For subsequent updates, only scroll if user is near the bottom
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
        
        if (isNearBottom) {
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
          });
        }
      }
    }
  }, [messages, isInitialLoad]); // Depend on messages array directly for better reactivity

  // Additional effect to ensure scroll to bottom on conversation change and reload
  useEffect(() => {
    if (messages.length > 0 && activeConversation) {
      const container = messagesContainerRef.current;
      if (container) {
        // Force scroll to bottom when conversation changes or on reload
        const scrollToBottom = () => {
          container.scrollTop = container.scrollHeight;
        };
        
        // Multiple scroll attempts to handle all scenarios
        scrollToBottom();
        requestAnimationFrame(scrollToBottom);
        setTimeout(scrollToBottom, 100);
        setTimeout(scrollToBottom, 300);
      }
    }
  }, [activeConversation, messages.length]); // Trigger on conversation change and message count change

  // Handle infinite scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if user scrolled to the top
      if (container.scrollTop === 0 && hasMoreMessages && !loadingMore) {
        const previousScrollHeight = container.scrollHeight;
        
        loadMoreMessages().then(() => {
          // Maintain scroll position after loading more messages
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
          }, 100);
        });
      }
    };

    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [hasMoreMessages, loadingMore, loadMoreMessages]);
  useEffect(() => {
    if (!activeConversation || !messagesContainerRef.current || messages.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageElement = entry.target as HTMLElement;
            const messageId = messageElement.dataset.messageId;
            const senderId = messageElement.dataset.senderId;
            
            // Only mark messages from other users as read
            if (messageId && senderId && senderId !== user?.id) {
              setTimeout(async () => {
                if (activeConversation) {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.access_token) return;
                    
                    await fetch('/api/messages/read', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({ conversationId: activeConversation }),
                    });
                  } catch (error) {
                    console.error('Error marking messages as read:', error);
                  }
                }
              }, 1000);
            }
          }
        });
      },
      {
        root: messagesContainerRef.current,
        rootMargin: '0px',
        threshold: 0.5
      }
    );

    const messageElements = messagesContainerRef.current.querySelectorAll('[data-message-id]');
    messageElements.forEach((element) => {
      const senderId = (element as HTMLElement).dataset.senderId;
      if (senderId && senderId !== user?.id) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [activeConversation, messages, user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending || !activeConversation) return;

    try {
      await sendMessage(messageText.trim(), activeConversation);
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return "";
    }
  };

  const getOtherParticipant = (conversation: any) => {
    return conversation.participants?.find((p: any) => p.user_id !== user?.id);
  };

  const getMessageStatus = (message: any) => {
    if (message.sender_id !== user?.id) return null;
    
    if (message.read_at) {
      return (
        <div className="flex items-center space-x-1">
          <CheckCheck className="w-3 h-3 text-blue-500" />
          <span className="text-xs">Read</span>
        </div>
      );
    } else if (message.delivered_at) {
      return (
        <div className="flex items-center space-x-1">
          <CheckCheck className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs">Delivered</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-1">
          <Check className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs">Sent</span>
        </div>
      );
    }
  };

  // Find the current conversation
  const currentConversation = conversations.find(c => c.id === conversationId);

  // Show loading state while messages are being fetched
  if (loading || !currentConversation) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Messages Skeleton */}
        <div className="flex-1 overflow-hidden">
          <MessageSkeleton />
        </div>
        
        {/* Input Skeleton */}
        <div className="bg-white border-t px-6 py-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    );
  }
  const otherParticipant = currentConversation ? getOtherParticipant(currentConversation) : null;

  // If conversation doesn't exist, show error
  if (!loading && conversationId && !currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Conversation not found</h2>
          <p className="text-muted-foreground mb-4">This conversation may have been deleted or you don't have access to it.</p>
          <Button onClick={() => router.push('/messages')}>
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  // If no conversation is selected or loading
  if (!conversationId || loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {loading ? "Loading..." : "Select a conversation"}
          </h2>
          <p className="text-muted-foreground">
            {loading ? "Please wait while we load your messages." : "Choose a conversation from the sidebar to start messaging."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage 
                  src={otherParticipant?.avatar_url} 
                  alt={otherParticipant?.full_name || otherParticipant?.username} 
                />
                <AvatarFallback>
                  {(otherParticipant?.full_name || otherParticipant?.username || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {otherParticipant && isUserOnline(otherParticipant.user_id) && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {otherParticipant?.full_name || otherParticipant?.username || "Unknown User"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {otherParticipant && isUserOnline(otherParticipant.user_id) ? "Active now" : "Offline"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Loading indicator for infinite scroll */}
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Avatar className="w-16 h-16 mx-auto mb-4">
                <AvatarImage 
                  src={otherParticipant?.avatar_url} 
                  alt={otherParticipant?.full_name || otherParticipant?.username} 
                />
                <AvatarFallback>
                  {(otherParticipant?.full_name || otherParticipant?.username || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-foreground mb-2">
                {otherParticipant?.full_name || otherParticipant?.username}
              </h3>
              <p className="text-muted-foreground">
                Start your conversation with {otherParticipant?.full_name || otherParticipant?.username}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              data-message-id={message.id}
              data-sender-id={message.sender_id}
              className={`flex flex-col ${message.sender_id === user?.id ? "items-end" : "items-start"}`}
            >
              <div className={`max-w-xs lg:max-w-md`}>
                <div className={`rounded-2xl px-4 py-2 ${
                  message.sender_id === user?.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-foreground"
                }`}>
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Render shared content if message type is shared_content */}
                  {message.message_type === 'shared_content' && message.shared_content && (
                    <div className="mt-2">
                      <SharedContent
                        type={message.shared_content.content_type as 'restaurant' | 'food'}
                        item={{
                           id: message.shared_content.content_id,
                           name: message.shared_content.content_data?.name || 'Unknown',
                           image: message.shared_content.content_type === 'restaurant' 
                             ? (message.shared_content.content_data?.cover_images?.[0] || message.shared_content.content_data?.images?.[0] || '/placeholder.svg')
                             : (message.shared_content.content_data?.image_url || message.shared_content.content_data?.images?.[0] || '/placeholder.svg'),
                           description: message.shared_content.content_data?.description,
                           rating: message.shared_content.content_data?.rating,
                           reviewCount: message.shared_content.content_data?.review_count,
                           price: message.shared_content.content_data?.price?.toString(),
                           location: message.shared_content.content_data?.address || message.shared_content.content_data?.restaurant_name,
                           cuisine: message.shared_content.content_data?.cuisine || message.shared_content.content_data?.restaurant_cuisine,
                         }}
                        sharedBy={message.shared_content.sharer_info?.full_name || message.shared_content.sharer_info?.username}
                        message={message.shared_content.share_message}
                      />
                    </div>
                  )}
                  
                  <div className={`flex items-center justify-between mt-1 text-xs ${
                    message.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    <span>{formatMessageTime(message.created_at)}</span>
                  </div>
                </div>
                
                {/* Message Status - Below the bubble, only for sent messages */}
                {message.sender_id === user?.id && getMessageStatus(message) && (
                  <div className="mt-1 text-xs text-muted-foreground text-right">
                    {getMessageStatus(message)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" type="button">
            <Plus className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" type="button">
            <Camera className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              placeholder="Message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="pr-20"
              disabled={sending}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <Button variant="ghost" size="icon" type="button">
                <Smile className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {messageText.trim() ? (
            <Button type="submit" disabled={sending}>
              <Send className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" type="button">
              <Heart className="w-5 h-5" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ConversationPage;