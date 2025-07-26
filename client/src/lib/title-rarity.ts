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
  // G.M. title is highest rarity (red/relic) - check for both formats
  if (title === "<G.M.>" || title === "G.M.") {
    return {
      color: "text-red-300",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-400/40",
      rarity: "relic"
    };
  }

  // Define title rarities based on dungeon rank completion
  const titleRarities: Record<string, TitleRarity> = {
    // No title option
    "No Title": {
      color: "text-gray-500",
      bgColor: "bg-gray-600/10",
      borderColor: "border-gray-500/30",
      rarity: "none"
    },
    
    // Default starting title
    "Recruit": {
      color: "text-gray-100",
      bgColor: "bg-gray-500/20",
      borderColor: "border-gray-400/40",
      rarity: "common"
    },

    // E-Rank Dungeon Completion Titles (White/Common)
    "E-Rank Survivor": {
      color: "text-gray-100",
      bgColor: "bg-gray-500/20",
      borderColor: "border-gray-400/40",
      rarity: "common"
    },
    "Novice Adventurer": {
      color: "text-gray-100",
      bgColor: "bg-gray-500/20",
      borderColor: "border-gray-400/40",
      rarity: "common"
    },

    // D-Rank Dungeon Completion Titles (Green/Uncommon)
    "D-Rank Conqueror": {
      color: "text-green-300",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-400/40",
      rarity: "uncommon"
    },
    "Dungeon Walker": {
      color: "text-green-300",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-400/40",
      rarity: "uncommon"
    },

    // C-Rank Dungeon Completion Titles (Blue/Rare)
    "C-Rank Vanquisher": {
      color: "text-blue-300",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-400/40",
      rarity: "rare"
    },
    "Monster Hunter": {
      color: "text-blue-300",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-400/40",
      rarity: "rare"
    },
    "Fitness Warrior": {
      color: "text-blue-300",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-400/40",
      rarity: "rare"
    },

    // B-Rank Dungeon Completion Titles (Purple/Epic) - Locked
    "B-Rank Champion": {
      color: "text-purple-300",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-400/40",
      rarity: "epic"
    },
    "Elite Slayer": {
      color: "text-purple-300",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-400/40",
      rarity: "epic"
    },

    // A-Rank Dungeon Completion Titles (Yellow/Legendary) - Locked
    "A-Rank Legend": {
      color: "text-yellow-300",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-400/40",
      rarity: "legendary"
    },
    "Apex Predator": {
      color: "text-yellow-300",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-400/40",
      rarity: "legendary"
    },

    // S-Rank Dungeon Completion Titles (Orange/Mythic) - Locked
    "S-Rank Dominator": {
      color: "text-orange-300",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-400/40",
      rarity: "mythic"
    },
    "Mythic Destroyer": {
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

export const getTitleComponent = (title: string | null, size: "sm" | "md" | "lg" = "sm") => {
  // Handle null/empty title case
  const displayTitle = title || "No Title";
  const rarity = getTitleRarity(displayTitle);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  return {
    className: `${sizeClasses[size]} ${rarity.color} ${rarity.bgColor} rounded-full border ${rarity.borderColor} font-medium`,
    rarity: rarity.rarity,
    displayTitle
  };
};