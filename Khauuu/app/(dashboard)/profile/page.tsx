"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmationModal from "@/components/modals/confirmation-modal";
import { 
  Settings, 
  Grid3X3, 
  Bookmark, 
  UserPlus, 
  MoreHorizontal,
  Heart,
  MessageCircle,
  Send,
  Share,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Camera,
  Plus,
  Star,
  Clock,
  Eye,
  EyeOff,
  Edit,
  Utensils,
  Tag,
  Home,
  PenTool
} from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  bio: string;
  profile_image_url: string;
  website: string;
  location: string;
  is_vegetarian: boolean;
  is_private: boolean;
  reviews_public: boolean;
  saved_public: boolean;
  review_count: number;
  followers_count: number;
  following_count: number;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  restaurants?: {
    id: string;
    name: string;
    image_url: string;
  };
  foods?: {
    id: string;
    name: string;
    image_url: string;
  };
}

interface SavedItem {
  id: string;
  created_at: string;
  restaurants?: {
    id: string;
    name: string;
    image_url: string;
    cuisine_type: string;
    rating: number;
    location: string;
  };
  foods?: {
    id: string;
    name: string;
    image_url: string;
    price: number;
    description: string;
    restaurants: {
      id: string;
      name: string;
    };
  };
}

const Profile = () => {
  const { user, session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [savedItems, setSavedItems] = useState<{ savedRestaurants: SavedItem[], savedFoods: SavedItem[] }>({ savedRestaurants: [], savedFoods: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reviews");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  
  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<'none' | 'following' | 'pending'>('none');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "",
    bio: "",
    website: "",
    location: "",
    is_vegetarian: false
  });
  const [settingsForm, setSettingsForm] = useState({
    reviews_public: true,
    saved_public: false,
    is_vegetarian: false,
    is_private: false
  });

  // Modal states for followers/following
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean
    user: any
    action: 'unfollow' | null
    onConfirm: () => void
  }>({
    isOpen: false,
    user: null,
    action: null,
    onConfirm: () => {}
  })

  // Create profile function
  const createProfile = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/profile/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Profile created successfully:', data.profile);
        toast({
          title: "Profile Created",
          description: "Your profile has been set up successfully",
          variant: "default"
        });
      } else {
        console.error('Profile creation error:', data);
        toast({
          title: "Error",
          description: data.details || "Failed to create profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error",
        description: "Failed to create profile",
        variant: "destructive"
      });
    }
  };

  // Fetch profile data
  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/profile?userId=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.profile);
        setIsOwnProfile(data.profile.user_id === user.id);
        
        setEditForm({
          full_name: data.profile.full_name || "",
          username: data.profile.username || "",
          bio: data.profile.bio || "",
          website: data.profile.website || "",
          location: data.profile.location || "",
          is_vegetarian: data.profile.is_vegetarian || false
        });
        setSettingsForm({
          reviews_public: data.profile.reviews_public,
          saved_public: data.profile.saved_public,
          is_vegetarian: data.profile.is_vegetarian || false,
          is_private: data.profile.is_private || false
        });
        
        // Check follow status if not own profile
        if (data.profile.user_id !== user.id) {
          await checkFollowStatus(data.profile.user_id);
        }
      } else if (response.status === 404 && data.code === 'PROFILE_NOT_FOUND') {
        // Profile doesn't exist - create one automatically
        console.log('No profile found for user, creating one...');
        await createProfile();
        // After creating, fetch the profile again
        setTimeout(() => fetchProfile(), 1000);
      } else {
        console.error('Profile fetch error:', data);
        toast({
          title: "Error",
          description: data.details || "Failed to load profile data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    }
  };

  // Fetch user reviews
  const fetchReviews = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/reviews/user?userId=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setReviews(data.reviews);
      } else {
        console.error("Failed to fetch reviews:", data.error);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  // Fetch saved items
  const fetchSavedItems = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/saved?userId=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSavedItems({
          savedRestaurants: data.savedRestaurants,
          savedFoods: data.savedFoods
        });
      } else {
        console.error("Failed to fetch saved items:", data.error);
      }
    } catch (error) {
      console.error("Error fetching saved items:", error);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      Promise.all([
        fetchProfile(),
        fetchReviews(),
        fetchSavedItems()
      ]).finally(() => {
        setLoading(false);
      });
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  const handleEditSubmit = async () => {
    if (!user || !profile) return;
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          profileData: editForm
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.profile);
        setIsEditDialogOpen(false);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleSettingsSubmit = async () => {
    if (!user || !profile) return;
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          profileData: settingsForm
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.profile);
        setIsSettingsDialogOpen(false);
        toast({
          title: "Success",
          description: "Settings updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    // For dates older than a week, show the actual date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check follow status function
  const checkFollowStatus = async (targetUserId: string) => {
    if (!session?.access_token) return;
    
    try {
      const response = await fetch(`/api/follows/status?target_user_id=${targetUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFollowStatus(data.is_following ? 'following' : (data.is_pending ? 'pending' : 'none'));
        setIsFollowing(data.is_following || false);
      } else {
        console.error('Failed to check follow status:', response.status);
        setFollowStatus('none');
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
      setFollowStatus('none');
      setIsFollowing(false);
    }
  };

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!profile || isOwnProfile || !session?.access_token) return;

    try {
      const response = await fetch('/api/follows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: followStatus === 'following' ? 'unfollow' : 'follow',
          followed_user_id: profile.user_id
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (followStatus === 'following') {
          // Unfollowing
          setFollowStatus('none');
          setIsFollowing(false);
        } else {
          // Following - check if it's a private profile
          if (result.status === 'pending') {
            setFollowStatus('pending');
            setIsFollowing(false);
          } else {
            setFollowStatus('following');
            setIsFollowing(true);
          }
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to update follow status:', errorData);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  // Handle follow/unfollow for users in stats modal
  const handleFollowInModal = async (userId: string, isCurrentlyFollowing: boolean, user: any) => {
    if (!session?.access_token) return;

    // Show confirmation modal for unfollow actions
    if (isCurrentlyFollowing) {
      setConfirmationModal({
        isOpen: true,
        user: user,
        action: 'unfollow',
        onConfirm: () => performFollowAction(userId, true)
      })
      return
    }

    // Direct follow for new follows
    performFollowAction(userId, false)
  };

  const performFollowAction = async (userId: string, isUnfollow: boolean) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/follows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: isUnfollow ? 'unfollow' : 'follow',
          followed_user_id: userId
        }),
      });

      if (response.ok) {
        // Refresh the followers/following lists
        if (isFollowersModalOpen) {
          fetchFollowers();
        }
        if (isFollowingModalOpen) {
          fetchFollowing();
        }
        // Close confirmation modal
        setConfirmationModal(prev => ({ ...prev, isOpen: false }))
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  // Fetch followers
  const fetchFollowers = async () => {
    if (!profile || !session?.access_token) return;
    
    setFollowersLoading(true);
    try {
      const response = await fetch(`/api/follows/followers/${profile.user_id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFollowers(data.followers || []);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setFollowersLoading(false);
    }
  };

  // Fetch following
  const fetchFollowing = async () => {
    if (!profile || !session?.access_token) return;
    
    setFollowingLoading(true);
    try {
      const response = await fetch(`/api/follows/following/${profile.user_id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following || []);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setFollowingLoading(false);
    }
  };

  // Handle followers modal open
  const handleFollowersClick = () => {
    setIsFollowersModalOpen(true);
    fetchFollowers();
  };

  // Handle following modal open
  const handleFollowingClick = () => {
    setIsFollowingModalOpen(true);
    fetchFollowing();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  const allSavedItems = [
    ...savedItems.savedRestaurants.map(item => ({
      id: item.id,
      type: 'restaurant' as const,
      name: item.restaurants?.name || '',
      image: item.restaurants?.image_url || '/placeholder.svg',
      description: item.restaurants?.cuisine_type || '',
      location: item.restaurants?.location || '',
      created_at: item.created_at
    })),
    ...savedItems.savedFoods.map(item => ({
      id: item.id,
      type: 'food' as const,
      name: item.foods?.name || '',
      image: item.foods?.image_url || '/placeholder.svg',
      description: item.foods?.description || '',
      restaurant: item.foods?.restaurants?.name || '',
      created_at: item.created_at
    }))
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-16">
        {/* Profile Header */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            {/* Profile Picture */}
            <div className="flex justify-center md:justify-start">
              <div className="relative">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 ring-2 ring-border">
                  <AvatarImage src={profile.profile_image_url || '/placeholder.svg'} />
                  <AvatarFallback className="text-2xl">{profile.full_name?.[0] || profile.username?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-2 right-2 rounded-full w-8 h-8 bg-primary"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              {/* Username and Actions */}
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-normal text-foreground">
                    {profile.username}
                  </h1>
                  {/* Dietary preference indicator */}
                  <div className="flex items-center ml-2">
                    <div className={`w-3 h-3 rounded-full ${profile.is_vegetarian ? 'bg-green-500' : 'bg-orange-500'}`} 
                         title={profile.is_vegetarian ? 'Vegetarian' : 'Non-Vegetarian'}>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                   {!isOwnProfile && (
                     <Button 
                       variant={followStatus === 'following' ? 'outline' : 'default'} 
                       className="px-6"
                       onClick={handleFollow}
                     >
                       {followStatus === 'following' ? 'Following' : 
                        followStatus === 'pending' ? 'Requested' : 'Follow'}
                     </Button>
                   )}
                   
                   {isOwnProfile && (
                     <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                       <DialogTrigger asChild>
                         <Button variant="outline" className="px-6">
                           <Edit className="w-4 h-4 mr-2" />
                           Edit profile
                         </Button>
                       </DialogTrigger>
                       <DialogContent className="max-w-md">
                         <DialogHeader>
                           <DialogTitle>Edit Profile</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-4">
                           <div>
                             <Label htmlFor="fullName">Full Name</Label>
                             <Input
                               id="fullName"
                               value={editForm.full_name}
                               onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                             />
                           </div>
                           <div>
                             <Label htmlFor="username">Username</Label>
                             <Input
                               id="username"
                               value={editForm.username}
                               onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                             />
                           </div>
                           <div>
                             <Label htmlFor="bio">Bio</Label>
                             <Textarea
                               id="bio"
                               value={editForm.bio}
                               onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                               rows={4}
                             />
                           </div>
                           <div>
                             <Label htmlFor="website">Website</Label>
                             <Input
                               id="website"
                               value={editForm.website}
                               onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                             />
                           </div>
                           <div>
                             <Label htmlFor="location">Location</Label>
                             <Input
                               id="location"
                               value={editForm.location}
                               onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                             />
                           </div>
                           <div className="flex items-center justify-between">
                             <Label htmlFor="vegetarian">Vegetarian</Label>
                             <Switch
                               id="vegetarian"
                               checked={editForm.is_vegetarian}
                               onCheckedChange={(checked) => setEditForm({...editForm, is_vegetarian: checked})}
                             />
                           </div>
                           <div className="flex gap-2 pt-4">
                             <Button onClick={handleEditSubmit} className="flex-1">
                               Save Changes
                             </Button>
                             <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                               Cancel
                             </Button>
                           </div>
                         </div>
                       </DialogContent>
                     </Dialog>
                   )}
                   
                   <Button variant="outline" className="px-6">
                     Share profile
                   </Button>
                   <Button variant="outline" size="icon">
                     <UserPlus className="w-4 h-4" />
                   </Button>
                   
                   {isOwnProfile && (
                     <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                       <DialogTrigger asChild>
                         <Button variant="outline" size="icon">
                           <Settings className="w-4 h-4" />
                         </Button>
                       </DialogTrigger>
                       <DialogContent className="max-w-md">
                         <DialogHeader>
                           <DialogTitle>Privacy Settings</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-6">
                           <div className="flex items-center justify-between">
                             <div className="space-y-1">
                               <Label>Reviews Visibility</Label>
                               <p className="text-sm text-muted-foreground">
                                 Make your reviews {settingsForm.reviews_public ? 'public' : 'private'}
                               </p>
                             </div>
                             <div className="flex items-center gap-2">
                               {settingsForm.reviews_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                               <Switch
                                 checked={settingsForm.reviews_public}
                                 onCheckedChange={(checked) => setSettingsForm({...settingsForm, reviews_public: checked})}
                               />
                             </div>
                           </div>
                           
                           <div className="flex items-center justify-between">
                             <div className="space-y-1">
                               <Label>Saved Items Visibility</Label>
                               <p className="text-sm text-muted-foreground">
                                 Make your saved items {settingsForm.saved_public ? 'public' : 'private'}
                               </p>
                             </div>
                             <div className="flex items-center gap-2">
                               {settingsForm.saved_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                               <Switch
                                 checked={settingsForm.saved_public}
                                 onCheckedChange={(checked) => setSettingsForm({...settingsForm, saved_public: checked})}
                               />
                             </div>
                           </div>
                           
                           <div className="flex items-center justify-between">
                             <div className="space-y-1">
                               <Label>Profile Privacy</Label>
                               <p className="text-sm text-muted-foreground">
                                 Make your profile {settingsForm.is_private ? 'private (requires follow approval)' : 'public'}
                               </p>
                             </div>
                             <div className="flex items-center gap-2">
                               {settingsForm.is_private ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                               <Switch
                                 checked={settingsForm.is_private}
                                 onCheckedChange={(checked) => setSettingsForm({...settingsForm, is_private: checked})}
                               />
                             </div>
                           </div>
                           
                           <div className="flex items-center justify-between">
                             <div className="space-y-1">
                               <Label>Dietary Preference</Label>
                               <p className="text-sm text-muted-foreground">
                                 Show as {settingsForm.is_vegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
                               </p>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="text-sm">{settingsForm.is_vegetarian ? '🥬' : '🍖'}</span>
                               <Switch
                                 checked={settingsForm.is_vegetarian}
                                 onCheckedChange={(checked) => setSettingsForm({...settingsForm, is_vegetarian: checked})}
                               />
                             </div>
                           </div>
                           
                           <div className="flex gap-2 pt-4">
                             <Button onClick={handleSettingsSubmit} className="flex-1">
                               Save Settings
                             </Button>
                             <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)} className="flex-1">
                               Cancel
                             </Button>
                           </div>
                         </div>
                       </DialogContent>
                     </Dialog>
                   )}
                 </div>
              </div>

              {/* Stats */}
              <div className="flex gap-8">
                <div className="text-center md:text-left">
                  <span className="font-semibold text-foreground">{profile.review_count || 0}</span>
                  <span className="text-foreground ml-1">reviews</span>
                </div>
                <div 
                  className="text-center md:text-left cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={handleFollowersClick}
                >
                  <span className="font-semibold text-foreground">{profile.followers_count || 0}</span>
                  <span className="text-foreground ml-1">followers</span>
                </div>
                <div 
                  className="text-center md:text-left cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={handleFollowingClick}
                >
                  <span className="font-semibold text-foreground">{profile.following_count || 0}</span>
                  <span className="text-foreground ml-1">following</span>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <h2 className="font-semibold text-foreground">{profile.full_name}</h2>
                <div className="text-sm text-foreground whitespace-pre-line">
                  {profile.bio}
                </div>
                {profile.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <LinkIcon className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={profile.website} 
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Content Tabs */}
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-center bg-transparent border-0 h-auto p-0">
              <TabsTrigger 
                value="reviews" 
                className="flex items-center gap-2 px-6 py-4 data-[state=active]:border-t-2 data-[state=active]:border-primary rounded-none bg-transparent"
              >
                <Star className="w-4 h-4" />
                <span className="hidden md:inline">REVIEWS</span>
              </TabsTrigger>
              <TabsTrigger 
                value="saved" 
                className="flex items-center gap-2 px-6 py-4 data-[state=active]:border-t-2 data-[state=active]:border-primary rounded-none bg-transparent"
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden md:inline">SAVED</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="mt-0">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  {profile.reviews_public ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                  <span className="text-sm text-muted-foreground">
                    Reviews are {profile.reviews_public ? 'public' : 'private'}
                  </span>
                </div>
              </div>
              
              {/* Show reviews only if public or own profile */}
              {(profile.reviews_public || isOwnProfile) ? (
                reviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {reviews.map((review) => (
                      <div 
                        key={review.id} 
                        className="bg-card rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square relative">
                          <img 
                            src={review.foods?.image_url || review.restaurants?.image_url || '/placeholder.svg'} 
                            alt={review.foods?.name || review.restaurants?.name || 'Review'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{review.rating}</span>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Utensils className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm truncate">
                              {review.foods?.name || review.restaurants?.name}
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {review.review_text}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatDate(review.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Star className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground">
                      {isOwnProfile ? "Start reviewing restaurants and foods to share your experiences!" : "This user hasn't shared any reviews yet."}
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <EyeOff className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Private Reviews</h3>
                  <p className="text-muted-foreground">
                    This user's reviews are private. {followStatus === 'following' ? 'Follow them to see their reviews.' : 'You need to follow them to see their reviews.'}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Saved Tab */}
            <TabsContent value="saved" className="mt-0">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  {profile.saved_public ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                  <span className="text-sm text-muted-foreground">
                    Saved items are {profile.saved_public ? 'public' : 'private'}
                  </span>
                </div>
              </div>
              
              {/* Show saved items only if public or own profile */}
              {(profile.saved_public || isOwnProfile) ? (
                allSavedItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {allSavedItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-card rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square relative">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="text-xs">
                              <Utensils className="w-3 h-3 mr-1" />
                              {item.type}
                            </Badge>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Bookmark className="w-5 h-5 text-white fill-white drop-shadow-lg" />
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm mb-1 truncate">{item.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                          {item.type === 'restaurant' && item.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{item.location}</span>
                            </div>
                          )}
                          {item.type === 'food' && item.restaurant && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Utensils className="w-3 h-3" />
                              <span>{item.restaurant}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Bookmark className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Nothing Saved Yet</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-4">
                      {isOwnProfile ? "Save restaurants and foods that you want to remember for later." : "This user hasn't saved anything yet."}
                    </p>
                    {isOwnProfile && (
                      <div className="flex gap-2">
                        <Button onClick={() => router.push('/restaurants')} className="flex items-center gap-2">
                          <Utensils className="w-4 h-4" />
                          Browse Restaurants
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/')} className="flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          Go Home
                        </Button>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <EyeOff className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Private Saved Items</h3>
                  <p className="text-muted-foreground text-center max-w-sm">
                    This user's saved items are private. {followStatus === 'following' ? 'Follow them to see their saved items.' : 'You need to follow them to see their saved items.'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Followers Modal */}
      <Dialog open={isFollowersModalOpen} onOpenChange={setIsFollowersModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {followersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : followers.length > 0 ? (
              followers.map((follower: any) => (
                <div key={follower.user_id} className="flex items-center justify-between">
                  <div 
                    className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() => router.push(`/profile/${follower.user_id}`)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={follower.avatar_url || '/placeholder.svg'} />
                      <AvatarFallback>{follower.full_name?.[0] || follower.username?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{follower.full_name || follower.username}</p>
                      <p className="text-muted-foreground text-xs">@{follower.username}</p>
                    </div>
                  </div>
                  {follower.user_id !== user?.id && (
                    <Button 
                      variant={follower.is_following ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleFollowInModal(follower.user_id, follower.is_following, follower)}
                    >
                      {follower.is_following ? "Unfollow" : "Follow"}
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No followers yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Modal */}
      <Dialog open={isFollowingModalOpen} onOpenChange={setIsFollowingModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {followingLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : following.length > 0 ? (
              following.map((followedUser: any) => (
                <div key={followedUser.user_id} className="flex items-center justify-between">
                  <div 
                    className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() => router.push(`/profile/${followedUser.user_id}`)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={followedUser.avatar_url || '/placeholder.svg'} />
                      <AvatarFallback>{followedUser.full_name?.[0] || followedUser.username?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{followedUser.full_name || followedUser.username}</p>
                      <p className="text-muted-foreground text-xs">@{followedUser.username}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleFollowInModal(followedUser.user_id, true, followedUser)}
                  >
                    Unfollow
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Not following anyone yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title="Unfollow User"
        description="Are you sure you want to unfollow this user? You will no longer see their posts in your feed."
        confirmText="Unfollow"
        cancelText="Cancel"
        variant="destructive"
        user={confirmationModal.user}
      />

      <Footer />
    </div>
  );
};

export default Profile;