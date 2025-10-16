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
  const content = sharedContent.content_data;

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
    if (sharedContent.content_data) {
      setShareModalOpen(true);
    }
  };

  const getShareItem = () => {
    if (isFood && sharedContent.content_data) {
      return {
        id: sharedContent.content_data.id,
        type: 'food' as const,
        name: sharedContent.content_data.name,
        description: sharedContent.content_data.description || '',
        image: sharedContent.content_data.image_url || sharedContent.content_data.images?.[0] || '/placeholder.svg',
        rating: sharedContent.content_data.rating,
        price: sharedContent.content_data.price?.toString(),
        location: sharedContent.content_data.restaurant_name
      };
    } else if (!isFood && sharedContent.content_data) {
      return {
        id: sharedContent.content_data.id,
        type: 'restaurant' as const,
        name: sharedContent.content_data.name,
        description: sharedContent.content_data.description || '',
        image: sharedContent.content_data.cover_images?.[0] || sharedContent.content_data.images?.[0] || '/placeholder.svg',
        rating: sharedContent.content_data.rating,
        location: sharedContent.content_data.address
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
              src={isFood 
                ? (content.image_url || content.images?.[0] || '/placeholder.svg')
                : (content.cover_images?.[0] || content.images?.[0] || '/placeholder.svg')
              }
              alt={content.name}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            {isFood && content.restaurant_name && (
              <Badge 
                variant="secondary" 
                className="absolute top-2 left-2 bg-white/90 text-gray-700"
              >
                {content.restaurant_name}
              </Badge>
            )}
            {showShareButton && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg leading-tight">{content.name}</h3>
              {content.rating && (
                <div className="flex items-center gap-1 ml-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{content.rating}</span>
                </div>
              )}
            </div>

            {content.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {content.description}
              </p>
            )}

            <div className="space-y-2">
              {/* Food specific info */}
              {isFood && (
                <>
                  {content.price && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>${content.price}</span>
                    </div>
                  )}
                  {content.category && (
                    <Badge variant="outline" className="text-xs">
                      {content.category}
                    </Badge>
                  )}
                  {content.is_vegetarian && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Vegetarian
                    </Badge>
                  )}
                </>
              )}

              {/* Restaurant specific info */}
              {!isFood && (
                <>
                  {content.cuisine && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Cuisine:</span>
                      <span>{content.cuisine}</span>
                    </div>
                  )}
                  {content.price_range && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>{content.price_range}</span>
                    </div>
                  )}
                </>
              )}

              {/* Location */}
              {(content.address || content.restaurant_name) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">
                    {content.address || content.restaurant_name}
                  </span>
                </div>
              )}

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {content.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {content.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{content.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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