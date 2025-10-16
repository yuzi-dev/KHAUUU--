'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock, DollarSign, Share2 } from 'lucide-react';
import { SharedContent } from '@/hooks/useMessages';
import { useState } from 'react';
import ShareModal from '@/components/modals/share-modal';

interface SharedContentCardProps {
  sharedContent: SharedContent;
  className?: string;
  showShareButton?: boolean;
}

export const SharedContentCard = ({ 
  sharedContent, 
  className = '',
  showShareButton = false 
}: SharedContentCardProps) => {
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const isFood = sharedContent.content_type === 'food';
  const content = isFood ? sharedContent.food : sharedContent.restaurant;

  if (!content) {
    return (
      <Card className={`w-full max-w-sm ${className}`}>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <p className="text-sm">Content not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleShare = () => {
    if (isFood && sharedContent.food) {
      setShareModalOpen(true);
    } else if (!isFood && sharedContent.restaurant) {
      setShareModalOpen(true);
    }
  };

  const getShareItem = () => {
    if (isFood && sharedContent.food) {
      return {
        id: sharedContent.food.id,
        type: 'food' as const,
        name: sharedContent.food.name,
        description: sharedContent.food.description || '',
        image: sharedContent.food.image_url || '/placeholder.svg',
        rating: sharedContent.food.rating,
        price: sharedContent.food.price?.toString(),
        location: sharedContent.food.restaurant?.location
      };
    } else if (!isFood && sharedContent.restaurant) {
      return {
        id: sharedContent.restaurant.id,
        type: 'restaurant' as const,
        name: sharedContent.restaurant.name,
        description: sharedContent.restaurant.description || '',
        image: sharedContent.restaurant.image_url || '/placeholder.svg',
        rating: sharedContent.restaurant.rating,
        location: sharedContent.restaurant.location
      };
    }
    return null;
  };

  return (
    <>
      <Card className={`w-full max-w-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
        <CardContent className="p-0">
          {/* Image */}
          <div className="relative">
            <img
              src={content.image_url || '/placeholder.svg'}
              alt={content.name}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            {isFood && sharedContent.food?.restaurant && (
              <Badge 
                variant="secondary" 
                className="absolute top-2 left-2 bg-white/90 text-gray-700"
              >
                {sharedContent.food.restaurant.name}
              </Badge>
            )}
            {showShareButton && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 text-gray-700" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                {content.name}
              </h3>
              {content.rating && (
                <div className="flex items-center space-x-1 ml-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {content.rating}
                  </span>
                </div>
              )}
            </div>

            {content.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {content.description}
              </p>
            )}

            {/* Food-specific details */}
            {isFood && sharedContent.food && (
              <div className="space-y-2">
                {sharedContent.food.price && (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      ₹{sharedContent.food.price}
                    </span>
                  </div>
                )}
                {sharedContent.food.restaurant?.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 truncate">
                      {sharedContent.food.restaurant.location}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Restaurant-specific details */}
            {!isFood && sharedContent.restaurant && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {sharedContent.restaurant.cuisine_type && (
                    <Badge variant="outline" className="text-xs">
                      {sharedContent.restaurant.cuisine_type}
                    </Badge>
                  )}
                  {sharedContent.restaurant.price_range && (
                    <span className="text-sm font-medium text-gray-700">
                      {sharedContent.restaurant.price_range}
                    </span>
                  )}
                </div>
                {sharedContent.restaurant.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 truncate">
                      {sharedContent.restaurant.location}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Shared info */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Shared {new Date(sharedContent.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Modal */}
      {shareModalOpen && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          item={getShareItem()}
        />
      )}
    </>
  );
};