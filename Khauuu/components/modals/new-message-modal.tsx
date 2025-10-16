"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, X, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface User {
  user_id: string;
  username: string;
  full_name: string;
  profile_image_url?: string;
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (userIds: string[], isGroup?: boolean) => void;
}

export function NewMessageModal({ isOpen, onClose, onStartConversation }: NewMessageModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);

  // Search for users
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No session token available');
        setSearchResults([]);
        return;
      }

      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter out current user from results
        const filteredUsers = data.users.filter((u: User) => u.user_id !== user?.id);
        setSearchResults(filteredUsers);
      } else {
        console.error("Failed to search users");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUserSelect = (selectedUser: User) => {
    if (isGroupMode) {
      // In group mode, allow multiple selections
      if (selectedUsers.find(u => u.user_id === selectedUser.user_id)) {
        setSelectedUsers(selectedUsers.filter(u => u.user_id !== selectedUser.user_id));
      } else {
        setSelectedUsers([...selectedUsers, selectedUser]);
      }
    } else {
      // In direct message mode, start conversation immediately
      onStartConversation([selectedUser.user_id]);
      handleClose();
    }
  };

  const handleStartGroupConversation = () => {
    if (selectedUsers.length < 2) {
      toast({
        title: "Group Requirement",
        description: "Please select at least 2 users for a group conversation.",
        variant: "destructive",
      });
      return;
    }

    const userIds = selectedUsers.map(u => u.user_id);
    onStartConversation(userIds, true);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUsers([]);
    setIsGroupMode(false);
    onClose();
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.user_id !== userId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            New Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={!isGroupMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsGroupMode(false);
                setSelectedUsers([]);
              }}
              className="flex-1"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Direct Message
            </Button>
            <Button
              variant={isGroupMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsGroupMode(true)}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              Group Message
            </Button>
          </div>

          {/* Selected Users (Group Mode) */}
          {isGroupMode && selectedUsers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected ({selectedUsers.length}):</p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge key={user.user_id} variant="secondary" className="flex items-center gap-1">
                    {user.full_name || user.username}
                    <button
                      onClick={() => removeSelectedUser(user.user_id)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          <div className="max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="text-center py-4 text-muted-foreground">
                Searching...
              </div>
            ) : searchQuery.length >= 2 ? (
              searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((searchUser) => {
                    const isSelected = selectedUsers.find(u => u.user_id === searchUser.user_id);
                    return (
                      <div
                        key={searchUser.user_id}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          isSelected ? "bg-muted" : ""
                        }`}
                        onClick={() => handleUserSelect(searchUser)}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={searchUser.profile_image_url} alt={searchUser.full_name || searchUser.username} />
                          <AvatarFallback>
                            {(searchUser.full_name || searchUser.username || "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {searchUser.full_name || searchUser.username}
                          </p>
                          {searchUser.full_name && (
                            <p className="text-sm text-muted-foreground truncate">
                              @{searchUser.username}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Badge variant="default">
                            Selected
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No users found matching "{searchQuery}"
                </div>
              )
            ) : searchQuery.length > 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {isGroupMode 
                  ? "Search for users to add to your group conversation"
                  : "Search for a user to start messaging"
                }
              </div>
            )}
          </div>

          {/* Group Mode Actions */}
          {isGroupMode && selectedUsers.length > 0 && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedUsers([])}
                  className="flex-1"
                >
                  Clear Selection
                </Button>
                <Button
                  onClick={handleStartGroupConversation}
                  disabled={selectedUsers.length < 2}
                  className="flex-1"
                >
                  Start Group ({selectedUsers.length})
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}