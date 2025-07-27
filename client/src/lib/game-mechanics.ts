import { allocateXP, allocateSessionXP, type ActivityInput } from "@shared/stat-allocation";

export interface LevelInfo {
  level: number;
  xpRequired: number;
  xpForNext: number;
  title: string;
}

export interface StatGains {
  strength: number;
  stamina: number;
  agility: number;
}

// Calculate XP required for a specific level using exponential formula
function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  // Exponential formula with stat squish: level^1.8 * 16 (reduced from 82)
  // This creates a curve where early levels are fast, later levels take much longer
  // Same progression timeline with 80% smaller numbers
  return Math.floor(Math.pow(level - 1, 1.8) * 16);
}

// Calculate level from total XP
function getLevelFromXp(totalXp: number): number {
  if (totalXp < 0) return 1;
  
  let level = 1;
  let xpRequired = 0;
  
  while (xpRequired <= totalXp) {
    level++;
    xpRequired = getXpRequiredForLevel(level);
  }
  
  return level - 1;
}

export function calculateLevel(experience: number): LevelInfo {
  const level = getLevelFromXp(experience);
  const xpRequired = getXpRequiredForLevel(level);
  const xpForNext = getXpRequiredForLevel(level + 1);
  
  const titles = [
    "Novice", "Apprentice", "Warrior", "Veteran", "Champion", 
    "Master", "Grandmaster", "Legend", "Mythic", "Godlike"
  ];
  
  const titleIndex = Math.min(Math.floor(level / 5), titles.length - 1);
  const title = titles[titleIndex];
  
  return {
    level,
    xpRequired,
    xpForNext,
    title
  };
}

/**
 * Calculate XP and stat gains using the sophisticated stat allocation engine
 */
export function calculateWorkoutRewards(
  exercisePerformances: Array<{
    exerciseId: number;
    exercise: { category: string; statTypes: { strength?: number; stamina?: number; agility?: number } };
    sets: Array<{ reps: number; weight?: number; duration?: number; completed: boolean }>;
  }>,
  duration: number,
  userBodyweight: number,
  perceivedEffort: number = 7
): { xpGained: number; statGains: StatGains } {
  
  // Convert exercise performances to activities for the stat allocation engine
  const activities: ActivityInput[] = exercisePerformances.flatMap(performance => {
    return performance.sets
      .filter(set => set.completed)
      .map(set => {
        const activity: ActivityInput = {
          movement_type: getMovementType(performance.exercise.category),
          bodyweight_kg: userBodyweight * 0.453592, // Convert lbs to kg if needed
          RPE: perceivedEffort
        };

        if (performance.exercise.category === "strength" || performance.exercise.category === "core") {
          activity.sets = 1; // Each set is processed individually
          activity.reps = set.reps;
          activity.load_kg = set.weight ? set.weight * 0.453592 : userBodyweight * 0.453592;
          activity.interval_seconds = estimateSetDuration(set.reps, set.weight);
        } else {
          activity.minutes = set.duration ? set.duration / 60 : estimateExerciseDuration(performance.exercise.category, set.reps);
          activity.interval_seconds = set.duration || estimateExerciseDuration(performance.exercise.category, set.reps) * 60;
        }

        return activity;
      });
  });

  // Calculate session rewards using the stat allocation engine
  const sessionResults = allocateSessionXP(activities);

  return {
    xpGained: sessionResults.xp_total,
    statGains: {
      strength: sessionResults.xp_str,
      stamina: sessionResults.xp_sta,
      agility: sessionResults.xp_agi
    }
  };
}

/**
 * Map exercise categories to movement types for the stat allocation engine
 */
function getMovementType(category: string): "resistance" | "cardio" | "skill" {
  switch (category.toLowerCase()) {
    case "strength":
    case "core":
      return "resistance";
    case "cardio":
      return "cardio";
    case "plyometric":
    case "olympic":
    case "flexibility":
      return "skill";
    default:
      return "skill";
  }
}

/**
 * Estimate duration for a resistance training set
 */
function estimateSetDuration(reps: number, weight?: number): number {
  const baseTimePerRep = weight && weight > 0 ? 3 : 2; // Heavier weights take longer
  return reps * baseTimePerRep + 30; // Include setup time
}

/**
 * Estimate duration for cardio/skill exercises
 */
function estimateExerciseDuration(category: string, reps: number): number {
  switch (category.toLowerCase()) {
    case "cardio":
      return Math.max(reps * 0.5, 5); // Minimum 5 minutes for cardio
    case "plyometric":
      return reps * 0.1; // Short bursts
    case "flexibility":
      return Math.max(reps * 0.5, 10); // Longer holds
    default:
      return reps * 0.2;
  }
}

/**
 * Legacy function for simple XP calculation (fallback)
 */
export function calculateXPReward(duration: number, totalVolume: number, exerciseCount: number): number {
  const baseDurationXP = Math.floor(duration / 5) * 10;
  const baseVolumeXP = Math.floor(totalVolume / 100) * 5;
  const baseExerciseXP = exerciseCount * 15;
  
  return Math.max(baseDurationXP + baseVolumeXP + baseExerciseXP, 50);
}

/**
 * Legacy function for simple stat calculation (fallback)
 */
export function calculateStatGains(workoutType: string, duration: number, intensity: number): StatGains {
  const baseDuration = Math.floor(duration / 10);
  const intensityMultiplier = intensity / 100;
  
  const baseGains = {
    strength: 0,
    stamina: 0,
    agility: 0
  };
  
  switch (workoutType.toLowerCase()) {
    case 'strength':
      baseGains.strength = Math.floor((baseDuration * 2 + intensityMultiplier * 3));
      baseGains.stamina = Math.floor((baseDuration * 0.5));
      break;
    case 'cardio':
      baseGains.stamina = Math.floor((baseDuration * 2 + intensityMultiplier * 3));
      baseGains.agility = Math.floor((baseDuration * 1));
      break;
    case 'plyometric':
      baseGains.agility = Math.floor((baseDuration * 2 + intensityMultiplier * 3));
      baseGains.strength = Math.floor((baseDuration * 1));
      break;
    default:
      baseGains.strength = Math.floor((baseDuration * 1));
      baseGains.stamina = Math.floor((baseDuration * 1));
      baseGains.agility = Math.floor((baseDuration * 0.5));
  }
  
  // Ensure minimum gains
  Object.keys(baseGains).forEach(key => {
    if (baseGains[key as keyof StatGains] < 1) {
      baseGains[key as keyof StatGains] = 1;
    }
  });
  
  return baseGains;
}

export function calculateTotalVolume(exercises: Array<{ sets: Array<{ reps: number; weight?: number }> }>): number {
  return exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
      return setTotal + (set.reps * (set.weight || 0));
    }, 0);
    return total + exerciseVolume;
  }, 0);
}

export function detectPersonalRecord(
  exerciseId: number, 
  newValue: number, 
  recordType: string, 
  previousRecords: Array<{ exerciseId: number; recordType: string; value: number }>
): boolean {
  const existingRecord = previousRecords.find(
    record => record.exerciseId === exerciseId && record.recordType === recordType
  );
  
  if (!existingRecord) {
    return true; // First time doing this exercise
  }
  
  return newValue > existingRecord.value;
}
