"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Menu, X, MapPin, MessageCircle, Bell, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProfileAvatar from "@/features/profile/components/profile-avatar";
import NotificationModal from '@/components/modals/notification-modal';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/hooks/useNotifications';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [followRequestCount, setFollowRequestCount] = useState(0);
  const router = useRouter();
  const { user, loading } = useAuth();

  // Use real-time notifications hook
  const { unreadCount } = useNotifications();

  // Calculate total notification count (follow requests + unread notifications)
  const totalNotificationCount = followRequestCount + unreadCount;

  // Fetch follow request count only
  useEffect(() => {
    const fetchFollowRequestCount = async () => {
      if (!user) return;
      
      try {
        // Get the session to include the Bearer token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const followRequestsRes = await fetch('/api/follows/requests', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (followRequestsRes.ok) {
          const followRequests = await followRequestsRes.json();
          setFollowRequestCount(followRequests.requests?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching follow request count:', error);
      }
    };

    fetchFollowRequestCount();
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-primary">Khauuu</div>
            <div className="text-sm text-muted-foreground hidden sm:block">खाऊ</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">Discover</Link>
            <Link href="/restaurants" className="text-foreground hover:text-primary transition-colors">Restaurants</Link>
            <Link href="/reviews" className="text-foreground hover:text-primary transition-colors">Reviews</Link>
            <Link href="/offers" className="text-foreground hover:text-primary transition-colors">Offers</Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="warm" size="sm">
              <MapPin className="w-4 h-4" />
              Kathmandu
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/search')}
            >
              <Users className="w-4 h-4" />
              Find Users
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative"
            >
              <Bell className="w-4 h-4" />
              {totalNotificationCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs w-5 h-5 p-0 flex items-center justify-center">
                  {totalNotificationCount}
                </Badge>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/messages')}
            >
              <MessageCircle className="w-4 h-4" />
              Messages
            </Button>
            
            {/* Authentication Section */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <ProfileAvatar />
            ) : (
              <>
                <Button variant="outline" size="sm">
                  <Link href="/login">Log In</Link>
                </Button>
                <Button variant="hero" size="sm">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden animate-fade-in">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-card rounded-lg mt-2 shadow-card">
              <Link href="/" className="block px-3 py-2 text-foreground hover:text-primary transition-colors">Discover</Link>
              <Link href="/restaurants" className="block px-3 py-2 text-foreground hover:text-primary transition-colors">Restaurants</Link>
              <Link href="/reviews" className="block px-3 py-2 text-foreground hover:text-primary transition-colors">Reviews</Link>
              <Link href="/offers" className="block px-3 py-2 text-foreground hover:text-primary transition-colors">Offers</Link>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="warm" size="sm">
                  <MapPin className="w-4 h-4" />
                  Kathmandu
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/search')}
                >
                  <Users className="w-4 h-4" />
                  Find Users
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsNotificationModalOpen(true)}
                  className="relative justify-start"
                >
                  <Bell className="w-4 h-4" />
                  Notifications
                  {totalNotificationCount > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {totalNotificationCount}
                    </Badge>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/messages')}
                >
                  <MessageCircle className="w-4 h-4" />
                  Messages
                </Button>
                
                {/* Authentication Section */}
                {loading ? (
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                ) : user ? (
                  <ProfileAvatar />
                ) : (
                  <>
                    <Button variant="outline" size="sm">
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button variant="hero" size="sm">
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Notification Modal */}
      <NotificationModal 
        open={isNotificationModalOpen} 
        onOpenChange={setIsNotificationModalOpen} 
      />
    </nav>
  );
};

export default Navbar;