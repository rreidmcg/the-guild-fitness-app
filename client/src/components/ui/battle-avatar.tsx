import { Avatar2D } from "./avatar-2d";

interface BattleAvatarProps {
  playerStats: any;
  className?: string;
  isAttacking?: boolean;
  onAttackComplete?: () => void;
}

export function BattleAvatar({ playerStats, className, isAttacking = false, onAttackComplete }: BattleAvatarProps) {
  // Immediately call onAttackComplete if provided, since we're not doing animation
  if (isAttacking && onAttackComplete) {
    setTimeout(onAttackComplete, 0);
  }

  // Always use the normal Avatar2D component
  return (
    <Avatar2D 
      playerStats={playerStats}
      className={`w-full h-full ${className}`}
    />
  );
}