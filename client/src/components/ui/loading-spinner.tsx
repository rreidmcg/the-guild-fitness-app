import { cn } from "@/lib/utils";

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

export function LoadingState({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="flex flex-col items-center space-y-3">
        <LoadingSpinner size="lg" />
        {children && <div className="text-gray-400 text-sm">{children}</div>}
      </div>
    </div>
  );
}