import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Khauuu Admin - Restaurant & Food Management",
  description: "Admin panel for managing restaurants and foods in the Khauuu platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <AdminLayout>
            {children}
          </AdminLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
