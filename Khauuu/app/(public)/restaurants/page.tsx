"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import RestaurantCard from "@/features/restaurants/components/restaurant-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin, Star, DollarSign } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getRestaurantCoordinates, calculateDistance, formatDistance } from "@/lib/utils/geolocation";

const momosImage = "/assets/momos.jpg";
const dalBhatImage = "/assets/dal-bhat.jpg";
const restaurantImage = "/assets/restaurant-interior.jpg";

const Restaurants = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [restaurantsWithDistance, setRestaurantsWithDistance] = useState<any[]>([]);
  const { coordinates: userLocation } = useGeolocation();

  const restaurants = [
    {
      id: "1",
      name: "Himalayan Delights",
      cuisine: "Traditional Nepali",
      rating: 4.8,
      reviewCount: 245,
      priceRange: "₹₹",
      image: dalBhatImage,
      isOpen: true,
      deliveryTime: "25-35 min",
      tags: ["Vegetarian Friendly", "Family Style", "Authentic"]
    },
    {
      id: "2",
      name: "Momo Palace",
      cuisine: "Tibetan • Nepali",
      rating: 4.6,
      reviewCount: 189,
      priceRange: "₹",
      image: momosImage,
      isOpen: true,
      deliveryTime: "15-25 min",
      tags: ["Quick Bite", "Street Food", "Popular"]
    },
    {
      id: "3",
      name: "Heritage Kitchen",
      cuisine: "Newari • Traditional",
      rating: 4.9,
      reviewCount: 312,
      priceRange: "₹₹₹",
      image: restaurantImage,
      isOpen: false,
      deliveryTime: "35-45 min",
      tags: ["Fine Dining", "Cultural", "Special Occasion"]
    },
    {
      id: "4",
      name: "Yak & Yeti",
      cuisine: "International • Nepali",
      rating: 4.7,
      reviewCount: 456,
      priceRange: "₹₹₹",
      image: restaurantImage,
      isOpen: true,
      deliveryTime: "30-40 min",
      tags: ["Luxury", "International", "Hotel Restaurant"]
    },
    {
      id: "5",
      name: "Thakali Kitchen",
      cuisine: "Thakali • Regional",
      rating: 4.5,
      reviewCount: 123,
      priceRange: "₹₹",
      image: dalBhatImage,
      isOpen: true,
      deliveryTime: "20-30 min",
      tags: ["Regional Specialty", "Healthy", "Traditional"]
    },
    {
      id: "6",
      name: "Newari Ghar",
      cuisine: "Newari • Cultural",
      rating: 4.4,
      reviewCount: 89,
      priceRange: "₹₹",
      image: restaurantImage,
      isOpen: true,
      deliveryTime: "25-35 min",
      tags: ["Cultural Experience", "Traditional", "Local Favorite"]
    }
  ];

  const filters = [
    "Vegetarian", "Quick Delivery", "Highly Rated", "Budget Friendly", 
    "Fine Dining", "Street Food", "Traditional", "Open Now"
  ];

  // Calculate distances and update restaurants when user location changes
  useEffect(() => {
    if (userLocation) {
      const updatedRestaurants = restaurants.map(restaurant => {
        const coords = getRestaurantCoordinates(restaurant.id);
        const distance = coords ? calculateDistance(userLocation, coords) : null;
        return {
          ...restaurant,
          distance: distance ? formatDistance(distance) : "Distance unavailable",
          distanceValue: distance || 999 // For sorting
        };
      }).sort((a, b) => a.distanceValue - b.distanceValue); // Sort by distance
      
      setRestaurantsWithDistance(updatedRestaurants);
    } else {
      // Fallback when no location available
      setRestaurantsWithDistance(restaurants.map(r => ({ ...r, distance: "Distance unavailable", distanceValue: 999 })));
    }
  }, [userLocation]);

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Discover Restaurants</h1>
            <p className="text-muted-foreground">Find the perfect place for your next meal</p>
          </div>

          {/* Search and Filters */}
          <div className="bg-card rounded-xl p-6 shadow-card mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search restaurants, dishes, or cuisine..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Location"
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.map(filter => (
                <Badge
                  key={filter}
                  variant={selectedFilters.includes(filter) ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => toggleFilter(filter)}
                >
                  {filter}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Filter className="w-4 h-4" />
                  <span>More Filters</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>Rating: 4.0+</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>All Price Ranges</span>
                </div>
              </div>
              <Button variant="outline">Advanced Filters</Button>
            </div>
          </div>

          {/* Results */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {restaurantsWithDistance.length} restaurants found
              </h2>
              <p className="text-muted-foreground">in Kathmandu {userLocation ? "• Sorted by distance" : ""}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Button variant="outline" size="sm">Relevance</Button>
            </div>
          </div>

          {/* Restaurant Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurantsWithDistance.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="hero" size="lg">
              Load More Restaurants
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Restaurants;