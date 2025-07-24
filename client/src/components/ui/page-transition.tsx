import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayContent, setDisplayContent] = useState(children);

  useEffect(() => {
    // Start exit animation
    setIsTransitioning(true);
    
    // After exit animation, update content and start enter animation
    const timer = setTimeout(() => {
      setDisplayContent(children);
      setIsTransitioning(false);
    }, 200); // Match the pageSlideOut animation duration

    return () => clearTimeout(timer);
  }, [location, children]);

  return (
    <div 
      className={`page-transition ${isTransitioning ? 'page-exit' : ''} container-transition`}
      style={{ 
        minHeight: 'calc(100vh - 80px)', // Account for bottom navigation
        paddingBottom: '80px' // Space for bottom navigation
      }}
    >
      {displayContent}
    </div>
  );
}