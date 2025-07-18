import { User } from "@shared/schema";
import avatarImage from "@assets/ChatGPT Image Jul 18, 2025, 02_29_02 PM_1752863551284.png";

interface Avatar2DProps {
  user?: User;
  size?: "sm" | "md" | "lg";
}

export function Avatar2D({ user, size = "md" }: Avatar2DProps) {
  const level = user?.level || 1;
  const strength = user?.strength || 0;
  const stamina = user?.stamina || 0;
  const endurance = user?.endurance || 0;
  const flexibility = user?.flexibility || 0;

  const sizes = {
    sm: { width: 120, height: 180 },
    md: { width: 160, height: 240 },
    lg: { width: 200, height: 300 }
  };

  const { width, height } = sizes[size];

  // Calculate fitness effects for visual overlays
  const muscleDefinition = Math.min(strength / 20, 1);
  const athleticBuild = Math.min((stamina + endurance) / 40, 1);
  const overallFitness = (strength + stamina + endurance + flexibility) / 80;

  return (
    <div className="flex justify-center items-center relative">
      <div 
        className="relative rounded-lg overflow-hidden shadow-lg"
        style={{ width, height }}
      >
        {/* Main character image */}
        <img 
          src={avatarImage}
          alt="Character Avatar"
          className="w-full h-full object-cover"
          style={{
            filter: `brightness(${0.9 + overallFitness * 0.3}) contrast(${1 + muscleDefinition * 0.2})`
          }}
        />
        
        {/* Glow effect overlay based on fitness level */}
        <div 
          className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-transparent"
          style={{
            background: `radial-gradient(circle at center, rgba(99, 102, 241, ${athleticBuild * 0.2}) 0%, rgba(168, 85, 247, ${muscleDefinition * 0.15}) 50%, transparent 70%)`,
            mixBlendMode: 'overlay'
          }}
        />

        {/* Level indicator */}
        <div className="absolute top-2 right-2">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full border-2 border-yellow-400 shadow-lg">
            <span className="text-white text-xs font-bold">
              {level}
            </span>
          </div>
        </div>

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