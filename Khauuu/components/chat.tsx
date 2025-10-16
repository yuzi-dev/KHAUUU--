"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Star, 
  MapPin,
  DollarSign,
  Clock
} from "lucide-react";
const dalBhatImage = "/assets/dal-bhat.jpg";
const momosImage = "/assets/momos.jpg";
const restaurantImage = "/assets/restaurant-interior.jpg";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  restaurants?: Restaurant[];
}

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  distance: string;
  image: string;
  isOpen: boolean;
  deliveryTime: string;
  description: string;
}

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Hello! I'm your Khauuu food assistant. I can help you discover amazing restaurants based on your preferences. What type of cuisine are you craving today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleRestaurants: Restaurant[] = [
    {
      id: "1",
      name: "Himalayan Delights",
      cuisine: "Traditional Nepali",
      rating: 4.8,
      priceRange: "₹₹",
      distance: "0.8 km",
      image: dalBhatImage,
      isOpen: true,
      deliveryTime: "25-35 min",
      description: "Authentic Nepali cuisine with traditional dal bhat and local specialties"
    },
    {
      id: "2", 
      name: "Momo Palace",
      cuisine: "Tibetan • Nepali",
      rating: 4.6,
      priceRange: "₹",
      distance: "1.2 km",
      image: momosImage,
      isOpen: true,
      deliveryTime: "15-25 min",
      description: "Best momos in town with various fillings and authentic Tibetan flavors"
    },
    {
      id: "3",
      name: "Heritage Kitchen",
      cuisine: "Newari • Traditional",
      rating: 4.9,
      priceRange: "₹₹₹",
      distance: "2.1 km", 
      image: restaurantImage,
      isOpen: false,
      deliveryTime: "35-45 min",
      description: "Fine dining experience with traditional Newari cuisine and cultural ambiance"
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = (userMessage: string): { content: string; restaurants?: Restaurant[] } => {
    const message = userMessage.toLowerCase();
    
    if (message.includes("vegetarian") || message.includes("veg")) {
      return {
        content: "Great! I found some excellent vegetarian-friendly restaurants for you. Here are my top recommendations:",
        restaurants: sampleRestaurants.filter(r => r.id === "1" || r.id === "3")
      };
    }
    
    if (message.includes("momo") || message.includes("dumpling")) {
      return {
        content: "You're in for a treat! Here are the best places for authentic momos:",
        restaurants: sampleRestaurants.filter(r => r.id === "2")
      };
    }
    
    if (message.includes("cheap") || message.includes("budget") || message.includes("affordable")) {
      return {
        content: "I understand you're looking for budget-friendly options. Here are some great restaurants that won't break the bank:",
        restaurants: sampleRestaurants.filter(r => r.priceRange === "₹")
      };
    }
    
    if (message.includes("fine dining") || message.includes("luxury") || message.includes("special")) {
      return {
        content: "For a special dining experience, I recommend these premium restaurants:",
        restaurants: sampleRestaurants.filter(r => r.priceRange === "₹₹₹")
      };
    }
    
    if (message.includes("nearby") || message.includes("close") || message.includes("near")) {
      return {
        content: "Here are the closest restaurants to your location:",
        restaurants: [...sampleRestaurants].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
      };
    }
    
    if (message.includes("traditional") || message.includes("nepali") || message.includes("local")) {
      return {
        content: "Perfect! Here are some authentic traditional Nepali restaurants:",
        restaurants: sampleRestaurants.filter(r => r.cuisine.includes("Nepali") || r.cuisine.includes("Traditional"))
      };
    }
    
    // Default response with all restaurants
    return {
      content: "Here are some popular restaurants you might enjoy based on your preferences:",
      restaurants: sampleRestaurants
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse = generateBotResponse(inputValue);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: botResponse.content,
        timestamp: new Date(),
        restaurants: botResponse.restaurants
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-warm hover:shadow-glow transition-all duration-300 z-50 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary border-2 border-primary-foreground/20"
        variant="hero"
      >
        <MessageCircle className="w-7 h-7 text-primary-foreground" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-card border border-border rounded-2xl shadow-warm z-50 flex flex-col overflow-hidden"
         style={{ 
           boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
         }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-t-2xl">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Khauuu Assistant</h3>
            <p className="text-xs opacity-90">Find your perfect meal</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-lg ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Restaurant Recommendations */}
            {message.restaurants && message.restaurants.length > 0 && (
              <div className="space-y-2 ml-10">
                {message.restaurants.map((restaurant) => (
                  <Card 
                    key={restaurant.id} 
                    className="hover:shadow-card transition-shadow cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open(`/restaurant/${restaurant.id}`, '_blank');
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-sm truncate">{restaurant.name}</h4>
                              <p className="text-xs text-muted-foreground">{restaurant.cuisine}</p>
                            </div>
                            <Badge variant={restaurant.isOpen ? "default" : "secondary"} className="text-xs">
                              {restaurant.isOpen ? "Open" : "Closed"}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-3 mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 fill-nepali-gold text-nepali-gold" />
                              <span>{restaurant.rating}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-3 h-3" />
                              <span>{restaurant.priceRange}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{restaurant.distance}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{restaurant.deliveryTime}</span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {restaurant.description}
                          </p>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2 text-xs h-7 hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (typeof window !== 'undefined') {
                                window.open(`/restaurant/${restaurant.id}`, '_blank');
                              }
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about restaurants..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} variant="hero" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Try: "vegetarian restaurants", "best momos", "budget friendly"
        </p>
      </div>
    </div>
  );
};

export default Chat;