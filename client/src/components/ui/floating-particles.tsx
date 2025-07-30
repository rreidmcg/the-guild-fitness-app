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
  animationType: 'early' | 'mid' | 'late'; // Different fade patterns
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

export function FloatingParticles({ count = 15, className = "" }: FloatingParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = [
      'rgba(255, 215, 0, 1)', // Gold - full opacity
      'rgba(255, 165, 0, 1)', // Orange - full opacity
      'rgba(255, 255, 0, 0.95)', // Yellow - nearly full
      'rgba(255, 140, 0, 1)', // Dark orange - full opacity
      'rgba(255, 193, 7, 1)', // Amber - full opacity
    ];
    
    const animationTypes = ['early', 'mid', 'late'] as const;
    
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 90 + 5, // 5-95% to avoid edges
      y: 110, // Start below screen
      size: Math.random() * 3 + 4, // 4-7px - bigger
      opacity: 1, // Full opacity for testing
      duration: Math.random() * 8 + 6, // 6-14 seconds - faster
      delay: i * 0.5, // Staggered delays
      color: colors[Math.floor(Math.random() * colors.length)],
      animationType: animationTypes[Math.floor(Math.random() * animationTypes.length)],
    }));
    setParticles(newParticles);
    console.log('Fireflies created:', newParticles.length); // Debug
  }, [count]);

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`} style={{ zIndex: 0 }}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute rounded-full animate-firefly-${particle.animationType}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            boxShadow: `0 0 20px ${particle.color}, 0 0 10px ${particle.color}, 0 0 5px ${particle.color}`,
          }}
        />
      ))}
    </div>
  );
}