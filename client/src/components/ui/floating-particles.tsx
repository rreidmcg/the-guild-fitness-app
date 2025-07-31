import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
  direction: 'left' | 'right' | 'center';
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

export function FloatingParticles({ count = 20, className = "" }: FloatingParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = [
      'rgba(255, 215, 0, 0.9)', // Gold
      'rgba(255, 165, 0, 0.85)', // Orange
      'rgba(255, 255, 0, 0.8)', // Yellow
      'rgba(255, 140, 0, 0.9)', // Dark orange
      'rgba(255, 193, 7, 0.85)', // Amber
    ];
    
    const directions: ('left' | 'right' | 'center')[] = ['left', 'right', 'center'];
    
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Full width distribution
      y: Math.random() * 100,
      size: Math.random() * 4 + 2, // 2-6px (increased from 1-4px)
      opacity: Math.random() * 0.5 + 0.5, // 0.5-1.0 (increased from 0.3-0.7)
      duration: Math.random() * 25 + 20, // 20-45 seconds
      delay: Math.random() * 8, // 0-8 second delay
      color: colors[Math.floor(Math.random() * colors.length)],
      direction: directions[Math.floor(Math.random() * directions.length)],
    }));
    setParticles(newParticles);
  }, [count]);

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute rounded-full animate-float-${particle.direction}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            boxShadow: `0 0 20px ${particle.color}, 0 0 10px ${particle.color}, 0 0 5px ${particle.color}`,
          }}
        />
      ))}
    </div>
  );
}