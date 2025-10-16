import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Heart, MessageCircle, Share } from "lucide-react";

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
  };
  sharedBy?: string;
  message?: string;
}

const SharedContent: React.FC<SharedContentProps> = ({ type, item, sharedBy, message }) => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden max-w-sm">
      {/* Shared message */}
      {message && (
        <div className="p-3 text-sm text-foreground">
          {message}
        </div>
      )}
      
      {/* Content Preview */}
      <div className="relative">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-48 object-cover"
        />
        {type === 'offer' && item.discount && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            {item.discount}
          </Badge>
        )}
      </div>

      <div className="p-3">
        {/* Title and Rating */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
            {type === 'restaurant' && item.cuisine && (
              <p className="text-sm text-muted-foreground">{item.cuisine}</p>
            )}
          </div>
          {item.rating && (
            <div className="flex items-center space-x-1 ml-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{item.rating}</span>
            </div>
          )}
        </div>

        {/* Price and Details */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {item.price && (
              <span className={type === 'offer' && item.originalPrice ? 'line-through' : 'font-semibold text-foreground'}>
                {item.price}
              </span>
            )}
            {type === 'offer' && item.originalPrice && (
              <span className="font-semibold text-foreground">{item.originalPrice}</span>
            )}
            {item.location && (
              <>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{item.location}</span>
                </div>
              </>
            )}
            {item.deliveryTime && (
              <>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.deliveryTime}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="p-0 h-auto">
              <Heart className="w-5 h-5 mr-1" />
              <span className="text-sm">Like</span>
            </Button>
            <Button variant="ghost" size="sm" className="p-0 h-auto">
              <MessageCircle className="w-5 h-5 mr-1" />
              <span className="text-sm">Comment</span>
            </Button>
            <Button variant="ghost" size="sm" className="p-0 h-auto">
              <Share className="w-5 h-5 mr-1" />
              <span className="text-sm">Share</span>
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="px-4"
          >
            {type === 'restaurant' ? 'Visit' : type === 'offer' ? 'Get Offer' : 'Order Now'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharedContent;