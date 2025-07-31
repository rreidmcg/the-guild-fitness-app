import { useState, useEffect } from "react";
import forestBackgroundImage from "@assets/AD897CD2-5CB0-475D-B782-E09FD8D98DF7_1753153903824.png";

interface ParallaxBackgroundProps {
  children: React.ReactNode;
  className?: string;
  showForestBackground?: boolean;
}

export function ParallaxBackground({ children, className = "", showForestBackground = false }: ParallaxBackgroundProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {showForestBackground ? (
        <>
          {/* Forest Background Image for Battle Pages */}
          <div 
            className="fixed inset-0 z-0"
            style={{
              backgroundImage: `url(${forestBackgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              transform: `translateY(${scrollY * 0.1}px)`,
            }}
          />
          
          {/* Dark overlay for better readability */}
          <div className="fixed inset-0 bg-black/40 z-0" />
          
          {/* Parallax Effect Layers */}
          <div className="fixed inset-0 z-0">
            {/* Atmospheric effects */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                transform: `translateY(${scrollY * 0.2}px)`,
                background: 'radial-gradient(circle at 30% 20%, rgba(34, 197, 94, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)'
              }}
            />
            
            {/* Depth effect */}
            <div 
              className="absolute inset-0 opacity-15"
              style={{
                transform: `translateY(${scrollY * 0.3}px)`,
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, transparent 40%, rgba(34, 197, 94, 0.1) 100%)'
              }}
            />
          </div>
        </>
      ) : (
        /* Regular gradient background for non-battle pages */
        <div className="fixed inset-0 z-0">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              background: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)'
            }}
          />
          
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              transform: `translateY(${scrollY * 0.2}px)`,
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 40%, rgba(239, 68, 68, 0.1) 100%)'
            }}
          />
        </div>
      )}

      {/* Main Content with Backdrop */}
      <div className={`relative z-10 backdrop-blur-sm ${className}`}>
        {children}
      </div>
    </div>
  );
}