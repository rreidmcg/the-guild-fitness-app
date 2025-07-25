/**
 * Title rarity system for Dumbbells & Dragons
 * Defines color coding for titles based on rarity tiers
 */

export interface TitleRarity {
  color: string;
  bgColor: string;
  borderColor: string;
  rarity: string;
}

export const getTitleRarity = (title: string): TitleRarity => {
  // G.M. title is highest rarity (red/relic)
  if (title === "G.M.") {
    return {
      color: "text-red-300",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-400/40",
      rarity: "relic"
    };
  }

  // Define title rarities based on progression
  const titleRarities: Record<string, TitleRarity> = {
    // Common titles (white) - starter titles
    "Recruit": {
      color: "text-gray-100",
      bgColor: "bg-gray-500/20",
      borderColor: "border-gray-400/40",
      rarity: "common"
    },
    "Fitness Novice": {
      color: "text-gray-100",
      bgColor: "bg-gray-500/20",
      borderColor: "border-gray-400/40",
      rarity: "common"
    },

    // Uncommon titles (green) - early progression
    "Fitness Apprentice": {
      color: "text-green-300",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-400/40",
      rarity: "uncommon"
    },
    "Iron Novice": {
      color: "text-green-300",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-400/40",
      rarity: "uncommon"
    },

    // Rare titles (blue) - mid progression
    "Fitness Warrior": {
      color: "text-blue-300",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-400/40",
      rarity: "rare"
    },
    "Iron Warrior": {
      color: "text-blue-300",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-400/40",
      rarity: "rare"
    },
    "Fitness Veteran": {
      color: "text-blue-300",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-400/40",
      rarity: "rare"
    },

    // Epic titles (purple) - high progression
    "Fitness Champion": {
      color: "text-purple-300",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-400/40",
      rarity: "epic"
    },
    "Iron Champion": {
      color: "text-purple-300",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-400/40",
      rarity: "epic"
    },
    "Fitness Master": {
      color: "text-purple-300",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-400/40",
      rarity: "epic"
    },

    // Legendary titles (yellow) - very high progression
    "Fitness Grandmaster": {
      color: "text-yellow-300",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-400/40",
      rarity: "legendary"
    },
    "Iron Grandmaster": {
      color: "text-yellow-300",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-400/40",
      rarity: "legendary"
    },
    "Fitness Legend": {
      color: "text-yellow-300",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-400/40",
      rarity: "legendary"
    },

    // Mythic titles (orange) - elite progression
    "Fitness Mythic": {
      color: "text-orange-300",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-400/40",
      rarity: "mythic"
    },
    "Iron Mythic": {
      color: "text-orange-300",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-400/40",
      rarity: "mythic"
    },
    "Fitness Godlike": {
      color: "text-orange-300",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-400/40",
      rarity: "mythic"
    },
  };

  // Return the title's rarity or default to common
  return titleRarities[title] || {
    color: "text-gray-100",
    bgColor: "bg-gray-500/20",
    borderColor: "border-gray-400/40",
    rarity: "common"
  };
};

export const getTitleComponent = (title: string, size: "sm" | "md" | "lg" = "sm") => {
  const rarity = getTitleRarity(title);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  return {
    className: `${sizeClasses[size]} ${rarity.color} ${rarity.bgColor} rounded-full border ${rarity.borderColor} font-medium`,
    rarity: rarity.rarity
  };
};