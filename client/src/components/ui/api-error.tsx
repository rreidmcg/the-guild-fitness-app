import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader } from './card';

interface ApiErrorProps {
  error: Error;
  onRetry?: () => void;
  title?: string;
  showRetry?: boolean;
}

export function ApiError({ 
  error, 
  onRetry, 
  title = "Failed to load data",
  showRetry = true 
}: ApiErrorProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('NetworkError');
  const isServerError = error.message.includes('500') || error.message.includes('503');
  
  return (
    <Card className="bg-game-slate border-red-500/50">
      <CardHeader className="text-center pb-3">
        <div className="flex items-center justify-center space-x-2 text-red-400">
          {isNetworkError ? (
            <WifiOff className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{title}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-300 text-center">
          {isNetworkError 
            ? "Check your internet connection and try again"
            : isServerError
            ? "Server is temporarily unavailable"
            : "Something went wrong while loading data"
          }
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
          </details>
        )}
        
        {showRetry && onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function NetworkStatus() {
  const isOnline = navigator.onLine;
  
  if (isOnline) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm z-50">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span>You're offline. Some features may not work.</span>
      </div>
    </div>
  );
}