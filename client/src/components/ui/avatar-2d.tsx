import { User } from "@shared/schema";
import maleAvatarImage from "@assets/IMG_3682_1753213695174.png";
import femaleAvatarImage from "@assets/263F10D0-DF8C-4E30-8FAE-9A934B3A8CB7_1753324678577.png";
import gmAvatarImage from "@assets/B2F9A210-A9F6-446D-8599-3F94975381BA_1753500652794.png";
import robCustomAvatar1 from "@assets/E6AE8982-C943-4154-A8B5-82F592441E5D_1753558358031.jpeg";
import robCustomAvatar2 from "@assets/E6AE8982-C943-4154-A8B5-82F592441E5D_1753559527359.jpeg";
import robCustomAvatar3 from "@assets/E6AE8982-C943-4154-A8B5-82F592441E5D_1753560953692.jpeg";
import robGMAvatar from "@assets/IMG_3731_1753561497035.png";
import legendaryHunterSkin from "@assets/IMG_3775_1753737253422.png";
import legendaryHunterFemaleSkin from "@assets/D230131C-14F5-4DAA-97FC-D1B46D95ED7F_1753833880560.png";

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

  // Map custom avatar URLs to imported assets (only for Rob)
  const getCustomAvatar = (customAvatarUrl: string) => {
    switch (customAvatarUrl) {
      case "/src/assets/IMG_3731_1753561497035.png":  
        return robGMAvatar; // Rob's G.M. warrior avatar
      case "/src/assets/E6AE8982-C943-4154-A8B5-82F592441E5D_1753560953692.jpeg":  
        return robCustomAvatar3; // Rob's previous custom avatar
      case "/src/assets/E6AE8982-C943-4154-A8B5-82F592441E5D_1753559527359.jpeg":  
        return robCustomAvatar2; // Rob's older custom avatar
      default:
        return null;
    }
  };

  // Get the appropriate avatar image based on title, skin ownership, custom avatar, and gender
  const avatarImage = (() => {
    // Debug log for Zero to see what data we're working with
    if (playerData?.username === "Zero") {
      console.log("Zero avatar data:", {
        gender: playerData?.gender,
        title: playerData?.title,
        customAvatarUrl: playerData?.customAvatarUrl
      });
    }
    
    // Check for G.M. avatar selection (when user explicitly selects gm_avatar skin)
    if (playerData?.gender === "gm_avatar") {
      return robGMAvatar; // Use Rob's G.M. avatar image directly
    }
    
    // Check for Legendary Hunter skin (Founders Pack exclusive)
    if (playerData?.title === "The First Flame" || playerData?.hasLegendaryHunterSkin) {
      // Return gender-specific Legendary Hunter skin
      return playerData?.gender === "female" ? legendaryHunterFemaleSkin : legendaryHunterSkin;
    }
    
    // G.M. users with customAvatarUrl pointing to G.M. avatar
    if (playerData?.customAvatarUrl === "/src/assets/IMG_3731_1753561497035.png") {
      return robGMAvatar;
    }
    
    // Other custom avatars for specific users (Rob)
    if (playerData?.customAvatarUrl) {
      return getCustomAvatar(playerData.customAvatarUrl) || (playerData?.gender === "female" ? femaleAvatarImage : maleAvatarImage);
    }
    
    // Default gender-based avatars
    return playerData?.gender === "female" ? femaleAvatarImage : maleAvatarImage;
  })();

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
            filter: `brightness(${0.95 + overallFitness * 0.1}) contrast(${1 + muscleDefinition * 0.1})`,
            imageRendering: 'pixelated',
            transform: playerData?.gender === "female" ? 'scale(0.9)' : 'scale(1)'
          }}
        />
        
        {/* Glow effect overlay removed to eliminate blue aura */}

        

        {/* Fitness accessories based on level - REMOVED red dot indicator */}

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