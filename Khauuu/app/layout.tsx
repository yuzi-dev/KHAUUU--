import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import Chat from "@/components/chat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Khauuu - Nepal Food Finder",
  description: "Discover authentic Nepali cuisine and restaurants near you",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
              <Chat />
            </TooltipProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}