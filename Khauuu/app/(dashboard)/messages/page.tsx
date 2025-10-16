"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMessages } from "@/hooks/useMessages";
import { MessageSquare } from "lucide-react";

const Messages = () => {
  const router = useRouter();
  const { conversations, loading } = useMessages();

  // Redirect to first conversation if available, otherwise show empty state
  useEffect(() => {
    if (!loading && conversations.length > 0) {
      // Redirect to the first conversation
      router.push(`/messages/${conversations[0].id}`);
    }
  }, [loading, conversations, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading messages...</h2>
          <p className="text-muted-foreground">Please wait while we load your conversations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center">
        <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No conversations yet</h2>
        <p className="text-muted-foreground mb-4">
          Start messaging someone to see your conversations here.
        </p>
        <p className="text-sm text-muted-foreground">
          Use the "New Message" button in the sidebar to start a conversation.
        </p>
      </div>
    </div>
  );
};

export default Messages;