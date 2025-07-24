import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Reset visibility when location changes
    setIsVisible(false);
    
    // Small delay to allow exit transition, then show new content
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div 
      className={`transition-all duration-300 ease-out ${
        isVisible 
          ? 'opacity-100 transform translate-x-0' 
          : 'opacity-90 transform translate-x-1'
      }`}
      style={{ 
        minHeight: 'calc(100vh - 80px)', // Account for bottom navigation
        paddingBottom: '80px' // Space for bottom navigation
      }}
    >
      {children}
    </div>
  );
}