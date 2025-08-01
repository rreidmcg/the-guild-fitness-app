import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getRandomTip, getTipByCategory } from "@/utils/loading-tips";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div 
      className={cn(
        "animate-spin border-4 border-primary border-t-transparent rounded-full",
        sizeClasses[size],
        className
      )}
      aria-label="Loading"
    />
  );
}

interface LoadingStateProps {
  children?: React.ReactNode;
  className?: string;
  showTip?: boolean;
  tipCategory?: 'workout' | 'battle' | 'progression' | 'strategy' | 'motivation' | 'features';
  message?: string;
}

export function LoadingState({ 
  children, 
  className, 
  showTip = true, 
  tipCategory, 
  message 
}: LoadingStateProps) {
  const [currentTip, setCurrentTip] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showTip) {
      const tip = tipCategory ? getTipByCategory(tipCategory) : getRandomTip();
      setCurrentTip(tip);
      
      // Fade in the tip after a short delay
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [showTip, tipCategory]);

  return (
    <div className={cn("flex items-center justify-center p-8 min-h-[200px]", className)}>
      <div className="flex flex-col items-center space-y-6 max-w-md mx-auto text-center">
        <LoadingSpinner size="lg" />
        
        {message && (
          <div className="text-muted-foreground text-sm font-medium">
            {message}
          </div>
        )}
        
        {children && (
          <div className="text-muted-foreground text-sm">
            {children}
          </div>
        )}
        
        {showTip && currentTip && (
          <div 
            className={cn(
              "bg-card border border-border rounded-lg p-4 shadow-sm transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            <div className="text-sm text-muted-foreground mb-1 font-medium">
              💡 Guild Tip
            </div>
            <div className="text-sm text-foreground leading-relaxed">
              {currentTip}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced loading state specifically for workout-related loading
export function WorkoutLoadingState({ message }: { message?: string }) {
  return (
    <LoadingState 
      tipCategory="workout" 
      message={message || "Preparing your workout..."} 
    />
  );
}

// Enhanced loading state specifically for battle-related loading
export function BattleLoadingState({ message }: { message?: string }) {
  return (
    <LoadingState 
      tipCategory="battle" 
      message={message || "Entering battle..."} 
    />
  );
}