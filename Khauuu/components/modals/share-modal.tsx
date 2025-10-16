"use client";

import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareItem {
  id: string;
  type: 'restaurant' | 'food' | 'offer';
  name: string;
  image: string;
  description?: string;
  rating?: number;
  price?: string;
  location?: string;
  discount?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ShareItem | null;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, item }) => {
  const { toast } = useToast();

  const closeContacts = [
    { id: "1", name: "Priya", avatar: "/placeholder.svg" },
    { id: "2", name: "Raj", avatar: "/placeholder.svg" },
    { id: "3", name: "Maya", avatar: "/placeholder.svg" },
    { id: "4", name: "Suman", avatar: "/placeholder.svg" },
    { id: "5", name: "Binod", avatar: "/placeholder.svg" },
    { id: "6", name: "Kamala", avatar: "/placeholder.svg" },
  ];

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/${item?.type}/${item?.id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Link has been copied to your clipboard",
      });
    }
  };

  const handleExternalShare = (platform: string) => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/${item?.type}/${item?.id}`;
    const shareText = `Check out this ${item?.type}: ${item?.name}!`;
    
    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "messenger":
        url = `fb-messenger://share?link=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case "viber":
        url = `viber://forward?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, "_blank");
    }
  };

  const externalPlatforms = [
    { 
      id: "story", 
      name: "Add to story", 
      icon: "📱", 
      bgColor: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" 
    },
    { 
      id: "copy", 
      name: "Copy link", 
      icon: "🔗", 
      bgColor: "bg-gray-100 border border-gray-300" 
    },
    { 
      id: "whatsapp", 
      name: "WhatsApp", 
      icon: "📞", 
      bgColor: "bg-green-500" 
    },
    { 
      id: "messenger", 
      name: "Messenger", 
      icon: "💬", 
      bgColor: "bg-blue-500" 
    },
    { 
      id: "facebook", 
      name: "Facebook", 
      icon: "📘", 
      bgColor: "bg-blue-600" 
    },
    { 
      id: "twitter", 
      name: "Twitter", 
      icon: "🐦", 
      bgColor: "bg-black" 
    },
    { 
      id: "telegram", 
      name: "Telegram", 
      icon: "✈️", 
      bgColor: "bg-blue-400" 
    },
    { 
      id: "viber", 
      name: "Viber", 
      icon: "💜", 
      bgColor: "bg-purple-500" 
    },
  ];

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 gap-0 bg-white rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-black text-lg">Share</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5 text-gray-700" />
          </Button>
        </div>

        {/* Close Friends Section */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {closeContacts.map((contact) => (
              <div key={contact.id} className="flex flex-col items-center space-y-1 min-w-0">
                <div className="relative">
                  <Avatar className="w-14 h-14 border-2 border-gray-200">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-medium">
                      {contact.name[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-xs text-gray-700 truncate w-16 text-center">
                  {contact.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* External Share Grid */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-4 gap-4">
            {externalPlatforms.map((platform) => (
              <button
                key={platform.id}
                className="flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => {
                  if (platform.id === "copy") {
                    handleCopyLink();
                  } else if (platform.id === "story") {
                    toast({
                      title: "Add to Story",
                      description: "Feature coming soon!",
                    });
                  } else {
                    handleExternalShare(platform.id);
                  }
                }}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg ${platform.bgColor}`}>
                  {platform.icon}
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">
                  {platform.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;