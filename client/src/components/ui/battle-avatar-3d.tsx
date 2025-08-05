import React, { useState, useEffect } from 'react';
import { Avatar3D } from './avatar-3d';
import { AvatarSelector } from './avatar-selector';

interface BattleAvatar3DProps {
  playerStats: any;
  className?: string;
  isAttacking?: boolean;
  onAttackComplete?: () => void;
  showToggle?: boolean;
}

export function BattleAvatar3D({ 
  playerStats, 
  className, 
  isAttacking = false, 
  onAttackComplete,
  showToggle = false
}: BattleAvatar3DProps) {
  const [animationState, setAnimationState] = useState<'idle' | 'victory' | 'attack' | 'level_up'>('idle');

  useEffect(() => {
    if (isAttacking) {
      setAnimationState('attack');
      
      // Reset to idle after attack animation
      const timeout = setTimeout(() => {
        setAnimationState('idle');
        onAttackComplete?.();
      }, 1500); // Attack animation duration

      return () => clearTimeout(timeout);
    }
  }, [isAttacking, onAttackComplete]);

  if (showToggle) {
    return (
      <AvatarSelector
        playerStats={playerStats}
        size="lg"
        className={className}
        showToggle={true}
        defaultMode="3d"
        interactive={false}
        showStats={false}
        animationState={animationState}
      />
    );
  }

  return (
    <Avatar3D
      playerStats={playerStats}
      size="lg"
      className={className}
      interactive={false}
      showStats={false}
      animationState={animationState}
    />
  );
}