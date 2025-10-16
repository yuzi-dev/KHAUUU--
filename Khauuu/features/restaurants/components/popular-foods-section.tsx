"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, Heart, TrendingUp, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import ShareModal from "@/components/modals/share-modal";
import { useToast } from "@/hooks/use-toast";
import { foodService } from "@/lib/services";

const PopularFoodsSection = () => {
  const router = useRouter();
  const [savedFoods, setSavedFoods] = useState<string[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [popularFoods, setPopularFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPopularFoods = async () => {
      try {
        setLoading(true);
        const foods = await foodService.getPopular();
        
        // Only show foods from database if they exist and are featured
        if (foods && foods.length > 0) {
          setPopularFoods(foods);
        } else {
          // No featured foods found, show empty state or message
          setPopularFoods([]);
          toast({
            title: "No Featured Foods",
            description: "No featured foods available at the moment",
          });
        }
      } catch (error) {
        console.error('Error fetching popular foods:', error);
        // Show empty state on error
        setPopularFoods([]);
        toast({
          title: "Error Loading Foods",
          description: "Unable to load featured foods at the moment",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPopularFoods();
  }, [toast]);

  // Helper function to format review count
  const formatReviewCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'm';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  const handleFoodClick = (foodId: string) => {
    // Navigate to a food detail page or restaurants serving this food
    router.push(`/food/${foodId}`);
  };

  const handleRestaurantClick = (restaurantId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    router.push(`/restaurant/${restaurantId}`);
  };

  const handleSave = (foodId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSavedFoods(prev => {
      const isAlreadySaved = prev.includes(foodId);
      const newSavedFoods = isAlreadySaved 
        ? prev.filter(id => id !== foodId)
        : [...prev, foodId];
      
      toast({
        title: isAlreadySaved ? "Food Removed" : "Food Saved!",
        description: isAlreadySaved 
          ? "Food removed from your favorites" 
          : "Food saved to your favorites",
      });
      
      return newSavedFoods;
    });
  };

  const handleShare = (food: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedFood({
      id: food.id,
      type: 'food',
      name: food.name,
      image: food.image_url || food.images?.[0] || '/assets/placeholder-food.jpg',
      description: food.description,
      rating: food.rating,
      price: food.price_range,
    });
    setShareModalOpen(true);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-warm-cream to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Popular Nepali Foods</h2>
            <p className="text-lg text-muted-foreground">Discover the most loved dishes in Nepali cuisine</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-56 bg-gray-300 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-warm-cream to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Popular Nepali Foods</h2>
          <p className="text-lg text-muted-foreground">Discover the most loved dishes in Nepali cuisine</p>
        </div>

        {popularFoods.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Featured Foods Available</h3>
              <p className="text-muted-foreground mb-6">
                We're working on featuring the best dishes. Check back soon for amazing food recommendations!
              </p>
              <Button variant="hero" onClick={() => router.push('/restaurants')}>
                Browse Restaurants
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularFoods.map((food, index) => (
            <Card 
              key={food.id}
              className="group hover:shadow-warm transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-primary/10 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleFoodClick(food.id)}
            >
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={food.image_url || food.images?.[0] || '/assets/placeholder-food.jpg'}
                  alt={food.name}
                  className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-4 left-4">
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-background/90 text-foreground">
                    {food.category || 'Food'}
                  </Badge>
                </div>
                
                {/* Save Button */}
                <div className="absolute top-14 right-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`bg-background/80 hover:bg-background transition-colors ${savedFoods.includes(food.id) ? 'text-red-500' : 'text-gray-600'}`}
                    onClick={(e) => handleSave(food.id, e)}
                  >
                    <Heart className={`w-4 h-4 ${savedFoods.includes(food.id) ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                    {food.name}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-nepali-gold text-nepali-gold" />
                    <span className="font-semibold text-foreground">{food.rating || 4.5}</span>
                    <span className="text-muted-foreground text-sm">({formatReviewCount(food.review_count || 100)})</span>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 line-clamp-2">{food.description}</p>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="font-semibold text-primary">
                    {food.price ? `₹${food.price}` : food.price_range || 'Price not available'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {(food.tags || ['Popular', 'Nepali']).map((tag: string, tagIndex: number) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center space-x-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={(e) => handleRestaurantClick(food.restaurant?.id || '', e)}
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {food.restaurant?.name?.charAt(0) || 'R'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{food.restaurant?.name || 'Restaurant'}</p>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-nepali-gold text-nepali-gold" />
                        <span className="text-xs">{food.restaurant?.rating || 4.5}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-muted-foreground hover:text-primary"
                      onClick={(e) => handleShare(food, e)}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFoodClick(food.id);
                      }}
                    >
                      Explore
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="hero" size="lg">
                View All Featured Foods
              </Button>
            </div>
          </>
        )}
      </div>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        item={selectedFood}
      />
    </section>
  );
};

export default PopularFoodsSection;