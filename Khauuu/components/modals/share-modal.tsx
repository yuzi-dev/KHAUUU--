"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Search, Send, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface ShareItem {
  id: string;
  type: 'restaurant' | 'food' | 'offer';
  name: string;
  image: string;
  description?: string;
  rating?: number;
  price?: string;
  location?: string;
  discount?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ShareItem | null;
}

interface User {
  user_id: string;
  username: string;
  full_name: string;
  profile_image_url?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, item }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !user) {
        setUsers([]);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, profile_image_url')
          .neq('user_id', user.id)
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setUsers([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user]);

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleShare = async () => {
    if (!user || !item || selectedUsers.size === 0) return;

    setSharing(true);
    try {
      // Get the current session to include the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const sharePromises = Array.from(selectedUsers).map(async (recipientId) => {
        const response = await fetch('/api/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            contentType: item.type,
            contentId: item.id,
            message: shareMessage.trim() || null,
            recipientIds: [recipientId]
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to share with user ${recipientId}: ${errorData.error || 'Unknown error'}`);
        }

        return response.json();
      });

      await Promise.all(sharePromises);

      toast({
        title: "Shared successfully!",
        description: `${item.name} has been shared with ${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''}`,
      });

      // Reset form
      setSelectedUsers(new Set());
      setShareMessage("");
      setSearchQuery("");
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Error sharing",
        description: error instanceof Error ? error.message : "Failed to share the item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/${item?.type}/${item?.id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Link has been copied to your clipboard",
      });
    }
  };

  const handleExternalShare = (platform: string) => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/${item?.type}/${item?.id}`;
    const shareText = `Check out this ${item?.type}: ${item?.name}!`;
    
    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "messenger":
        url = `fb-messenger://share?link=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case "viber":
        url = `viber://forward?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, "_blank");
    }
  };

  const externalPlatforms = [
    { 
      id: "copy", 
      name: "Copy link", 
      icon: "🔗", 
      bgColor: "bg-gray-100 border border-gray-300" 
    },
    { 
      id: "whatsapp", 
      name: "WhatsApp", 
      icon: "📞", 
      bgColor: "bg-green-500" 
    },
    { 
      id: "messenger", 
      name: "Messenger", 
      icon: "💬", 
      bgColor: "bg-blue-500" 
    },
    { 
      id: "facebook", 
      name: "Facebook", 
      icon: "📘", 
      bgColor: "bg-blue-600" 
    },
  ];

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 bg-white rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Share {item?.name}</DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="font-semibold text-black text-lg">Share</h3>
        </div>

        {/* Content Preview */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-12 h-12 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
              <p className="text-xs text-gray-500 truncate">{item.description}</p>
              {item.rating && (
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-xs text-yellow-500">★</span>
                  <span className="text-xs text-gray-600">{item.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <Textarea
            placeholder="Write a message..."
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            className="min-h-[60px] resize-none border-gray-200 focus:border-primary"
            maxLength={500}
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {shareMessage.length}/500
          </div>
        </div>

        {/* Search Users */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-200 focus:border-primary"
            />
          </div>
        </div>

        {/* Selected Users */}
        {selectedUsers.size > 0 && (
          <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0">
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {Array.from(selectedUsers).map((userId) => {
                const selectedUser = users.find(u => u.user_id === userId);
                if (!selectedUser) return null;
                return (
                  <Badge key={userId} variant="secondary" className="flex items-center space-x-1">
                    <span className="text-xs">{selectedUser.username}</span>
                    <button
                      onClick={() => toggleUserSelection(userId)}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* User Search Results */}
          <div className="px-4 py-2">
            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : users.length > 0 ? (
              <div>
                {users.map((searchUser) => (
                  <div
                    key={searchUser.user_id}
                    className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 cursor-pointer"
                    onClick={() => toggleUserSelection(searchUser.user_id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={searchUser.profile_image_url || '/placeholder.svg'} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {searchUser.full_name?.[0] || searchUser.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{searchUser.full_name}</p>
                        <p className="text-xs text-gray-500">@{searchUser.username}</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      {selectedUsers.has(searchUser.user_id) && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No users found
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                Search for users to share with
              </div>
            )}
          </div>
        </div>

        <Separator className="flex-shrink-0" />

        {/* External Share Options */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="grid grid-cols-4 gap-3">
            {externalPlatforms.map((platform) => (
              <button
                key={platform.id}
                className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => {
                  if (platform.id === "copy") {
                    handleCopyLink();
                  } else {
                    handleExternalShare(platform.id);
                  }
                }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm ${platform.bgColor}`}>
                  {platform.icon}
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">
                  {platform.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Share Button */}
        <div className="px-4 pb-4 flex-shrink-0">
          <Button
            onClick={handleShare}
            disabled={sharing || selectedUsers.size === 0}
            className="w-full bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
          >
            {sharing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sharing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>
                  {selectedUsers.size > 0 
                    ? `Share with ${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''}` 
                    : 'Select users to share'
                  }
                </span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;