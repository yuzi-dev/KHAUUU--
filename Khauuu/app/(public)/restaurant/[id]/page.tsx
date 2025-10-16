"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Star, Heart, Send, MapPin, Phone, Globe, Clock, DollarSign, Wifi, Car, CreditCard, Users, ThumbsUp, Reply, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import ShareModal from '@/components/modals/share-modal';
import { restaurantService, type RestaurantWithFoods } from '@/lib/services';
import { reviewService, type ReviewWithDetails, type ReviewReplyWithDetails, type CreateReviewData, type CreateReplyData } from '@/lib/services/reviews';
import { useAuth } from '@/contexts/AuthContext';

// Image paths as strings
const restaurantImage = '/assets/restaurant-interior.jpg';
const momosImage = '/assets/momos.jpg';
const dalBhatImage = '/assets/dal-bhat.jpg';

const RestaurantDetail = () => {
  const router = useRouter();
  const params = useParams();
  const { user, session } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [showMenuImages, setShowMenuImages] = useState(false);
  const [restaurant, setRestaurant] = useState<RestaurantWithFoods | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Review-related state
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    review_text: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [replyForms, setReplyForms] = useState<{ [key: string]: boolean }>({});
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  const [submittingReplies, setSubmittingReplies] = useState<{ [key: string]: boolean }>({});
  const [expandedReplies, setExpandedReplies] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!params?.id || typeof params.id !== 'string') {
        setError('Invalid restaurant ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await restaurantService.getById(params.id);
        
        if (!data) {
          setError('Restaurant not found');
        } else {
          setRestaurant(data);
          // Fetch reviews for this restaurant
          await fetchReviews(params.id);
        }
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        setError('Failed to load restaurant data');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [params?.id]);

  const fetchReviews = async (restaurantId: string) => {
    try {
      setReviewsLoading(true);
      
      // Use the API endpoint to get reviews with user_liked information
      const response = await fetch(`/api/reviews?restaurant_id=${restaurantId}`, {
        headers: session?.access_token ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {}
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user || !session?.access_token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to write a review",
        variant: "destructive",
      });
      return;
    }

    if (!restaurant) return;

    if (!reviewFormData.review_text.trim()) {
      toast({
        title: "Review Required",
        description: "Please write a review",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingReview(true);
      const reviewData: CreateReviewData = {
        restaurant_id: restaurant.id,
        rating: reviewFormData.rating,
        review_text: reviewFormData.review_text.trim(),
        is_public: true
      };

      await reviewService.create(reviewData, session.access_token);
      
      toast({
        title: "Success",
        description: "Review submitted successfully!",
      });

      // Reset form and refresh reviews
      setReviewFormData({ rating: 5, review_text: '' });
      setShowReviewForm(false);
      await fetchReviews(restaurant.id);
    } catch (err) {
      console.error('Error submitting review:', err);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!user || !session?.access_token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to reply",
        variant: "destructive",
      });
      return;
    }

    const replyText = replyTexts[reviewId]?.trim();
    if (!replyText) {
      toast({
        title: "Reply Required",
        description: "Please write a reply",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingReplies(prev => ({ ...prev, [reviewId]: true }));
      
      const replyData: CreateReplyData = {
        review_id: reviewId,
        reply_text: replyText
      };

      await reviewService.createReply(replyData, session.access_token);
      
      toast({
        title: "Success",
        description: "Reply submitted successfully!",
      });

      // Reset reply form and refresh reviews
      setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
      setReplyForms(prev => ({ ...prev, [reviewId]: false }));
      if (restaurant) {
        await fetchReviews(restaurant.id);
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
      toast({
        title: "Error",
        description: "Failed to submit reply",
        variant: "destructive",
      });
    } finally {
      setSubmittingReplies(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleLikeToggle = async (reviewId: string, isReply: boolean = false) => {
    if (!user || !session?.access_token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to like reviews",
        variant: "destructive",
      });
      return;
    }

    try {
      const params = isReply ? { reply_id: reviewId } : { review_id: reviewId };
      await reviewService.toggleLike(params, session.access_token);
      // Refresh reviews to update like counts
      if (restaurant) {
        await fetchReviews(restaurant.id);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const toggleReplyForm = (reviewId: string) => {
    setReplyForms(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const toggleExpandReplies = async (reviewId: string) => {
    const isExpanded = expandedReplies[reviewId];
    setExpandedReplies(prev => ({ ...prev, [reviewId]: !isExpanded }));
    
    // If expanding and we don't have replies loaded, fetch them
    if (!isExpanded) {
      try {
        const response = await fetch(`/api/reviews/${reviewId}/replies`, {
          headers: session?.access_token ? {
            'Authorization': `Bearer ${session.access_token}`
          } : {}
        });
        
        if (response.ok) {
          const data = await response.json();
          // Update the review with replies
          setReviews(prev => prev.map(review => 
            review.id === reviewId 
              ? { ...review, replies: data.replies || [] }
              : review
          ));
        }
      } catch (err) {
        console.error('Error fetching replies:', err);
      }
    }
  };

  const handleSave = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: isFavorite ? "Restaurant removed from your favorites" : "Restaurant added to your favorites",
    });
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleMenuPhotos = () => {
    setShowMenuImages(!showMenuImages);
  };

  const formatPrice = (price: number) => {
    return `₹${price}`;
  };

  const getImageUrl = (images: any) => {
    if (!images) return restaurantImage;
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    if (typeof images === 'string') return images;
    return restaurantImage;
  };

  const groupFoodsByCategory = (foods: any[]) => {
    if (!foods || foods.length === 0) return [];
    
    const grouped = foods.reduce((acc, food) => {
      const category = food.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(food);
      return acc;
    }, {} as Record<string, any[]>);

    return (Object.entries(grouped) as [string, any[]][]).map(([category, items]) => ({
      category,
      items: items.map((item: any) => ({
        name: item.name,
        description: item.description || '',
        price: formatPrice(item.price)
      }))
    }));
  };

  const formatReviewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
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

  // Mock similar restaurants (keeping this as is since it's not in scope)
  const similarRestaurants = [
    {
      id: "2",
      name: "Mountain View Cafe",
      category: "Continental",
      rating: 4.3,
      reviewCount: 89,
      priceRange: "$$",
      image: restaurantImage,
      restaurant: {
        name: "Mountain View Cafe",
        rating: 4.3
      }
    },
    {
      id: "3", 
      name: "Spice Garden",
      category: "Indian",
      rating: 4.6,
      reviewCount: 156,
      priceRange: "$$$",
      image: restaurantImage,
      restaurant: {
        name: "Spice Garden",
        rating: 4.6
      }
    }
  ];

  const shareItem = restaurant ? {
    type: 'restaurant' as const,
    id: restaurant.id,
    name: restaurant.name,
    title: restaurant.name,
    description: restaurant.description || '',
    image: getImageUrl(restaurant.images)
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading restaurant details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Restaurant not found'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const restaurantImages = restaurant.cover_images && Array.isArray(restaurant.cover_images) && restaurant.cover_images.length > 0
    ? restaurant.cover_images 
    : restaurant.images && Array.isArray(restaurant.images) && restaurant.images.length > 0
    ? restaurant.images
    : [restaurantImage];

  const menu = groupFoodsByCategory(restaurant.foods || []);

  // Parse amenities if it's a string (fallback since amenities doesn't exist in DB)
  const amenities: string[] = restaurant.features && typeof restaurant.features === 'object' 
    ? Object.values(restaurant.features).filter(Boolean) as string[]
    : [];

  // Parse specialties if it's a string (fallback since specialties doesn't exist in DB)
  const specialties = restaurant.tags && Array.isArray(restaurant.tags)
    ? restaurant.tags
    : [];

  // Parse menu images if it's a string
  const menuImages = typeof restaurant.menu_images === 'string'
    ? JSON.parse(restaurant.menu_images)
    : restaurant.menu_images || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Image Gallery */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 rounded-xl overflow-hidden">
            <div className="lg:col-span-2">
              <img
                src={restaurantImages[0]}
                alt={restaurant.name}
                className="w-full h-64 lg:h-96 object-cover"
              />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {restaurantImages.slice(1).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${restaurant.name} ${index + 2}`}
                  className="w-full h-32 lg:h-[11.5rem] object-cover rounded-lg"
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Restaurant Header */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{restaurant.name}</h1>
                    <p className="text-lg text-muted-foreground mb-2">{restaurant.cuisine}</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 fill-nepali-gold text-nepali-gold" />
                        <span className="font-semibold">{restaurant.rating}</span>
                        <span className="text-muted-foreground">({restaurant.review_count || 0} reviews)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{restaurant.price_range}</span>
                      </div>
                      <Badge variant={restaurant.is_open ? "default" : "secondary"}>
                        {restaurant.is_open ? "Open" : "Closed"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant={isFavorite ? "default" : "outline"}
                      size="icon"
                      onClick={handleSave}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">{restaurant.description}</p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {amenities.map((amenity: string, index: number) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      {amenity === "WiFi" && <Wifi className="w-3 h-3" />}
                      {amenity === "Parking" && <Car className="w-3 h-3" />}
                      {amenity === "Card Payment" && <CreditCard className="w-3 h-3" />}
                      {amenity === "Family Friendly" && <Users className="w-3 h-3" />}
                      <span>{amenity}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Info Section */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Restaurant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <span>{restaurant.phone}</span>
                      </div>
                      {restaurant.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-primary" />
                          <span>{restaurant.website}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{restaurant.address}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Opening Hours</h4>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>
                        {restaurant.opening_hours && typeof restaurant.opening_hours === 'object' 
                          ? Object.entries(restaurant.opening_hours).map(([day, hours]) => {
                              // Handle case where hours might be an object with open/close times
                              let hoursText = '';
                              if (typeof hours === 'object' && hours !== null) {
                                if ('open' in hours && 'close' in hours) {
                                  hoursText = `${hours.open} - ${hours.close}`;
                                } else if ('start' in hours && 'end' in hours) {
                                  hoursText = `${hours.start} - ${hours.end}`;
                                } else {
                                  hoursText = 'Check with restaurant';
                                }
                              } else {
                                hoursText = String(hours);
                              }
                              return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hoursText}`;
                            }).join(', ')
                          : restaurant.opening_hours || 'Hours not available'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((specialty: string, index: number) => (
                      <Badge key={index} variant="outline">{specialty}</Badge>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Menu Section */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Menu</h3>
                  {menuImages.length > 0 && (
                    <Button
                      variant={showMenuImages ? "default" : "outline"}
                      size="sm"
                      onClick={handleMenuPhotos}
                      className="flex items-center space-x-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>{showMenuImages ? "Hide Menu Photos" : "Menu Photos"}</span>
                    </Button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                  {showMenuImages && menuImages.length > 0 ? (
                    // Menu Images View
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold mb-3">Menu Gallery</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {menuImages.map((menuImage: string, index: number) => (
                          <div key={index} className="relative">
                            <img
                              src={menuImage || restaurantImage}
                              alt={`Menu Page ${index + 1}`}
                              className="w-full h-auto max-h-96 object-contain rounded-lg border shadow-sm"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary">Page {index + 1}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Text Menu View
                    <div className="space-y-6">
                      {menu.length > 0 ? (
                        menu.map((category, categoryIndex) => (
                          <div key={categoryIndex}>
                            <h4 className="text-lg font-semibold mb-3">{category.category}</h4>
                            <div className="space-y-3">
                              {category.items.map((item: any, itemIndex: number) => (
                                <div key={itemIndex} className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                                  <h5 className="font-semibold mb-1">{item.name}</h5>
                                  <p className="text-muted-foreground text-sm mb-2">{item.description}</p>
                                  <p className="text-lg font-bold text-primary">{item.price}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-8">No menu items available</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Reviews Section */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Comments & Reviews</h3>
                  <Button 
                    variant="hero" 
                    onClick={() => {
                      if (!user) {
                        router.push('/login');
                        return;
                      }
                      setShowReviewForm(!showReviewForm);
                    }}
                  >
                    {showReviewForm ? 'Cancel' : 'Write a Review'}
                  </Button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <Card className="p-4 mb-6 bg-muted/50">
                    <h4 className="font-semibold mb-4">Write Your Review</h4>
                    <div className="space-y-4">
                      {/* Rating */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Rating</label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewFormData(prev => ({ ...prev, rating: star }))}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= reviewFormData.rating
                                    ? 'fill-nepali-gold text-nepali-gold'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Text */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Your Review</label>
                        <Textarea
                          placeholder="Share your experience at this restaurant..."
                          value={reviewFormData.review_text}
                          onChange={(e) => setReviewFormData(prev => ({ ...prev, review_text: e.target.value }))}
                          rows={4}
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleReviewSubmit}
                          disabled={submittingReview || !reviewFormData.review_text.trim()}
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowReviewForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviewsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading reviews...</p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-border pb-6 last:border-b-0">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold">
                            {review.user?.full_name?.[0] || review.user?.username?.[0] || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">
                                  {review.user?.full_name || review.user?.username || 'Anonymous User'}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < review.rating ? 'fill-nepali-gold text-nepali-gold' : 'text-muted-foreground'}`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {formatDate(review.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-muted-foreground mb-3">{review.review_text}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={`flex items-center space-x-1 ${review.user_liked ? 'text-blue-600 hover:text-blue-700' : 'text-muted-foreground hover:text-primary'}`}
                                onClick={() => handleLikeToggle(review.id)}
                              >
                                <ThumbsUp className={`w-3 h-3 ${review.user_liked ? 'fill-blue-600' : ''}`} />
                                <span>Helpful ({review.likes_count || 0})</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="flex items-center space-x-1 text-xs"
                                onClick={() => toggleReplyForm(review.id)}
                                disabled={!user}
                              >
                                <Reply className="w-3 h-3" />
                                <span>Reply</span>
                              </Button>
                              {review.comments_count > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => toggleExpandReplies(review.id)}
                                >
                                  {expandedReplies[review.id] ? 'Hide' : 'Show'} {review.comments_count} replies
                                </Button>
                              )}
                            </div>

                            {/* Reply Form */}
                            {replyForms[review.id] && (
                              <div className="mt-4 ml-4">
                                <div className="flex space-x-2">
                                  <Input
                                    placeholder="Write a reply..."
                                    value={replyTexts[review.id] || ''}
                                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [review.id]: e.target.value }))}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleReplySubmit(review.id);
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleReplySubmit(review.id)}
                                    disabled={submittingReplies[review.id] || !replyTexts[review.id]?.trim()}
                                  >
                                    {submittingReplies[review.id] ? 'Sending...' : 'Reply'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleReplyForm(review.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Replies */}
                            {expandedReplies[review.id] && review.replies && review.replies.length > 0 && (
                              <div className="mt-4 ml-4 space-y-3">
                                {review.replies.map((reply: ReviewReplyWithDetails) => (
                                  <div key={reply.id} className="flex items-start space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-white text-sm font-semibold">
                                      {reply.user?.full_name?.[0] || reply.user?.username?.[0] || 'U'}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h5 className="font-medium text-sm">
                                          {reply.user?.full_name || reply.user?.username || 'Anonymous User'}
                                        </h5>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDate(reply.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">{reply.reply_text}</p>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className={`flex items-center space-x-1 text-xs ${reply.user_liked ? 'text-blue-600 hover:text-blue-700' : 'text-muted-foreground hover:text-primary'}`}
                                        onClick={() => handleLikeToggle(reply.id, true)}
                                      >
                                        <ThumbsUp className={`w-3 h-3 ${reply.user_liked ? 'fill-blue-600' : ''}`} />
                                        <span>Helpful ({reply.likes_count || 0})</span>
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="hero" className="w-full">
                    <a href={`https://maps.google.com/?q=${restaurant.address}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Get Directions</span>
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Phone className="w-4 h-4" />
                    Call Restaurant
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Share
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Similar Restaurants</h3>
                <div className="flex overflow-x-auto space-x-4 pb-2">
                  {similarRestaurants.map((similar) => (
                    <div 
                      key={similar.id} 
                      className="flex-shrink-0 w-48 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push(`/restaurant/${similar.id}`)}
                    >
                      <Card className="overflow-hidden">
                        <div className="relative">
                          <img
                            src={similar.image}
                            alt={similar.name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="text-xs">
                              {similar.priceRange}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <h4 className="font-medium text-sm mb-1 truncate">{similar.name}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{similar.category}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 fill-nepali-gold text-nepali-gold" />
                              <span className="text-xs font-medium">{similar.rating}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatReviewCount(similar.reviewCount)} reviews
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        item={shareItem}
      />
    </div>
  );
};

export default RestaurantDetail;