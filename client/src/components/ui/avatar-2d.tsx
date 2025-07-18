import { User } from "@shared/schema";

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

  // Calculate muscle definition based on strength
  const muscleDefinition = Math.min(strength / 20, 1); // 0-1 scale
  const athleticBuild = Math.min((stamina + endurance) / 40, 1); // 0-1 scale
  const posture = Math.min(flexibility / 15, 1); // 0-1 scale

  const sizes = {
    sm: { width: 120, height: 180, scale: 0.6 },
    md: { width: 160, height: 240, scale: 0.8 },
    lg: { width: 200, height: 300, scale: 1 }
  };

  const { width, height, scale } = sizes[size];

  // Color variations based on fitness level
  const skinTone = "#FDBCB4";
  const hairColor = "#8B4513";
  const shirtColor = level < 5 ? "#4A5568" : level < 10 ? "#2B6CB0" : "#7C2D12";
  const shortsColor = "#2D3748";

  return (
    <div className="flex justify-center items-center">
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 200 300" 
        className="drop-shadow-lg"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Background circle */}
        <circle
          cx="100"
          cy="150"
          r="90"
          fill="url(#avatarBg)"
          opacity="0.3"
        />

        {/* Define gradients */}
        <defs>
          <radialGradient id="avatarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(243, 75%, 59%)" />
            <stop offset="100%" stopColor="hsl(258, 70%, 60%)" />
          </radialGradient>
          <linearGradient id="muscleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={skinTone} />
            <stop offset="100%" stopColor="#E2A88B" />
          </linearGradient>
        </defs>

        {/* Head */}
        <ellipse
          cx="100"
          cy="80"
          rx="25"
          ry="30"
          fill={skinTone}
          stroke="#D69E2E"
          strokeWidth="1"
        />

        {/* Hair */}
        <ellipse
          cx="100"
          cy="65"
          rx="28"
          ry="20"
          fill={hairColor}
        />

        {/* Eyes */}
        <circle cx="92" cy="75" r="2" fill="#2D3748" />
        <circle cx="108" cy="75" r="2" fill="#2D3748" />

        {/* Smile */}
        <path
          d="M 90 85 Q 100 90 110 85"
          stroke="#2D3748"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Neck */}
        <rect
          x="95"
          y="105"
          width="10"
          height="15"
          fill={skinTone}
        />

        {/* Torso - Athletic build affects width */}
        <ellipse
          cx="100"
          cy="160"
          rx={20 + athleticBuild * 8}
          ry="35"
          fill={shirtColor}
          opacity="0.9"
        />

        {/* Arms - Muscle definition affects size */}
        <ellipse
          cx="75"
          cy="145"
          rx={6 + muscleDefinition * 4}
          ry="25"
          fill="url(#muscleGradient)"
          transform="rotate(-15 75 145)"
        />
        <ellipse
          cx="125"
          cy="145"
          rx={6 + muscleDefinition * 4}
          ry="25"
          fill="url(#muscleGradient)"
          transform="rotate(15 125 145)"
        />

        {/* Hands */}
        <circle cx="68" cy="165" r="4" fill={skinTone} />
        <circle cx="132" cy="165" r="4" fill={skinTone} />

        {/* Legs */}
        <ellipse
          cx="88"
          cy="220"
          rx="8"
          ry="30"
          fill={shortsColor}
        />
        <ellipse
          cx="112"
          cy="220"
          rx="8"
          ry="30"
          fill={shortsColor}
        />

        {/* Lower legs */}
        <ellipse
          cx="88"
          cy="270"
          rx="6"
          ry="20"
          fill={skinTone}
        />
        <ellipse
          cx="112"
          cy="270"
          rx="6"
          ry="20"
          fill={skinTone}
        />

        {/* Feet */}
        <ellipse
          cx="88"
          cy="290"
          rx="8"
          ry="4"
          fill="#1A202C"
        />
        <ellipse
          cx="112"
          cy="290"
          rx="8"
          ry="4"
          fill="#1A202C"
        />

        {/* Fitness accessories based on level */}
        {level >= 5 && (
          <>
            {/* Wristbands */}
            <rect x="65" y="160" width="6" height="3" fill="#E53E3E" />
            <rect x="129" y="160" width="6" height="3" fill="#E53E3E" />
          </>
        )}

        {level >= 10 && (
          <>
            {/* Champion headband */}
            <rect x="80" y="62" width="40" height="4" fill="#D69E2E" />
          </>
        )}

        {/* Level indicator */}
        <circle
          cx="140"
          cy="60"
          r="15"
          fill="hsl(243, 75%, 59%)"
          stroke="#D69E2E"
          strokeWidth="2"
        />
        <text
          x="140"
          y="65"
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
        >
          {level}
        </text>
      </svg>
    </div>
  );
}