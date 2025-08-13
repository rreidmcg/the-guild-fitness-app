/**
 * Enhanced Error Boundary for Day 3 Frontend Modernization
 * 
 * Provides comprehensive error handling with:
 * - User-friendly error messages
 * - Error reporting and analytics
 * - Recovery suggestions
 * - Performance impact monitoring
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  showDetails: boolean;
}

interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  className?: string;
}

/**
 * Enhanced Error Boundary Component
 */
export class EnhancedErrorBoundary extends Component<
  EnhancedErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Enhanced Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to analytics (in production)
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Send error report to backend
      await fetch('/api/error-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1
    }));

    // Clear error state after a brief delay to allow re-render
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }, 100);
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  private getErrorCategory = (error: Error): { type: string; color: string; suggestion: string } => {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: 'Network Error',
        color: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
        suggestion: 'Check your internet connection and try again.'
      };
    }

    if (message.includes('chunk') || message.includes('loading')) {
      return {
        type: 'Loading Error',
        color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        suggestion: 'This might be a temporary issue. Please refresh the page.'
      };
    }

    if (stack.includes('react') || stack.includes('component')) {
      return {
        type: 'Component Error',
        color: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
        suggestion: 'A component encountered an unexpected issue.'
      };
    }

    return {
      type: 'Application Error',
      color: 'bg-red-500/10 border-red-500/20 text-red-400',
      suggestion: 'An unexpected error occurred. Please try refreshing the page.'
    };
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const { maxRetries = 3, className } = this.props;
      
      // Use custom fallback if provided
      if (this.props.fallback && error) {
        return this.props.fallback(error, this.handleRetry);
      }

      const errorCategory = error ? this.getErrorCategory(error) : {
        type: 'Unknown Error',
        color: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
        suggestion: 'An unknown error occurred.'
      };

      const canRetry = this.state.retryCount < maxRetries;

      return (
        <div className={cn('enhanced-error-boundary min-h-screen flex items-center justify-center p-4', className)}>
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'p-2 rounded-full',
                  errorCategory.color
                )}>
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Something went wrong</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {errorCategory.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date().toLocaleTimeString()}</span>
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {errorCategory.suggestion}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    className="flex-1"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again {this.state.retryCount > 0 && `(${maxRetries - this.state.retryCount} left)`}
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Error Details Toggle */}
              {import.meta.env.DEV && error && (
                <div className="border-t pt-4">
                  <Button
                    onClick={this.toggleDetails}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center space-x-2">
                      <Bug className="h-4 w-4" />
                      <span>Technical Details</span>
                    </span>
                    {this.state.showDetails ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {this.state.showDetails && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <div className="space-y-2 text-xs">
                        <div>
                          <strong>Error ID:</strong>
                          <code className="ml-2 bg-background px-1 rounded">
                            {this.state.errorId}
                          </code>
                        </div>
                        <div>
                          <strong>Message:</strong>
                          <code className="ml-2 bg-background px-1 rounded">
                            {error.message}
                          </code>
                        </div>
                        {error.stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer font-medium">Stack Trace</summary>
                            <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto max-h-32">
                              {error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Help Text */}
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                If this problem persists, please contact support with error ID: 
                <code className="ml-1 bg-background px-1 rounded">
                  {this.state.errorId}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}