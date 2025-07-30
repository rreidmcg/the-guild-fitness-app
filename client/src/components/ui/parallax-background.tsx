import { useState, useEffect } from "react";

interface ParallaxBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function ParallaxBackground({ children, className = "" }: ParallaxBackgroundProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Parallax Background Layers */}
      <div className="fixed inset-0 z-0">
        {/* Far Background Layer - Slowest */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`,
            background: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)'
          }}
        />
        
        {/* Mid Background Layer - Medium Speed */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 40%, rgba(239, 68, 68, 0.1) 100%)'
          }}
        />
        
        {/* Near Background Layer - Faster */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
            background: 'conic-gradient(from 45deg at 50% 50%, rgba(168, 85, 247, 0.05) 0deg, rgba(59, 130, 246, 0.05) 120deg, rgba(34, 197, 94, 0.05) 240deg, rgba(168, 85, 247, 0.05) 360deg)'
          }}
        />
      </div>

      {/* Main Content with Backdrop */}
      <div className={`relative z-10 backdrop-blur-sm ${className}`}>
        {children}
      </div>
    </div>
  );
}