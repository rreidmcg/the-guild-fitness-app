// Individual stat progression system
// Each stat (Strength, Stamina, Agility) has its own XP and level progression

export interface StatProgress {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  totalXpForCurrentLevel: number;
}

// Calculate XP required for a specific stat level
// Uses realistic athletic progression with diminishing returns
// Early levels are fast (noob gains), later levels require exponentially more XP
export function getStatXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  // Exponential formula mimicking real strength gains: level^2.5 * 50
  // This creates strong diminishing returns like real athletic development
  return Math.floor(Math.pow(level - 1, 2.5) * 50);
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
  // Base XP calculation based on workout effort and duration
  const baseDuration = sessionData.duration || 30; // minutes
  const baseVolume = sessionData.totalVolume || 1000; // total weight lifted
  
  // Calculate base XP from workout effort (reduced for slower, more realistic progression)
  // Duration: reduced XP per minute, Volume: reduced XP per pound lifted
  const durationXp = baseDuration * 3; // 3 XP per minute (90 XP for 30 min workout)
  const volumeXp = Math.floor(baseVolume * 0.02); // 20 XP for 1000 lbs total volume
  const baseXp = durationXp + volumeXp;
  
  // Distribute XP based on workout type with realistic athletic focus
  // Strength training: 50% strength, 30% stamina, 20% agility
  // This mimics how real strength training primarily builds strength with secondary benefits
  const strengthXp = Math.floor(baseXp * 0.50);
  const staminaXp = Math.floor(baseXp * 0.30);
  const agilityXp = Math.floor(baseXp * 0.20);
  
  return {
    strengthXp,
    staminaXp,
    agilityXp
  };
}