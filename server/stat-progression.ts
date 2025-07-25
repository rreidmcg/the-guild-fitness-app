// Individual stat progression system
// Each stat (Strength, Stamina, Agility) has its own XP and level progression

export interface StatProgress {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  totalXpForCurrentLevel: number;
}

// Calculate XP required for a specific stat level
// Uses same exponential formula as character levels: level^2 * 100
export function getStatXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(Math.pow(level - 1, 2) * 100);
}

// Calculate stat level from total XP
export function calculateStatLevel(totalXp: number): number {
  if (totalXp < 0) return 0;
  
  let level = 1;
  let xpRequired = 0;
  
  while (xpRequired <= totalXp) {
    level++;
    xpRequired = getStatXpRequiredForLevel(level);
  }
  
  return level - 1;
}

// Get detailed stat progression info
export function getStatProgress(totalXp: number): StatProgress {
  const currentLevel = calculateStatLevel(totalXp);
  const xpForCurrentLevel = getStatXpRequiredForLevel(currentLevel);
  const xpForNextLevel = getStatXpRequiredForLevel(currentLevel + 1);
  
  return {
    level: currentLevel,
    currentXp: totalXp - xpForCurrentLevel,
    xpToNextLevel: xpForNextLevel - totalXp,
    totalXpForCurrentLevel: xpForNextLevel - xpForCurrentLevel
  };
}

// Calculate stat gains from workout (now returns XP instead of direct stat points)
export function calculateStatXpGains(sessionData: any): {
  strengthXp: number;
  staminaXp: number;
  agilityXp: number;
} {
  // Base XP calculation - can be expanded based on workout complexity
  const baseDuration = sessionData.duration || 0; // minutes
  const baseVolume = sessionData.totalVolume || 0;
  
  // Calculate base XP from workout effort
  const baseXp = Math.floor(baseDuration * 10 + baseVolume * 0.1);
  
  // Distribute XP based on workout type
  // For now, distribute evenly across all stats
  // Future: analyze workout exercises to determine stat focus
  const strengthXp = Math.floor(baseXp * 0.4);
  const staminaXp = Math.floor(baseXp * 0.4);
  const agilityXp = Math.floor(baseXp * 0.2);
  
  return {
    strengthXp,
    staminaXp,
    agilityXp
  };
}