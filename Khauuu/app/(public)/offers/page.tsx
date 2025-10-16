"use client";

import { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ShareModal from "@/components/modals/share-modal";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  MapPin, 
  Clock, 
  Percent,
  Gift,
  Tag,
  Calendar,
  Search,
  Filter,
  TrendingDown,
  Send,
  Heart,
  HeartHandshake
} from "lucide-react";

const dalBhatImage = "/assets/dal-bhat.jpg";
const momosImage = "/assets/momos.jpg";
const restaurantImage = "/assets/restaurant-interior.jpg";

const Offers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [savedOffers, setSavedOffers] = useState<string[]>([]);
  const { toast } = useToast();

  const offers = [
    {
      id: "1",
      title: "50% Off on Traditional Thali",
      restaurant: "Himalayan Delights",
      description: "Get 50% discount on our authentic dal bhat thali. Perfect for experiencing traditional Nepali flavors.",
      discount: "50%",
      originalPrice: "₹450",
      discountedPrice: "₹225",
      validUntil: "Dec 31, 2024",
      category: "food",
      image: dalBhatImage,
      rating: 4.8,
      distance: "0.8 km",
      isPopular: true,
      tags: ["Traditional", "Vegetarian", "Healthy"]
    },
    {
      id: "2",
      title: "Buy 2 Get 1 Free Momos",
      restaurant: "Momo Palace",
      description: "Order any 2 plates of momos and get 1 plate absolutely free. Valid on all varieties.",
      discount: "33%",
      originalPrice: "₹360",
      discountedPrice: "₹240",
      validUntil: "Dec 25, 2024",
      category: "food",
      image: momosImage,
      rating: 4.6,
      distance: "1.2 km",
      isPopular: false,
      tags: ["Momos", "Street Food", "Popular"]
    },
    {
      id: "3",
      title: "Happy Hour - 30% Off Drinks",
      restaurant: "Rooftop Lounge",
      description: "Enjoy 30% off on all beverages during happy hour (5 PM - 7 PM). Great city views included!",
      discount: "30%",
      originalPrice: "₹200",
      discountedPrice: "₹140",
      validUntil: "Dec 30, 2024",
      category: "drinks",
      image: restaurantImage,
      rating: 4.4,
      distance: "2.1 km",
      isPopular: false,
      tags: ["Drinks", "Happy Hour", "Rooftop"]
    },
    {
      id: "4",
      title: "Free Dessert with Main Course",
      restaurant: "Sweet Treats Cafe",
      description: "Order any main course and get a complimentary traditional Nepali dessert. Limited time offer!",
      discount: "Free",
      originalPrice: "₹150",
      discountedPrice: "Free",
      validUntil: "Jan 5, 2025",
      category: "dessert",
      image: dalBhatImage,
      rating: 4.7,
      distance: "0.5 km",
      isPopular: true,
      tags: ["Dessert", "Free", "Traditional"]
    }
  ];

  const categories = [
    { id: "all", name: "All Offers", icon: Gift },
    { id: "food", name: "Food", icon: Tag },
    { id: "drinks", name: "Drinks", icon: HeartHandshake },
    { id: "dessert", name: "Desserts", icon: Heart }
  ];

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.restaurant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || offer.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveOffer = (offerId: string) => {
    setSavedOffers(prev => {
      const newSaved = prev.includes(offerId) 
        ? prev.filter(id => id !== offerId)
        : [...prev, offerId];
      
      toast({
        title: prev.includes(offerId) ? "Offer removed" : "Offer saved",
        description: prev.includes(offerId) 
          ? "Offer removed from your saved list" 
          : "Offer added to your saved list",
      });
      
      return newSaved;
    });
  };

  const handleShareOffer = (offer: any) => {
    setSelectedOffer(offer);
    setShareModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-warm-cream to-muted">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
              Special Offers & Deals
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover amazing deals and save on your favorite restaurants
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search offers, restaurants, or cuisines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg bg-card/50 border-border/50 focus:border-primary"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className={selectedCategory === category.id 
                      ? "bg-gradient-hero text-white" 
                      : "border-border/50 hover:border-primary/50"
                    }
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Offers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className="group border-0 shadow-warm bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Discount Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-hero text-white font-bold text-lg px-3 py-1">
                      <Percent className="w-4 h-4 mr-1" />
                      {offer.discount} OFF
                    </Badge>
                  </div>

                  {/* Popular Badge */}
                  {offer.isPopular && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}

                  {/* Save Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 hover:text-red-500"
                    onClick={() => handleSaveOffer(offer.id)}
                  >
                    <Heart className={`w-5 h-5 ${savedOffers.includes(offer.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>

                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                      {offer.title}
                    </h3>
                    <p className="text-primary font-semibold mb-2">{offer.restaurant}</p>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {offer.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {offer.discountedPrice}
                    </span>
                    <span className="text-lg text-muted-foreground line-through">
                      {offer.originalPrice}
                    </span>
                  </div>

                  {/* Restaurant Info */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{offer.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{offer.distance}</span>
                    </div>
                  </div>

                  {/* Valid Until */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>Valid until {offer.validUntil}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {offer.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-gradient-hero hover:opacity-90 text-white">
                      <Gift className="w-4 h-4 mr-2" />
                      Claim Offer
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShareOffer(offer)}
                      className="border-border/50 hover:border-primary/50"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredOffers.length === 0 && (
            <div className="text-center py-12">
              <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No offers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse all categories
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        item={selectedOffer}
      />
    </div>
  );
};

export default Offers;