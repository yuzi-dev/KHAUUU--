"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, UserCheck, MapPin } from "lucide-react";
import FollowButton from "./follow-button";
import { supabase } from '@/lib/supabase';

interface UserCardProps {
  user: {
    id: string;
    name: string;
    username: string;
    bio: string;
    avatar: string;
    followers: number;
    following: number;
    reviews: number;
    verified?: boolean;
    location?: string;
  };
  initialFollowing?: boolean;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
  showStats?: boolean;
  compact?: boolean;
}

const UserCard = ({ 
  user, 
  initialFollowing = false, 
  onFollowChange, 
  showStats = true, 
  compact = false 
}: UserCardProps) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);

  const handleFollow = () => {
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);
    onFollowChange?.(user.id, newFollowingState);
  };

  if (compact) {
    return (
      <Card className="hover:shadow-card transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm">{user.name}</h4>
                  {user.verified && (
                    <Badge variant="default" className="text-xs">✓</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">{user.username}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "hero"}
              onClick={handleFollow}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3 h-3 mr-1" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 mr-1" />
                  Follow
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-card transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {/* User Info */}
          <div className="flex items-start space-x-4 flex-1">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
                {user.verified && (
                  <Badge variant="default" className="text-xs">Verified</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-2">{user.username}</p>
              <p className="text-foreground mb-3">{user.bio}</p>
              
              {user.location && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-3 h-3" />
                  <span>{user.location}</span>
                </div>
              )}
              
              {/* Stats */}
              {showStats && (
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">{user.followers}</span> followers
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{user.following}</span> following
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{user.reviews}</span> reviews
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Follow Button */}
          <div className="ml-4">
            <Button
              variant={isFollowing ? "outline" : "hero"}
              onClick={handleFollow}
              className="min-w-[100px]"
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;