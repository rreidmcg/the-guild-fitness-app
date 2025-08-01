import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface BattleAccessGuardProps {
  children: React.ReactNode;
}

export function BattleAccessGuard({ children }: BattleAccessGuardProps) {
  const [, setLocation] = useLocation();
  
  // Get user data to check battle access
  const { data: userStats, isLoading } = useQuery({
    queryKey: ['/api/user/stats'],
  });

  // Check if user has battle access (Zero or Rob with G.M. title)
  const hasBattleAccess = userStats?.username === 'Zero' || userStats?.currentTitle === '<G.M.>';

  useEffect(() => {
    if (!isLoading && !hasBattleAccess) {
      alert("You Do Not Have Access To This Feature");
      setLocation("/");
    }
  }, [isLoading, hasBattleAccess, setLocation]);

  // Show loading while checking access
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // Don't render children if no access
  if (!hasBattleAccess) {
    return null;
  }

  return <>{children}</>;
}