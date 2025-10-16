'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Star, User, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/hooks/useNotifications';

interface FollowRequest {
  id: string;
  follower_id: string;
  created_at: string;
  profiles: {
    user_id: string;
    username: string;
    full_name: string;
    profile_image_url: string | null;
  };
}

interface Notification {
  id: string;
  type: 'review' | 'follow' | 'follow_request' | 'follow_accepted' | 'like' | 'comment' | 'mention' | 'message_final';
  title: string;
  message: string;
  user: {
    user_id: string;
    username: string;
    full_name: string;
    profile_image_url: string | null;
  };
  timestamp: string;
  read: boolean;
  data: any;
}

interface NotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NotificationModal({ open, onOpenChange }: NotificationModalProps) {
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedNotifications = useRef<Set<string>>(new Set());

  // Use the real-time notifications hook
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch
  } = useNotifications();

  // Auto-mark notifications as read when they become visible
  const handleNotificationVisible = useCallback(async (notificationId: string) => {
    if (!observedNotifications.current.has(notificationId)) {
      observedNotifications.current.add(notificationId);
      try {
        await markAsRead(notificationId);
      } catch (error) {
        console.error('Error auto-marking notification as read:', error);
        // Remove from observed set if marking failed so it can be retried
        observedNotifications.current.delete(notificationId);
      }
    }
  }, [markAsRead]);

  // Set up intersection observer for auto-read functionality
  useEffect(() => {
    if (!open || activeTab !== 'activity') {
      // Clean up observer when modal is closed or not on activity tab
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      observedNotifications.current.clear();
      return;
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const notificationId = entry.target.getAttribute('data-notification-id');
            const isUnread = entry.target.getAttribute('data-unread') === 'true';
            
            if (notificationId && isUnread) {
              handleNotificationVisible(notificationId);
            }
          }
        });
      },
      {
        root: null, // Use viewport as root
        rootMargin: '0px',
        threshold: 0.5 // Trigger when 50% of the notification is visible
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      observedNotifications.current.clear();
    };
  }, [open, activeTab, handleNotificationVisible]);

  useEffect(() => {
    if (open) {
      fetchFollowRequests();
    }
  }, [open]);

  const fetchFollowRequests = async () => {
    setLoading(true);
    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No session token available');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      // Fetch follow requests only (notifications are handled by the hook)
      const requestsResponse = await fetch('/api/follows/requests', { headers });
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setFollowRequests(requestsData.requests || []);
      }
    } catch (error) {
      console.error('Error fetching follow requests:', error);
      toast.error('Failed to load follow requests');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowRequest = async (requestId: string, accept: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/follows/requests', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          action: accept ? 'accept' : 'reject'
        })
      });

      if (response.ok) {
        toast.success(accept ? 'Follow request accepted' : 'Follow request rejected');
        // Refresh follow requests to update the UI
        fetchFollowRequests();
      } else {
        toast.error('Failed to process follow request');
      }
    } catch (error) {
      console.error('Error handling follow request:', error);
      toast.error('Failed to process follow request');
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'follow':
      case 'follow_accepted':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'follow_request':
        return <User className="w-4 h-4 text-orange-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests" className="relative">
              Follow Requests
              {followRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {followRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests" className="mt-4">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : followRequests.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No pending follow requests
                </div>
              ) : (
                <div className="space-y-4">
                  {followRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={request.profiles.profile_image_url || ''} />
                          <AvatarFallback>
                            {(request.profiles.full_name || request.profiles.username).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {request.profiles.full_name || request.profiles.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{request.profiles.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(request.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFollowRequest(request.id, false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleFollowRequest(request.id, true)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="activity" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">Recent Activity</h3>
              {notifications.some(n => !n.read) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllNotificationsAsRead}
                  className="text-xs"
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => {
                    const NotificationComponent = ({ notification }: { notification: any }) => {
                      const notificationRef = useRef<HTMLDivElement>(null);

                      // Observe this notification for auto-read functionality
                      useEffect(() => {
                        const element = notificationRef.current;
                        if (!element || !observerRef.current || notification.read) return;

                        observerRef.current.observe(element);

                        return () => {
                          if (observerRef.current && element) {
                            observerRef.current.unobserve(element);
                          }
                        };
                      }, [notification.read]);

                      return (
                        <div 
                          ref={notificationRef}
                          key={notification.id}
                          data-notification-id={notification.id}
                          data-unread={!notification.read}
                          className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                            !notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={notification.user?.profile_image_url || ''} />
                                <AvatarFallback className="text-xs">
                                  {(notification.user?.full_name || notification.user?.username || 'U').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className={`text-sm ${!notification.read ? 'font-medium text-foreground' : 'text-foreground'}`}>
                              {notification.message}
                            </p>
                            {notification.type === 'review' && notification.data?.comment && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                "{notification.data.comment}"
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    };

                    return <NotificationComponent key={notification.id} notification={notification} />;
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}