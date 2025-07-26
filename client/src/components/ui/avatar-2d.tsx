import { User } from "@shared/schema";
import maleAvatarImage from "@assets/IMG_3682_1753213695174.png";
import femaleAvatarImage from "@assets/263F10D0-DF8C-4E30-8FAE-9A934B3A8CB7_1753324678577.png";
import gmAvatarImage from "@assets/B2F9A210-A9F6-446D-8599-3F94975381BA_1753500652794.png";

interface Avatar2DProps {
  user?: User;
  playerStats?: any; // For leaderboard data that may have different structure
  size?: number | "sm" | "md" | "lg";
  className?: string;
}

export function Avatar2D({ user, playerStats, size = "md", className }: Avatar2DProps) {
  // Use playerStats if provided (for leaderboard), otherwise use user
  const playerData = playerStats || user;
  
  const level = playerData?.level || 1;
  const strength = playerData?.strength || 0;
  const stamina = playerData?.stamina || 0;
  const agility = playerData?.agility || 0;

  // Handle both string and number sizes
  let width: number, height: number;
  
  if (typeof size === "number") {
    width = size;
    height = Math.floor(size * 1.5); // Maintain aspect ratio
  } else {
    const sizes = {
      sm: { width: 120, height: 180 },
      md: { width: 160, height: 240 },
      lg: { width: 200, height: 300 }
    };
    ({ width, height } = sizes[size]);
  }

  // Get the appropriate avatar image based on title and gender
  const avatarImage = playerData?.title === "<G.M.>" 
    ? gmAvatarImage 
    : playerData?.gender === "female" 
      ? femaleAvatarImage 
      : maleAvatarImage;

  // Calculate fitness effects for visual overlays
  const muscleDefinition = Math.min(strength / 20, 1);
  const athleticBuild = Math.min(stamina / 20, 1);
  const explosiveness = Math.min(agility / 20, 1);
  const overallFitness = (strength + stamina + agility) / 60;

  return (
    <div className={`flex justify-center items-center relative ${className || ""}`}>
      <div 
        className="relative rounded-lg overflow-hidden shadow-lg"
        style={{ width, height }}
      >
        {/* Main character image */}
        <img 
          src={avatarImage}
          alt="Character Avatar"
          className="w-full h-full object-contain"
          style={{
            filter: `brightness(${0.9 + overallFitness * 0.3}) contrast(${1 + muscleDefinition * 0.2})`,
            imageRendering: 'pixelated',
            transform: playerData?.gender === "female" ? 'scale(0.9)' : 'scale(1)'
          }}
        />
        
        {/* Glow effect overlay based on fitness level */}
        <div 
          className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-transparent"
          style={{
            background: `radial-gradient(circle at center, rgba(239, 68, 68, ${muscleDefinition * 0.15}) 0%, rgba(34, 197, 94, ${athleticBuild * 0.15}) 30%, rgba(168, 85, 247, ${explosiveness * 0.15}) 60%, transparent 80%)`,
            mixBlendMode: 'overlay'
          }}
        />

        

        {/* Fitness accessories based on level */}
        {level >= 5 && (
          <div className="absolute bottom-2 left-2">
            <div className="w-2 h-2 bg-red-500 rounded-full shadow-lg animate-pulse" title="Fitness Gear Unlocked" />
          </div>
        )}

        {level >= 10 && (
          <div className="absolute top-2 left-2">
            <div className="w-6 h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-lg" title="Champion Status" />
          </div>
        )}

        {/* Progress aura effect for high-level characters */}
        {level >= 15 && (
          <div 
            className="absolute inset-0 rounded-lg"
            style={{
              boxShadow: `0 0 20px rgba(255, 215, 0, ${overallFitness * 0.4}), 0 0 40px rgba(255, 215, 0, ${overallFitness * 0.2})`
            }}
          />
        )}
      </div>
    </div>
  );
}