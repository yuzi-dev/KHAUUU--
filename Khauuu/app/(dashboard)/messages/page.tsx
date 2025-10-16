"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import SharedContent from "@/components/shared-content";
import { NewMessageModal } from "@/components/modals/new-message-modal";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { 
  Search, 
  Send, 
  MessageSquare, 
  Phone, 
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Settings,
  Camera,
  Heart,
  Info,
  Plus,
  Edit3,
  Check,
  CheckCheck
} from "lucide-react";

const Messages = () => {
  const { user } = useAuth();
  const { isUserOnline } = useOnlineStatus();
  const {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    loading,
    sending,
    sendMessage,
    startConversation,
  } = useMessages();

  const [messageText, setMessageText] = useState("");
  const [showMessageRequests, setShowMessageRequests] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "requests">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-mark messages as read when they become visible
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
              // Mark the conversation as read (this will mark all unread messages as read)
              // We use a debounced approach to avoid excessive API calls
               setTimeout(async () => {
                 if (activeConversation) {
                   try {
                     const { data: { session } } = await supabase.auth.getSession();
                     if (!session?.access_token) return;
                     
                     // The markAsRead function is already called in fetchMessages, 
                     // but we can call it again for real-time read marking
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
               }, 1000); // 1 second delay to ensure user has actually seen the message
            }
          }
        });
      },
      {
        root: messagesContainerRef.current,
        rootMargin: '0px',
        threshold: 0.5, // Message must be at least 50% visible
      }
    );

    // Observe all message elements from other users
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (messageText.trim()) {
      await sendMessage(messageText);
      setMessageText("");
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatConversationTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: false });
    } catch {
      return "now";
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

  const handleStartConversation = async (userIds: string[], isGroup?: boolean) => {
    try {
      const conversationId = await startConversation(userIds, isGroup);
      if (conversationId) {
        setActiveConversation(conversationId);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Instagram-like layout */}
      <div className="flex h-screen pt-16">
        {/* Left Sidebar - Chat List */}
        <div className="w-full lg:w-[400px] border-r border-border bg-card">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-foreground">
                {user?.user_metadata?.username || user?.email || "Messages"}
              </h1>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowNewMessageModal(true)}
                className="hover:bg-muted"
              >
                <Edit3 className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search messages..."
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <Button
              variant={!showMessageRequests ? "ghost" : "ghost"}
              className={`flex-1 rounded-none border-b-2 ${
                !showMessageRequests 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setShowMessageRequests(false)}
            >
              Primary
            </Button>
            <Button
              variant={showMessageRequests ? "ghost" : "ghost"}
              className={`flex-1 rounded-none border-b-2 ${
                showMessageRequests 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setShowMessageRequests(true)}
            >
              Requests
              {/* Placeholder for message requests count */}
              <Badge variant="destructive" className="ml-2 text-xs hidden">
                0
              </Badge>
            </Button>
          </div>

          {/* Chat List */}
          <div className="overflow-y-auto">
            {!showMessageRequests ? (
              loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No conversations yet. Start messaging someone!
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  if (!otherParticipant) return null;

                  return (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        activeConversation === conversation.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setActiveConversation(conversation.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage 
                              src={otherParticipant.avatar_url} 
                              alt={otherParticipant.full_name || otherParticipant.username} 
                            />
                            <AvatarFallback>
                              {(otherParticipant.full_name || otherParticipant.username || "U").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online Status Indicator */}
                          {isUserOnline(otherParticipant.id) && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <h3 className="font-medium text-foreground truncate">
                                {otherParticipant.full_name || otherParticipant.username}
                              </h3>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatConversationTime(conversation.last_message_at)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.last_message?.content || "No messages yet"}
                            </p>
                            {conversation.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Message requests feature coming soon!
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Chat Window */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const activeConv = conversations.find(c => c.id === activeConversation);
                      const otherParticipant = activeConv ? getOtherParticipant(activeConv) : null;
                      
                      return (
                        <>
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
                            {/* Online Status Indicator */}
                            {otherParticipant && isUserOnline(otherParticipant.id) && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <h2 className="font-semibold text-foreground">
                              {otherParticipant?.full_name || otherParticipant?.username || "Unknown User"}
                            </h2>
                            <p className="text-sm font-medium">
                              {otherParticipant && isUserOnline(otherParticipant.id) ? (
                                <span className="text-green-500">Active now</span>
                              ) : (
                                <span className="text-muted-foreground">Offline</span>
                              )}
                            </p>
                          </div>
                        </>
                      );
                    })()}
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

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="text-center text-muted-foreground">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.slice().reverse().map((message) => (
                    <div
                      key={message.id}
                      data-message-id={message.id}
                      data-sender-id={message.sender_id}
                      className={`flex flex-col ${message.sender_id === user?.id ? "items-end" : "items-start"}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-[70%] ${
                        message.sender_id === user?.id ? "flex-row-reverse space-x-reverse" : ""
                      }`}>
                        {message.sender_id !== user?.id && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage 
                              src={message.profiles?.avatar_url} 
                              alt={message.profiles?.full_name || message.profiles?.username} 
                            />
                            <AvatarFallback>
                              {(message.profiles?.full_name || message.profiles?.username || "U").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`rounded-2xl px-4 py-2 ${
                          message.sender_id === user?.id 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-foreground"
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-between mt-1 text-xs ${
                            message.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                            <span>{formatMessageTime(message.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Message Status - Outside the bubble, only for sent messages */}
                      {message.sender_id === user?.id && getMessageStatus(message) && (
                        <div className="mt-1 mr-2 text-xs text-muted-foreground">
                          {getMessageStatus(message)}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Plus className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Camera className="w-5 h-5" />
                  </Button>
                  
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      className="pr-20"
                      disabled={sending}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                    variant="hero"
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Your Messages</h3>
                <p className="text-muted-foreground">Send private messages to friends and food lovers</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onStartConversation={handleStartConversation}
      />
    </div>
  );
};

export default Messages;