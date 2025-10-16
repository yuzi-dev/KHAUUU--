import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Clock, Heart, Send, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import ShareModal from "@/components/modals/share-modal";

interface SharedContentProps {
  type: 'restaurant' | 'food' | 'offer';
  item: {
    id: string;
    name: string;
    image: string;
    description?: string;
    rating?: number;
    reviewCount?: number;
    price?: string;
    location?: string;
    discount?: string;
    deliveryTime?: string;
    cuisine?: string;
    originalPrice?: string;
    tags?: string[];
    priceRange?: string;
  };
  sharedBy?: string;
  message?: string;
}

const SharedContent: React.FC<SharedContentProps> = ({ type, item, sharedBy, message }) => {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Helper function to format review count
  const formatReviewCount = (count: number | undefined | null): string => {
    if (!count || count === 0) {
      return '0';
    }
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'm';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  const handleCardClick = () => {
    if (type === 'restaurant') {
      router.push(`/restaurant/${item.id}`);
    } else if (type === 'food') {
      router.push(`/food/${item.id}`);
    } else if (type === 'offer') {
      router.push(`/offer/${item.id}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareModal(true);
  };

  const shareItem = {
    id: item.id,
    type: type,
    name: item.name,
    image: item.image,
    description: item.description || (type === 'restaurant' && item.cuisine ? `${item.cuisine} • ${item.tags?.join(', ')}` : item.description),
    rating: item.rating,
    price: item.price || item.priceRange,
    location: item.location || 'Kathmandu',
  };

  return (
    <>
      <div className="max-w-sm">
        {/* Shared message */}
        {message && (
          <div className="p-3 text-sm text-foreground bg-muted/50 rounded-t-lg">
            <span className="font-medium">{sharedBy}</span> shared:
            <p className="mt-1">{message}</p>
          </div>
        )}
        
        <Card 
          className="group hover:shadow-warm transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-primary/10 cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="relative overflow-hidden rounded-t-lg">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute top-3 right-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`bg-background/80 hover:bg-background ${isFavorite ? 'text-red-500' : ''}`}
                onClick={handleFavoriteClick}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>
            {type === 'offer' && item.discount && (
              <div className="absolute bottom-3 left-3">
                <Badge variant="default" className="bg-red-500 text-white">
                  {item.discount}
                </Badge>
              </div>
            )}
            {type === 'restaurant' && (
              <div className="absolute bottom-3 left-3">
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  Open
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              {item.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-nepali-gold text-nepali-gold" />
                  <span className="font-medium text-foreground">{item.rating}</span>
                  <span className="text-muted-foreground text-sm">({formatReviewCount(item.reviewCount)})</span>
                </div>
              )}
            </div>

            {type === 'restaurant' && item.cuisine && (
              <p className="text-muted-foreground mb-3">{item.cuisine}</p>
            )}

            {item.description && (
              <p className="text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
            )}

            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
              {(item.price || item.priceRange) && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>{item.price || item.priceRange}</span>
                </div>
              )}
              {item.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{item.location}</span>
                </div>
              )}
              {item.deliveryTime && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{item.deliveryTime}</span>
                </div>
              )}
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {item.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-primary"
                onClick={handleShare}
              >
                <Send className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button 
                variant="outline" 
                className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
              >
                {type === 'restaurant' ? 'View Menu' : type === 'offer' ? 'Get Offer' : 'Explore'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        item={shareItem}
      />
    </>
  );
};

export default SharedContent;