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
  // Exponential formula with stat squish: level^2.5 * 10 (reduced from 50)
  // This creates strong diminishing returns like real athletic development
  return Math.floor(Math.pow(level - 1, 2.5) * 10);
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
  // Use already calculated XP from completed sets
  const baseXp = sessionData.xpEarned || 50;
  
  // If we have exercises data, calculate more precise stat distribution
  if (sessionData.exercises && Array.isArray(sessionData.exercises)) {
    let strengthSets = 0, staminaSets = 0, agilitySets = 0;
    let totalCompletedSets = 0;
    
    sessionData.exercises.forEach((exercise: any) => {
      const category = exercise.category || 'strength';
      if (exercise.sets && Array.isArray(exercise.sets)) {
        exercise.sets.forEach((set: any) => {
          if (set.completed) {
            totalCompletedSets++;
            // Distribute sets based on exercise category
            if (category === 'strength' || category === 'powerlifting') {
              strengthSets++;
            } else if (category === 'cardio' || category === 'endurance') {
              staminaSets++;
            } else if (category === 'plyometric' || category === 'agility') {
              agilitySets++;
            } else {
              // Default mixed distribution for other categories
              strengthSets += 0.5;
              staminaSets += 0.3;
              agilitySets += 0.2;
            }
          }
        });
      }
    });
    
    if (totalCompletedSets > 0) {
      // Distribute XP based on actual exercise composition
      const strengthXp = Math.floor(baseXp * (strengthSets / totalCompletedSets));
      const staminaXp = Math.floor(baseXp * (staminaSets / totalCompletedSets));
      const agilityXp = Math.floor(baseXp * (agilitySets / totalCompletedSets));
      
      return { strengthXp, staminaXp, agilityXp };
    }
  }
  
  // Fallback to original logic if no exercises data
  const baseDuration = sessionData.duration || 30;
  const baseVolume = sessionData.totalVolume || 0;
  
  // Distribute XP based on workout type with realistic athletic focus
  // Detect workout type based on volume vs duration ratio
  const isCardioWorkout = baseVolume < (baseDuration * 20); // Less than 20 lbs per minute = cardio
  
  let strengthXp, staminaXp, agilityXp;
  
  if (isCardioWorkout) {
    // Cardio workout: Running, cycling, swimming, etc.
    // 10% strength, 70% stamina, 20% agility
    strengthXp = Math.floor(baseXp * 0.10);
    staminaXp = Math.floor(baseXp * 0.70);
    agilityXp = Math.floor(baseXp * 0.20);
  } else {
    // Strength training: Weight lifting, resistance training
    // 50% strength, 30% stamina, 20% agility
    strengthXp = Math.floor(baseXp * 0.50);
    staminaXp = Math.floor(baseXp * 0.30);
    agilityXp = Math.floor(baseXp * 0.20);
  }
  
  return {
    strengthXp,
    staminaXp,
    agilityXp
  };
}