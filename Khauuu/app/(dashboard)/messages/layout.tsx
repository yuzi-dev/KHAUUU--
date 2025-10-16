"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { formatDistanceToNow } from "date-fns";
import { 
  Search, 
  Edit3
} from "lucide-react";
import { NewMessageModal } from "@/components/modals/new-message-modal";
import Navbar from "@/components/layout/navbar";

interface MessagesLayoutProps {
  children: React.ReactNode;
}

const MessagesLayout = ({ children }: MessagesLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { isUserOnline } = useOnlineStatus();
  const {
    conversations,
    loading,
    startConversation,
  } = useMessages();

  const [showMessageRequests, setShowMessageRequests] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get active conversation ID from URL
  const activeConversationId = pathname.split('/messages/')[1] || null;

  const formatConversationTime = (timestamp: string) => {
    if (!timestamp) return "";
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "";
    }
  };

  const getOtherParticipant = (conversation: any) => {
    return conversation.participants?.find((p: any) => p.user_id !== user?.id);
  };

  const handleStartConversation = async (userIds: string[], isGroup: boolean = false) => {
    try {
      const conversationId = await startConversation(userIds, isGroup);
      if (conversationId) {
        router.push(`/messages/${conversationId}`);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      <Navbar />
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Chat List */}
        <div className="w-full lg:w-[400px] border-r border-border bg-card flex flex-col">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <Badge variant="destructive" className="ml-2 text-xs hidden">
              0
            </Badge>
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
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
              conversations
                .filter(conversation => {
                  if (!searchQuery) return true;
                  const otherParticipant = getOtherParticipant(conversation);
                  const searchLower = searchQuery.toLowerCase();
                  return (
                    otherParticipant?.full_name?.toLowerCase().includes(searchLower) ||
                    otherParticipant?.username?.toLowerCase().includes(searchLower) ||
                    conversation.last_message?.content?.toLowerCase().includes(searchLower)
                  );
                })
                .map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  if (!otherParticipant) return null;

                  const isActive = activeConversationId === conversation.id;

                  return (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        isActive ? "bg-muted border-r-2 border-primary" : ""
                      }`}
                      onClick={() => router.push(`/messages/${conversation.id}`)}
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
                          {isUserOnline(otherParticipant.user_id) && (
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

        {/* Right Side - Chat Window (Dynamic Content) */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* New Message Modal */}
        <NewMessageModal
          isOpen={showNewMessageModal}
          onClose={() => setShowNewMessageModal(false)}
          onStartConversation={handleStartConversation}
        />
      </div>
    </div>
  );
};

export default MessagesLayout;