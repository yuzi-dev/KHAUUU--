'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Something went wrong!
            </h1>
            <p className="text-muted-foreground">
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-muted p-4 rounded-lg text-left">
              <p className="text-sm font-mono text-destructive">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={reset} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
            >
              Go home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}