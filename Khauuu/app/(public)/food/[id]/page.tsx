"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ShareModal from "@/components/modals/share-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Star, 
  MapPin, 
  Clock, 
  Heart, 
  Send,
  DollarSign,
  MessageCircle,
  Reply,
  ThumbsUp
} from "lucide-react";
import { foodService, type FoodWithRestaurant } from "@/lib/services";
import { reviewService, type ReviewWithDetails, type ReviewReplyWithDetails } from "@/lib/services/reviews";

const dalBhatImage = "/assets/dal-bhat.jpg";
const momosImage = "/assets/momos.jpg";
const restaurantImage = "/assets/restaurant-interior.jpg";

const FoodDetail = () => {
  const params = useParams();
  const router = useRouter();
  const { user, session } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [food, setFood] = useState<FoodWithRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [reviewReplies, setReviewReplies] = useState<Record<string, ReviewReplyWithDetails[]>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchFood = async () => {
      if (!params?.id || typeof params.id !== 'string') {
        setError('Invalid food ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await foodService.getById(params.id);
        
        if (!data) {
          setError('Food not found');
        } else {
          setFood(data);
        }
      } catch (err) {
        console.error('Error fetching food:', err);
        setError('Failed to load food data');
      } finally {
        setLoading(false);
      }
    };

    fetchFood();
  }, [params?.id]);

  const formatReviewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleSave = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: isFavorite 
        ? "Food removed from your favorites" 
        : "Food saved to your favorites",
    });
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  const handleRestaurantClick = () => {
    if (food?.restaurant?.id) {
      router.push(`/restaurant/${food.restaurant.id}`);
    }
  };

  const getImageUrl = (images: any) => {
    if (!images) return dalBhatImage;
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    if (typeof images === 'string') return images;
    return dalBhatImage;
  };

  const getFoodImages = (images: any) => {
    if (!images) return [dalBhatImage];
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') return [images];
    return [dalBhatImage];
  };

  useEffect(() => {
    const fetchReviews = async () => {
      if (!params?.id || typeof params.id !== 'string') return;

      try {
        setReviewsLoading(true);
        
        // Use the API endpoint to get reviews with user_liked information
        const response = await fetch(`/api/reviews?food_id=${params.id}&limit=20`, {
          headers: session?.access_token ? {
            'Authorization': `Bearer ${session.access_token}`
          } : {}
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        
        const data = await response.json();
        const reviewsData = data.reviews || [];
        setReviews(reviewsData);

        // Fetch replies for each review
        const repliesData: Record<string, ReviewReplyWithDetails[]> = {};
        for (const review of reviewsData) {
          const replies = await reviewService.getReplies(review.id);
          repliesData[review.id] = replies;
        }
        setReviewReplies(repliesData);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    if (food) {
      fetchReviews();
    }
  }, [food, params?.id]);

  const handleWriteReview = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to write a review",
        variant: "destructive"
      });
      return;
    }
    setShowReviewForm(true);
  };

  const handleSubmitReview = async () => {
    if (!user || !food || rating === 0 || !reviewText.trim()) {
      toast({
        title: "Invalid input",
        description: "Please provide a rating and review text",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmittingReview(true);
      if (!session?.access_token) throw new Error('No authentication token');

      await reviewService.create({
        restaurant_id: food.restaurant_id,
        food_id: food.id,
        rating,
        review_text: reviewText.trim(),
        is_public: true
      }, session.access_token);

      toast({
        title: "Review submitted",
        description: "Your review has been posted successfully"
      });

      // Reset form
      setShowReviewForm(false);
      setReviewText('');
      setRating(0);

      // Refresh reviews
      const reviewsData = await reviewService.getReviews({
        food_id: food.id,
        limit: 20
      });
      setReviews(reviewsData);

      // Refresh food data to get updated rating
      const updatedFood = await foodService.getById(food.id);
      if (updatedFood) {
        setFood(updatedFood);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to reply",
        variant: "destructive"
      });
      return;
    }

    if (!replyText.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a reply",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmittingReply(true);
      if (!session?.access_token) throw new Error('No authentication token');

      await reviewService.createReply({
        review_id: reviewId,
        reply_text: replyText.trim(),
        is_public: true
      }, session.access_token);

      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully"
      });

      // Reset form
      setReplyingTo(null);
      setReplyText('');

      // Refresh replies for this review
      const replies = await reviewService.getReplies(reviewId);
      setReviewReplies(prev => ({
        ...prev,
        [reviewId]: replies
      }));
    } catch (err) {
      console.error('Error submitting reply:', err);
      toast({
        title: "Error",
        description: "Failed to submit reply. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleLike = async (reviewId?: string, replyId?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like",
        variant: "destructive"
      });
      return;
    }

    try {
      if (!session?.access_token) throw new Error('No authentication token');

      // Properly distinguish between review likes and reply likes
      const params = replyId ? { reply_id: replyId } : { review_id: reviewId };
      await reviewService.toggleLike(params, session.access_token);

      // Refresh reviews to get updated like counts
      const response = await fetch(`/api/reviews?food_id=${food?.id}&limit=20`, {
        headers: session?.access_token ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {}
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      const reviewsData = data.reviews || [];
      setReviews(reviewsData);

      // Refresh replies if it was a reply like
      if (replyId && reviewId) {
        const response = await fetch(`/api/reviews/${reviewId}/replies`, {
          headers: session?.access_token ? {
            'Authorization': `Bearer ${session.access_token}`
          } : {}
        });
        
        if (response.ok) {
          const data = await response.json();
          setReviewReplies(prev => ({
            ...prev,
            [reviewId]: data.replies || []
          }));
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
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

  const renderReply = (reply: ReviewReplyWithDetails, reviewId: string) => (
    <div key={reply.id} className="flex items-start space-x-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-white text-sm font-semibold">
        {reply.user?.full_name?.[0] || reply.user?.username?.[0] || 'U'}
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <h5 className="font-medium text-sm">
            {reply.user?.full_name || reply.user?.username || 'Anonymous'}
          </h5>
          {reply.user?.is_verified && (
            <Badge variant="secondary" className="text-xs">Verified</Badge>
          )}
          <span className="text-xs text-muted-foreground">{formatDate(reply.created_at)}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{reply.reply_text}</p>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center space-x-1 text-xs ${reply.user_liked ? 'text-blue-600' : ''}`}
            onClick={() => handleLike(reviewId, reply.id)}
          >
            <ThumbsUp className={`w-3 h-3 ${reply.user_liked ? 'fill-blue-600' : ''}`} />
            <span>Helpful ({reply.likes_count})</span>
          </Button>
        </div>
        
        {/* Nested replies */}
        {reply.replies && reply.replies.length > 0 && (
          <div className="mt-3 ml-4 space-y-3">
            {reply.replies.map(nestedReply => renderReply(nestedReply, reviewId))}
          </div>
        )}
      </div>
    </div>
  );

  // Mock comments data (keeping this as is since comments are not in scope)
  const comments = [
    {
      id: "1",
      userName: "Priya Sharma",
      avatar: "/assets/avatar1.jpg",
      rating: 5,
      date: "3 days ago",
      comment: "Absolutely delicious! The authentic taste reminds me of my grandmother's cooking. Perfect balance of spices and very filling.",
      likes: 18,
      replies: [
        {
          id: "1-1",
          userName: "Raj Patel",
          avatar: "/assets/avatar2.jpg",
          date: "2 days ago",
          comment: "I totally agree! This place serves the most authentic Dal Bhat in the city.",
          likes: 7
        }
      ]
    },
    {
      id: "2",
      userName: "Michael Johnson",
      avatar: "/assets/avatar2.jpg",
      rating: 4,
      date: "1 week ago",
      comment: "Great traditional meal! Very nutritious and the portion size is generous. The lentil soup was particularly good.",
      likes: 12,
      replies: []
    },
    {
      id: "3",
      userName: "Sita Gurung",
      avatar: "/assets/avatar3.jpg",
      rating: 5,
      date: "2 weeks ago",
      comment: "Best Dal Bhat I've had outside of Nepal! The pickles and vegetables were fresh and flavorful.",
      likes: 25,
      replies: []
    }
  ];

  const shareItem = food ? {
    id: food.id,
    type: 'food' as const,
    name: food.name,
    image: getImageUrl(food.images),
    description: food.description || '',
    rating: food.rating,
    price: `₹${food.price}`,
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading food details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Food not found'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const foodImages = getFoodImages(food.images);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Food Images */}
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden">
                <img
                  src={foodImages[0]}
                  alt={food.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {foodImages.length > 1 && (
                <div className="grid grid-cols-3 gap-4">
                  {foodImages.slice(1, 4).map((image, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`${food.name} ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Food Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{food.name}</h1>
                    <p className="text-lg text-muted-foreground mb-2">{food.category}</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 fill-nepali-gold text-nepali-gold" />
                        <span className="font-semibold">{food.rating}</span>
                        <span className="text-muted-foreground">({formatReviewCount(food.review_count || 0)} reviews)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-lg">₹{food.price}</span>
                      </div>
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

                <p className="text-muted-foreground mb-6">{food.description}</p>

                {/* Food Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="font-semibold mb-2">Category</h4>
                    <Badge variant="secondary">{food.category}</Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Price</h4>
                    <span className="text-lg font-bold text-primary">₹{food.price}</span>
                  </div>
                </div>
              </div>

              {/* Restaurant Info */}
              {food.restaurant && (
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Available at</h3>
                  <div 
                    className="flex items-center space-x-4 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
                    onClick={handleRestaurantClick}
                  >
                    <img
                      src={food.restaurant.cover_images?.[0] || food.restaurant.images?.[0] || restaurantImage}
                      alt={food.restaurant.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{food.restaurant.name}</h4>
                      <p className="text-sm text-muted-foreground">{food.restaurant.cuisine}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-nepali-gold text-nepali-gold" />
                          <span className="text-sm font-medium">{food.restaurant.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{food.restaurant.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>
                          {food.restaurant.opening_hours && typeof food.restaurant.opening_hours === 'object'
                            ? Object.entries(food.restaurant.opening_hours).map(([day, hours]) => {
                                const formattedHours = typeof hours === 'object' && hours !== null
                                  ? (hours as any).open && (hours as any).close
                                    ? `${(hours as any).open} - ${(hours as any).close}`
                                    : (hours as any).start && (hours as any).end
                                    ? `${(hours as any).start} - ${(hours as any).end}`
                                    : 'Check with restaurant'
                                  : typeof hours === 'string'
                                  ? hours
                                  : 'Hours not available';
                                return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${formattedHours}`;
                              }).join(', ')
                            : food.restaurant.opening_hours || 'Hours not available'
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span>{food.restaurant.price_range}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reviews">Reviews & Comments</TabsTrigger>
              <TabsTrigger value="details">Food Details</TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Reviews & Comments</h3>
                  <Button variant="hero" onClick={handleWriteReview}>
                    Write a Review
                  </Button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <div className="mb-6 p-4 border border-border rounded-lg bg-muted/20">
                    <h4 className="font-semibold mb-4">Write your review</h4>
                    
                    {/* Rating */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Rating</label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= rating 
                                  ? 'fill-nepali-gold text-nepali-gold' 
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review Text */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Your Review</label>
                      <Textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your experience with this food..."
                        rows={4}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleSubmitReview}
                        disabled={submittingReview || rating === 0 || !reviewText.trim()}
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewText('');
                          setRating(0);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-border pb-6 last:border-b-0">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold">
                            {review.user?.full_name?.[0] || review.user?.username?.[0] || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold">
                                    {review.user?.full_name || review.user?.username || 'Anonymous'}
                                  </h4>
                                  {review.user?.is_verified && (
                                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < review.rating ? 'fill-nepali-gold text-nepali-gold' : 'text-muted-foreground'}`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground">{formatDate(review.created_at)}</span>
                                </div>
                              </div>
                            </div>
                            {review.review_text && (
                              <p className="text-muted-foreground mb-3">{review.review_text}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={`flex items-center space-x-1 ${review.user_liked ? 'text-blue-600' : ''}`}
                                onClick={() => handleLike(review.id)}
                              >
                                <ThumbsUp className={`w-3 h-3 ${review.user_liked ? 'fill-blue-600' : ''}`} />
                                <span>Helpful ({review.likes_count})</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="flex items-center space-x-1"
                                onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                              >
                                <Reply className="w-3 h-3" />
                                <span>Reply</span>
                              </Button>
                            </div>

                            {/* Reply Form */}
                            {replyingTo === review.id && (
                              <div className="mt-4 p-3 border border-border rounded-lg bg-muted/10">
                                <Textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Write your reply..."
                                  rows={3}
                                  className="mb-3"
                                />
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => handleReply(review.id)}
                                    disabled={submittingReply || !replyText.trim()}
                                  >
                                    {submittingReply ? 'Posting...' : 'Post Reply'}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Replies */}
                            {reviewReplies[review.id] && reviewReplies[review.id].length > 0 && (
                              <div className="mt-4 ml-4 space-y-3">
                                {reviewReplies[review.id].map((reply) => renderReply(reply, review.id))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Food Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Basic Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{food.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{food.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-semibold">₹{food.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rating:</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-nepali-gold text-nepali-gold" />
                          <span>{food.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Availability</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available:</span>
                        <Badge variant={food.is_available ? "default" : "secondary"}>
                          {food.is_available ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {food.restaurant && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Restaurant:</span>
                            <span>{food.restaurant.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Location:</span>
                            <span>{food.restaurant.address}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{food.description}</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      
      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        item={shareItem}
      />
    </div>
  );
};

export default FoodDetail;