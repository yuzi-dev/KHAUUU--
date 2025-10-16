import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-semibold text-foreground">
              Page Not Found
            </h2>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Link>
            </Button>
          </div>

          <div className="pt-8">
            <p className="text-sm text-muted-foreground">
              Looking for restaurants or food? Try our{' '}
              <Link href="/restaurants" className="text-primary hover:underline">
                restaurant finder
              </Link>{' '}
              or{' '}
              <Link href="/search" className="text-primary hover:underline">
                search page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}