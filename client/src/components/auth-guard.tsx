import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CurrencyHeader } from "@/components/ui/currency-header";
import { BottomNav } from "@/components/ui/bottom-nav";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  // Check authentication status
  const { data: userStats, isLoading, error } = useQuery({
    queryKey: ["/api/user/stats"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      setIsChecking(false);
      
      // If there's an error (likely 401/403) or no user data, redirect to login
      if (error || !userStats) {
        setLocation('/login');
      }
    }
  }, [isLoading, error, userStats, setLocation]);

  // Show loading state while checking authentication
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If we get here, user is authenticated - show with UI chrome
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed Currency Header */}
      <CurrencyHeader />
      
      {/* Main content with top padding to account for fixed header */}
      <div className="pt-12 pb-20">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const [, setLocation] = useLocation();

  // Check if user is already authenticated
  const { data: userStats, isLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    retry: false,
  });

  useEffect(() => {
    // If user is authenticated, redirect to stats page
    if (!isLoading && userStats) {
      setLocation('/stats');
    }
  }, [isLoading, userStats, setLocation]);

  // Show the public route (login/signup) if user is not authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}