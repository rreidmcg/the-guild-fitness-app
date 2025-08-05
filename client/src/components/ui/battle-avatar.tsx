import { useState, useEffect } from "react";
import { Avatar2D } from "./avatar-2d";
import attackAnimationSprite from "@assets/combined_sprite_22486192-f742-457a-9063-d2f0c1da2dab_1754359312236.png";

interface BattleAvatarProps {
  playerStats: any;
  className?: string;
  isAttacking?: boolean;
  onAttackComplete?: () => void;
}

export function BattleAvatar({ playerStats, className, isAttacking = false, onAttackComplete }: BattleAvatarProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sprite sheet configuration (21 frames in 4 columns and 6 rows, with last frame at position 0,5)
  const TOTAL_FRAMES = 21;
  const FRAME_WIDTH = 256; // Actual frame width from sprite sheet (1024px / 4 cols = 256px)
  const FRAME_HEIGHT = 256; // Actual frame height from sprite sheet (1536px / 6 rows = 256px)
  const COLS = 4;
  const ROWS = 6;
  const FPS = 5;
  const FRAME_DURATION = 1000 / FPS; // 200ms per frame

  useEffect(() => {
    console.log("BattleAvatar - isAttacking:", isAttacking, "isAnimating:", isAnimating);
    
    if (isAttacking && !isAnimating) {
      console.log("Starting attack animation");
      setIsAnimating(true);
      setCurrentFrame(0);

      const animationTimer = setInterval(() => {
        setCurrentFrame(prev => {
          const nextFrame = prev + 1;
          console.log("Animation frame:", nextFrame, "of", TOTAL_FRAMES);
          if (nextFrame >= TOTAL_FRAMES) {
            console.log("Attack animation complete");
            clearInterval(animationTimer);
            setIsAnimating(false);
            onAttackComplete?.();
            return 0; // Reset to idle
          }
          return nextFrame;
        });
      }, FRAME_DURATION);

      return () => clearInterval(animationTimer);
    }
  }, [isAttacking, isAnimating, onAttackComplete]);

  // Calculate sprite position
  const getFramePosition = (frame: number) => {
    const row = Math.floor(frame / COLS);
    const col = frame % COLS;
    return {
      x: col * FRAME_WIDTH,
      y: row * FRAME_HEIGHT
    };
  };

  if (isAnimating) {
    const { x, y } = getFramePosition(currentFrame);
    console.log(`Frame ${currentFrame}: x=${x}, y=${y}`);
    
    return (
      <div 
        className={`w-full h-full ${className}`}
        style={{
          backgroundImage: `url(${attackAnimationSprite})`,
          backgroundPosition: `-${x}px -${y}px`,
          backgroundSize: `${FRAME_WIDTH * COLS}px ${FRAME_HEIGHT * ROWS}px`,
          imageRendering: 'pixelated',
          backgroundRepeat: 'no-repeat'
        }}
      />
    );
  }

  // Default to regular Avatar2D when not attacking - remove size to inherit from parent
  return (
    <Avatar2D 
      playerStats={playerStats}
      className={`w-full h-full ${className}`}
    />
  );
}