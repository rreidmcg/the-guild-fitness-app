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
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

export function FloatingParticles({ count = 20, className = "" }: FloatingParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = [
      'rgba(255, 215, 0, 0.8)', // Gold
      'rgba(255, 165, 0, 0.7)', // Orange
      'rgba(255, 255, 0, 0.6)', // Yellow
      'rgba(255, 140, 0, 0.8)', // Dark orange
      'rgba(255, 193, 7, 0.7)', // Amber
    ];
    
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1, // 1-4px
      opacity: Math.random() * 0.4 + 0.3, // 0.3-0.7
      duration: Math.random() * 25 + 20, // 20-45 seconds
      delay: Math.random() * 8, // 0-8 second delay
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
  }, [count]);

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            boxShadow: `0 0 12px ${particle.color}, 0 0 6px ${particle.color}`,
          }}
        />
      ))}
    </div>
  );
}