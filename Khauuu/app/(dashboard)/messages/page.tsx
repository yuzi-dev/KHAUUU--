"use client";

import { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import SharedContent from "@/components/shared-content";
import { 
  Search, 
  Send, 
  MessageSquare, 
  Phone, 
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Settings,
  Camera,
  Heart,
  Info,
  Plus,
  Edit3
} from "lucide-react";

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>("1");
  const [messageText, setMessageText] = useState("");
  const [showMessageRequests, setShowMessageRequests] = useState(false);

  const conversations = [
    {
      id: "1",
      name: "Priya Sharma",
      lastMessage: "The dal bhat was amazing! 🍛",
      timestamp: "2m",
      unreadCount: 0,
      avatar: "/placeholder.svg",
      isGroup: false,
      isOnline: true,
      verified: true
    },
    {
      id: "2", 
      name: "Food Lovers Group",
      lastMessage: "Anyone tried the new momo place?",
      timestamp: "5m",
      unreadCount: 3,
      avatar: "/placeholder.svg",
      isGroup: true,
      members: 12,
      isOnline: false
    },
    {
      id: "3",
      name: "Raj Thapa",
      lastMessage: "Want to try that Newari place tomorrow?",
      timestamp: "1h",
      unreadCount: 0,
      avatar: "/placeholder.svg",
      isGroup: false,
      isOnline: false
    },
    {
      id: "4",
      name: "Restaurant Reviews",
      lastMessage: "New review posted for Heritage Kitchen",
      timestamp: "2h", 
      unreadCount: 1,
      avatar: "/placeholder.svg",
      isGroup: true,
      members: 45,
      isOnline: false
    }
  ];

  const messageRequests = [
    {
      id: "req1",
      name: "Suman Khadka",
      lastMessage: "Hi! I saw your review of Bhojan Griha...",
      timestamp: "1d",
      avatar: "/placeholder.svg"
    },
    {
      id: "req2",
      name: "Maya Gurung",
      lastMessage: "Would love to connect and share food experiences!",
      timestamp: "2d",
      avatar: "/placeholder.svg"
    }
  ];

  const messages = [
    {
      id: "1",
      sender: "Priya Sharma",
      content: "Hey! Have you tried the new momo place in Thamel?",
      timestamp: "10:30 AM",
      isOwn: false,
      avatar: "/placeholder.svg"
    },
    {
      id: "2", 
      sender: "You",
      content: "Not yet! Is it good?",
      timestamp: "10:32 AM",
      isOwn: true,
      avatar: "/placeholder.svg"
    },
    {
      id: "3",
      sender: "Priya Sharma", 
      content: "Amazing! Best momos I've had in months. The jhol is incredible 🔥",
      timestamp: "10:33 AM",
      isOwn: false,
      avatar: "/placeholder.svg"
    },
    {
      id: "4",
      sender: "Priya Sharma",
      content: "",
      timestamp: "10:34 AM",
      isOwn: false,
      avatar: "/placeholder.svg",
      type: "shared",
      sharedContent: {
        type: "restaurant" as const,
        item: {
          id: "1",
          name: "Himalayan Momo Corner",
          image: "/api/placeholder/400/300",
          description: "Authentic Tibetan momos with amazing jhol. Best in Thamel!",
          rating: 4.8,
          reviewCount: 156,
          cuisine: "Tibetan • Nepali",
          price: "₹₹",
          location: "Thamel",
          deliveryTime: "20-30 min"
        },
        message: "This is the place! You have to try their steam momos 🥟"
      }
    },
    {
      id: "5",
      sender: "You",
      content: "Looks amazing! I'll definitely check it out this weekend",
      timestamp: "10:35 AM", 
      isOwn: true,
      avatar: "/placeholder.svg"
    },
    {
      id: "6",
      sender: "You",
      content: "",
      timestamp: "10:36 AM",
      isOwn: true,
      avatar: "/placeholder.svg",
      type: "shared",
      sharedContent: {
        type: "offer" as const,
        item: {
          id: "2",
          name: "50% Off on All Desserts",
          image: "/api/placeholder/400/300",
          description: "Limited time offer on all traditional Nepali desserts",
          discount: "50% OFF",
          price: "₹125",
          originalPrice: "₹250",
          location: "Heritage Kitchen"
        },
        message: "Check this out! We could use this offer when we go"
      }
    }
  ];

  const sendMessage = () => {
    if (messageText.trim()) {
      // Handle message sending logic here
      setMessageText("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Instagram-like layout */}
      <div className="flex h-screen pt-16">
        {/* Left Sidebar - Chat List */}
        <div className="w-full lg:w-[400px] border-r border-border bg-card">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-foreground">Username</h1>
              <Button variant="ghost" size="icon">
                <Edit3 className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search messages..."
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <Button
              variant={!showMessageRequests ? "ghost" : "ghost"}
              className={`flex-1 rounded-none border-b-2 ${
                !showMessageRequests 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setShowMessageRequests(false)}
            >
              Primary
            </Button>
            <Button
              variant={showMessageRequests ? "ghost" : "ghost"}
              className={`flex-1 rounded-none border-b-2 ${
                showMessageRequests 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setShowMessageRequests(true)}
            >
              Requests
              {messageRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {messageRequests.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Chat List */}
          <div className="overflow-y-auto">
            {!showMessageRequests ? (
              conversations.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedChat === chat.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedChat(chat.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={chat.avatar} alt={chat.name} />
                        <AvatarFallback>{chat.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      {chat.isOnline && !chat.isGroup && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <h3 className="font-medium text-foreground truncate">
                            {chat.name}
                          </h3>
                          {chat.verified && (
                            <Badge variant="secondary" className="text-xs">✓</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.isGroup && `${chat.members} members • `}{chat.lastMessage}
                        </p>
                        {chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              messageRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.avatar} alt={request.name} />
                      <AvatarFallback>{request.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground truncate">
                          {request.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">{request.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {request.lastMessage}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <Button size="sm" variant="hero">Accept</Button>
                        <Button size="sm" variant="outline">Decline</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src="/placeholder.svg" alt="Priya Sharma" />
                      <AvatarFallback>PS</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-foreground">Priya Sharma</h2>
                      <p className="text-sm text-muted-foreground">Active now</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Info className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-[70%] ${message.isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
                      {!message.isOwn && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.avatar} alt={message.sender} />
                          <AvatarFallback>{message.sender.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.isOwn 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-foreground"
                      }`}>
                        {message.type === "shared" && message.sharedContent ? (
                          <SharedContent 
                            type={message.sharedContent.type}
                            item={message.sharedContent.item}
                            message={message.sharedContent.message}
                          />
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        <p className={`text-xs mt-1 ${
                          message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Plus className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Camera className="w-5 h-5" />
                  </Button>
                  
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="pr-20"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                    variant="hero"
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Your Messages</h3>
                <p className="text-muted-foreground">Send private messages to friends and food lovers</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;