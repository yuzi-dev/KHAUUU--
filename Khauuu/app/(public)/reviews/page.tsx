"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Star, 
  ThumbsUp, 
  MessageCircle, 
  Filter,
  Search,
  Plus,
  Calendar,
  TrendingUp,
  Heart,
  X
} from "lucide-react";
import { reviewService, ReviewWithDetails, CreateReviewData, ReviewReplyWithDetails, CreateReplyData } from "@/lib/services/reviews";
import { restaurantService, Restaurant } from "@/lib/services/restaurants";

const dalBhatImage = "/assets/dal-bhat.jpg";
const momosImage = "/assets/momos.jpg";
const restaurantImage = "/assets/restaurant-interior.jpg";

const Reviews = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showWriteReview, setShowWriteReview] = useState(false);
  
  // Real data states
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Review form states
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [restaurantSearch, setRestaurantSearch] = useState("");
  
  // Reply states
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyForms, setReplyForms] = useState<Record<string, boolean>>({});
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submittingReplies, setSubmittingReplies] = useState<Record<string, boolean>>({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const { user, session } = useAuth();
  const { toast } = useToast();

  // Fetch reviews
  const fetchReviews = async (page = 1, reset = false) => {
    try {
      setLoading(true);
      const data = await reviewService.getReviews({
        limit: 10,
        offset: (page - 1) * 10
      });
      
      if (reset) {
        setReviews(data);
      } else {
        setReviews(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === 10);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch restaurants for selection
  const fetchRestaurants = async () => {
    try {
      const data = await restaurantService.getAll(100);
      setRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  // Handle review submission
  const handleReviewSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to write a review",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRestaurant || !reviewText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a restaurant and write a review",
        variant: "destructive",
      });
      return;
    }

    if (!session?.access_token) {
      toast({
        title: "Authentication Error",
        description: "Please log in again",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingReview(true);
      const reviewData: CreateReviewData = {
        restaurant_id: selectedRestaurant,
        rating: reviewRating,
        review_text: reviewText.trim(),
        is_public: true
      };

      await reviewService.create(reviewData, session.access_token);
      
      toast({
        title: "Success",
        description: "Review submitted successfully!",
      });

      // Reset form and refresh reviews
      setSelectedRestaurant("");
      setReviewRating(5);
      setReviewText("");
      setRestaurantSearch("");
      setShowWriteReview(false);
      await fetchReviews(1, true);
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

  // Handle reply submission
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

      // Reset reply form and refresh replies
      setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
      setReplyForms(prev => ({ ...prev, [reviewId]: false }));
      await toggleExpandReplies(reviewId, true);
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

  // Toggle reply form
  const toggleReplyForm = (reviewId: string) => {
    setReplyForms(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  // Toggle expand replies
  const toggleExpandReplies = async (reviewId: string, forceRefresh = false) => {
    const isExpanded = expandedReplies[reviewId];
    setExpandedReplies(prev => ({ ...prev, [reviewId]: !isExpanded }));
    
    // If expanding and we don't have replies loaded, or forcing refresh, fetch them
    if (!isExpanded || forceRefresh) {
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

  // Handle like toggle
  const handleLikeToggle = async (reviewId: string) => {
    if (!user || !session?.access_token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to like reviews",
        variant: "destructive",
      });
      return;
    }

    try {
      await reviewService.toggleLike({ review_id: reviewId }, session.access_token);
      // Refresh reviews to update like counts
      await fetchReviews(1, true);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  // Format date
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

  // Filter restaurants based on search
  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(restaurantSearch.toLowerCase())
  );

  useEffect(() => {
    fetchReviews(1, true);
    fetchRestaurants();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReviews(1, true);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedFilter]);

  const trendingRestaurants = [
    { name: "Himalayan Delights", reviewCount: 245, avgRating: 4.8 },
    { name: "Momo Palace", reviewCount: 189, avgRating: 4.6 },
    { name: "Heritage Kitchen", reviewCount: 312, avgRating: 4.9 },
    { name: "Yak & Yeti", reviewCount: 456, avgRating: 4.7 }
  ];

  const filters = ["all", "5-star", "4-star", "recent", "helpful"];

  // Filter reviews based on search and selected filter
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.restaurant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (selectedFilter) {
      case "5-star":
        return matchesSearch && review.rating === 5;
      case "4-star":
        return matchesSearch && review.rating === 4;
      case "recent":
        // Reviews from last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return matchesSearch && new Date(review.created_at) > weekAgo;
      case "helpful":
        return matchesSearch && (review.likes_count || 0) >= 5;
      default:
        return matchesSearch;
    }
  });



  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Restaurant Reviews</h1>
            <p className="text-muted-foreground">Discover honest reviews from fellow food enthusiasts</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search and Filters */}
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      placeholder="Search reviews by restaurant or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    variant="hero"
                    onClick={() => setShowWriteReview(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Write Review
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filters.map(filter => (
                    <Badge
                      key={filter}
                      variant={selectedFilter === filter ? "default" : "secondary"}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => setSelectedFilter(filter)}
                    >
                      <Filter className="w-3 h-3 mr-1" />
                      {filter === "all" ? "All Reviews" : 
                       filter === "5-star" ? "5 Star" :
                       filter === "4-star" ? "4 Star" :
                       filter === "recent" ? "Recent" : "Most Helpful"}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Write Review Modal */}
              {showWriteReview && (
                <Card className="p-6 border-primary/20 bg-gradient-card">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center justify-between">
                      Write a Review
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowWriteReview(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Restaurant</label>
                        <div className="space-y-2">
                          <Input 
                            placeholder="Search for a restaurant..." 
                            value={restaurantSearch}
                            onChange={(e) => setRestaurantSearch(e.target.value)}
                          />
                          {restaurantSearch && (
                            <div className="max-h-40 overflow-y-auto border border-border rounded-md">
                              {filteredRestaurants.map((restaurant) => (
                                <div
                                  key={restaurant.id}
                                  className="p-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                                  onClick={() => {
                                    setSelectedRestaurant(restaurant.id);
                                    setRestaurantSearch(restaurant.name);
                                  }}
                                >
                                  <div className="font-medium">{restaurant.name}</div>
                                  <div className="text-sm text-muted-foreground">{restaurant.cuisine}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Rating</label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="focus:outline-none"
                            >
                              <Star 
                                className={`w-6 h-6 ${
                                  star <= reviewRating 
                                    ? 'fill-nepali-gold text-nepali-gold' 
                                    : 'text-muted-foreground hover:text-nepali-gold'
                                }`} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Your Review</label>
                        <Textarea 
                          placeholder="Share your experience..."
                          rows={4}
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="hero" 
                          onClick={handleReviewSubmit}
                          disabled={submittingReview || !selectedRestaurant || !reviewText.trim()}
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowWriteReview(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">
                    {filteredReviews.length} Reviews Found
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <Button variant="outline" size="sm">Most Recent</Button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading reviews...</p>
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm || selectedFilter !== 'all' ? 'No matching reviews found' : 'No reviews found'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || selectedFilter !== 'all' 
                        ? 'Try adjusting your search or filters' 
                        : 'Be the first to share your dining experience!'
                      }
                    </p>
                    {!searchTerm && selectedFilter === 'all' && (
                      <Button variant="hero" onClick={() => setShowWriteReview(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Write First Review
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {filteredReviews.map((review) => (
                      <Card key={review.id} className="hover:shadow-card transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            {/* Restaurant/Food Image */}
                            <img
                              src={
                                review.food?.images?.[0] || 
                                review.restaurant?.cover_images?.[0] || 
                                (review.food ? dalBhatImage : restaurantImage)
                              }
                              alt={review.food?.name || review.restaurant?.name || 'Review'}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            
                            <div className="flex-1">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="font-semibold text-lg text-primary hover:underline cursor-pointer">
                                      {review.food ? review.food.name : review.restaurant?.name || 'Unknown'}
                                    </h3>
                                    <Badge variant={review.food ? "secondary" : "default"} className="text-xs">
                                      {review.food ? "Food" : "Restaurant"}
                                    </Badge>
                                  </div>
                                  {review.food && (
                                    <p className="text-sm text-muted-foreground mb-1">
                                      at {review.restaurant?.name || 'Unknown Restaurant'}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-2 mb-1">
                                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                                      {review.user?.full_name?.[0] || review.user?.username?.[0] || 'U'}
                                    </div>
                                    <span className="font-medium">
                                      {review.user?.full_name || review.user?.username || 'Anonymous User'}
                                    </span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-muted-foreground text-sm">
                                      {formatDate(review.created_at)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < review.rating ? 'fill-nepali-gold text-nepali-gold' : 'text-muted-foreground'}`}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Review Content */}
                              <p className="text-muted-foreground mb-3 leading-relaxed">{review.review_text}</p>

                              {/* Actions */}
                              <div className="flex items-center space-x-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleLikeToggle(review.id)}
                                  className={`${review.user_liked ? 'text-red-600 hover:text-red-700' : 'text-muted-foreground hover:text-primary'}`}
                                >
                                  <Heart className={`w-4 h-4 mr-1 ${review.user_liked ? 'fill-red-500 text-red-500' : ''}`} />
                                  {review.likes_count || 0}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpandReplies(review.id)}
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  {review.comments_count || 0}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleReplyForm(review.id)}
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  Reply
                                </Button>
                              </div>

                              {/* Reply Form */}
                              {replyForms[review.id] && (
                                <div className="mt-4 ml-4">
                                  <div className="flex space-x-2">
                                    <Input
                                      placeholder="Write a reply..."
                                      value={replyTexts[review.id] || ''}
                                      onChange={(e) => setReplyTexts(prev => ({ ...prev, [review.id]: e.target.value }))}
                                      className="flex-1"
                                    />
                                    <Button
                                      onClick={() => handleReplySubmit(review.id)}
                                      disabled={submittingReplies[review.id] || !replyTexts[review.id]?.trim()}
                                      size="sm"
                                    >
                                      {submittingReplies[review.id] ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                      ) : (
                                        'Post'
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleReplyForm(review.id)}
                                    >
                                      Cancel
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
                                        <p className="text-sm text-muted-foreground">{reply.reply_text}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="text-center">
                        <Button
                          variant="outline"
                          onClick={() => fetchReviews(currentPage + 1, false)}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Load More Reviews
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                  Trending Restaurants
                </h3>
                <div className="space-y-3">
                  {trendingRestaurants.map((restaurant, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <div>
                        <h4 className="font-medium">{restaurant.name}</h4>
                        <p className="text-sm text-muted-foreground">{restaurant.reviewCount} reviews</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-nepali-gold text-nepali-gold" />
                        <span className="text-sm font-medium">{restaurant.avgRating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-primary" />
                  Review Guidelines
                </h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>• Be honest and helpful in your reviews</p>
                  <p>• Include details about food, service, and ambiance</p>
                  <p>• Add photos to make your review more valuable</p>
                  <p>• Be respectful to restaurants and other reviewers</p>
                  <p>• Update your review if your experience changes</p>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-card border-primary/20">
                <h3 className="font-semibold text-lg mb-2">Share Your Experience</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Help others discover great food by sharing your honest reviews
                </p>
                <Button variant="hero" className="w-full">
                  <Plus className="w-4 h-4 mr-1" />
                  Write Your First Review
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Reviews;