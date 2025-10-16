"use client";

import { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, UserPlus, Heart, MessageSquare, Star, Check, X } from "lucide-react";

const Notifications = () => {
  const [followRequests, setFollowRequests] = useState(new Set(["1", "2", "3"]));

  // Mock notifications data
  const notifications = [
    {
      id: "1",
      type: "follow_request",
      user: {
        name: "Anita Karki",
        username: "@anita_foodie",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
      },
      message: "wants to follow you",
      time: "2 minutes ago",
      unread: true
    },
    {
      id: "2", 
      type: "follow_request",
      user: {
        name: "Deepak Magar",
        username: "@deepak_eats",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
      },
      message: "wants to follow you",
      time: "1 hour ago",
      unread: true
    },
    {
      id: "3",
      type: "follow_request", 
      user: {
        name: "Kamala Oli",
        username: "@kamala_reviews",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
      },
      message: "wants to follow you",
      time: "3 hours ago",
      unread: true
    }
  ];

  const activityNotifications = [
    {
      id: "4",
      type: "like",
      user: {
        name: "Priya Sharma", 
        username: "@priya_foodie",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b788?w=150&h=150&fit=crop&crop=face"
      },
      message: "liked your review of Himalayan Delights",
      time: "5 minutes ago",
      unread: true
    },
    {
      id: "5",
      type: "comment",
      user: {
        name: "Rajesh Thapa",
        username: "@rajesh_eats", 
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      message: "commented on your review: \"Great recommendation!\"",
      time: "1 hour ago",
      unread: true
    },
    {
      id: "6",
      type: "follow",
      user: {
        name: "Maya Gurung",
        username: "@maya_tastes",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
      },
      message: "started following you",
      time: "2 hours ago",
      unread: false
    },
    {
      id: "7",
      type: "review",
      user: {
        name: "Bikash Shrestha",
        username: "@bikash_reviews",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      message: "reviewed a restaurant you follow",
      time: "4 hours ago",
      unread: false
    }
  ];

  const handleFollowRequest = (notificationId: string, accept: boolean) => {
    setFollowRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
    // In real app, this would make API call
    console.log(`${accept ? 'Accepted' : 'Rejected'} follow request ${notificationId}`);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow_request':
      case 'follow':
        return <UserPlus className="w-4 h-4" />;
      case 'like':
        return <Heart className="w-4 h-4" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      case 'review':
        return <Star className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'follow_request':
      case 'follow':
        return "bg-blue-100 text-blue-600";
      case 'like':
        return "bg-red-100 text-red-600";
      case 'comment':
        return "bg-green-100 text-green-600";
      case 'review':
        return "bg-yellow-100 text-yellow-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8">
            <Bell className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            {followRequests.size > 0 && (
              <Badge variant="destructive" className="ml-2">
                {followRequests.size}
              </Badge>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="requests" className="relative">
                Follow Requests
                {followRequests.size > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {followRequests.size}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Follow Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No follow requests</h3>
                  <p className="text-muted-foreground">When someone wants to follow you, it will appear here</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Card key={notification.id} className={`hover:shadow-card transition-shadow ${notification.unread ? 'bg-card border-primary/20' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        {/* User Avatar */}
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={notification.user.avatar} alt={notification.user.name} />
                          <AvatarFallback>{notification.user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>

                        {/* Notification Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-foreground">
                                <span className="font-semibold">{notification.user.name}</span>
                                <span className="text-muted-foreground text-sm ml-1">{notification.user.username}</span>
                              </p>
                              <p className="text-muted-foreground text-sm">{notification.message}</p>
                              <p className="text-muted-foreground text-xs mt-1">{notification.time}</p>
                            </div>
                            
                            {notification.unread && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>

                          {/* Action Buttons for Follow Requests */}
                          {followRequests.has(notification.id) && (
                            <div className="flex space-x-2 mt-3">
                              <Button
                                size="sm"
                                variant="hero"
                                onClick={() => handleFollowRequest(notification.id, true)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFollowRequest(notification.id, false)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              {activityNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
                  <p className="text-muted-foreground">Your activity notifications will appear here</p>
                </div>
              ) : (
                activityNotifications.map((notification) => (
                  <Card key={notification.id} className={`hover:shadow-card transition-shadow ${notification.unread ? 'bg-card border-primary/20' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        {/* User Avatar */}
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={notification.user.avatar} alt={notification.user.name} />
                          <AvatarFallback>{notification.user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>

                        {/* Notification Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div>
                                  <p className="text-foreground">
                                    <span className="font-semibold">{notification.user.name}</span>
                                    <span className="text-muted-foreground ml-1">{notification.message}</span>
                                  </p>
                                  <p className="text-muted-foreground text-xs mt-1">{notification.time}</p>
                                </div>
                              </div>
                            </div>
                            
                            {notification.unread && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Notifications;