"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, 
  MapPin, 
  Clock, 
  Calendar, 
  Tag, 
  Percent,
  Send,
  Heart,
  Users,
  Gift
} from "lucide-react";

const restaurantImage = "/assets/restaurant-interior.jpg";
const dalBhatImage = "/assets/dal-bhat.jpg";

const OfferDetail = () => {
  const params = useParams();
  const id = params?.id;
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock offer data - in real app this would come from API
  const offer = {
    id: "1",
    title: "Festival Food Discovery Week",
    type: "Special Event",
    discount: "30% OFF",
    rating: 4.6,
    reviewCount: 89,
    description: "Join us for a week-long celebration of traditional Nepali festival foods. Discover authentic recipes and cooking techniques passed down through generations. Perfect opportunity to explore Nepal's rich culinary heritage.",
    images: [restaurantImage, dalBhatImage],
    validFrom: "March 15, 2024",
    validUntil: "March 22, 2024",
    location: "Multiple Restaurants in Thamel",
    maxParticipants: 200,
    currentParticipants: 156,
    originalPrice: "₹2,500",
    discountedPrice: "₹1,750",
    highlights: [
      "Guided food tours to 5 authentic restaurants",
      "Cooking demonstration sessions",
      "Traditional recipe booklet included",
      "Meet local chefs and food historians",
      "Certificate of participation"
    ],
    participating_restaurants: [
      { name: "Himalayan Delights", specialty: "Traditional Dal Bhat", rating: 4.8 },
      { name: "Newari Kitchen", specialty: "Festival Sweets", rating: 4.7 },
      { name: "Mountain Flavors", specialty: "Seasonal Dishes", rating: 4.6 },
      { name: "Heritage Cafe", specialty: "Traditional Beverages", rating: 4.5 }
    ],
    terms: [
      "Valid for one person per booking",
      "Advance booking required",
      "Non-refundable after 48 hours",
      "Valid ID required during participation",
      "Food allergies must be declared in advance"
    ],
    category: "Cultural Experience",
    organizer: "Nepal Food Heritage Society"
  };

  const reviews = [
    {
      id: "1",
      userName: "Maya Gurung",
      rating: 5,
      date: "1 week ago",
      comment: "Amazing cultural experience! Learned so much about traditional Nepali cuisine. The cooking demonstrations were fantastic and the food was incredible.",
      helpfulCount: 24,
      verified: true
    },
    {
      id: "2", 
      userName: "David Chen",
      rating: 4,
      date: "2 weeks ago",
      comment: "Great way to explore authentic food culture. Well organized and informative. Only wish it was longer! The recipe booklet is a nice touch.",
      helpfulCount: 18,
      verified: true
    },
    {
      id: "3",
      userName: "Sunita Thapa", 
      rating: 5,
      date: "3 weeks ago",
      comment: "Even as a local, I discovered new dishes and learned interesting stories about our food traditions. Highly recommend for food enthusiasts!",
      helpfulCount: 31,
      verified: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Image Gallery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 rounded-xl overflow-hidden">
            <div>
              <img
                src={offer.images[0]}
                alt={offer.title}
                className="w-full h-64 lg:h-96 object-cover rounded-lg"
              />
            </div>
            <div className="space-y-4">
              <img
                src={offer.images[1]}
                alt={`${offer.title} food`}
                className="w-full h-44 lg:h-44 object-cover rounded-lg"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Participants</p>
                  <p className="text-sm font-medium">{offer.currentParticipants}/{offer.maxParticipants}</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <Percent className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Discount</p>
                  <p className="text-sm font-medium">{offer.discount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Offer Header */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{offer.title}</h1>
                    <p className="text-lg text-muted-foreground mb-2">{offer.type}</p>
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 fill-nepali-gold text-nepali-gold" />
                        <span className="font-semibold">{offer.rating}</span>
                        <span className="text-muted-foreground">({offer.reviewCount} reviews)</span>
                      </div>
                      <Badge variant="secondary">
                        <Gift className="w-3 h-3 mr-1" />
                        {offer.category}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-primary">{offer.discountedPrice}</span>
                        <span className="text-lg text-muted-foreground line-through">{offer.originalPrice}</span>
                        <Badge variant="destructive">{offer.discount}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant={isFavorite ? "default" : "outline"}
                      size="icon"
                      onClick={() => setIsFavorite(!isFavorite)}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">{offer.description}</p>

                {/* Validity Period */}
                <div className="flex items-center space-x-6 p-4 bg-muted/20 rounded-lg mb-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valid From</p>
                      <p className="font-medium">{offer.validFrom}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valid Until</p>
                      <p className="font-medium">{offer.validUntil}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{offer.location}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Offer Details</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Gift className="w-4 h-4 mr-2 text-primary" />
                      What's Included
                    </h4>
                    <div className="space-y-2">
                      {offer.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Participating Restaurants</h4>
                    <div className="space-y-3">
                      {offer.participating_restaurants.map((restaurant, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <h5 className="font-medium">{restaurant.name}</h5>
                            <p className="text-sm text-muted-foreground">{restaurant.specialty}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-nepali-gold text-nepali-gold" />
                            <span className="text-sm font-medium">{restaurant.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-primary" />
                      Terms & Conditions
                    </h4>
                    <div className="space-y-2">
                      {offer.terms.map((term, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-muted-foreground">{term}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Participant Reviews</h3>
                    <Button variant="hero">Write a Review</Button>
                  </div>
                  
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{review.userName}</h4>
                              {review.verified && (
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
                              <span className="text-sm text-muted-foreground">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-2">{review.comment}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Button variant="ghost" size="sm">
                            👍 Helpful ({review.helpfulCount})
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Book This Experience</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{offer.discountedPrice}</p>
                    <p className="text-sm text-muted-foreground line-through">{offer.originalPrice}</p>
                    <Badge variant="destructive" className="mt-1">Save {offer.discount}</Badge>
                  </div>
                  <Button variant="hero" className="w-full">
                    Book Now
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {offer.maxParticipants - offer.currentParticipants} spots remaining
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Organizer</h3>
                <div className="text-center">
                  <h4 className="font-medium">{offer.organizer}</h4>
                  <p className="text-sm text-muted-foreground mt-1">Promoting Nepali food culture since 2010</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    View Profile
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Similar Offers</h3>
                <div className="space-y-3">
                  {[
                    { title: "Street Food Walking Tour", discount: "25% OFF", rating: 4.4 },
                    { title: "Traditional Cooking Class", discount: "20% OFF", rating: 4.8 },
                    { title: "Tea Culture Experience", discount: "15% OFF", rating: 4.5 }
                  ].map((similar, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <div>
                        <h4 className="font-medium text-sm">{similar.title}</h4>
                        <p className="text-xs text-primary">{similar.discount}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-nepali-gold text-nepali-gold" />
                        <span className="text-sm font-medium">{similar.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OfferDetail;