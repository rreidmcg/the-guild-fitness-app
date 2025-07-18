export interface LevelInfo {
  level: number;
  xpRequired: number;
  xpForNext: number;
  title: string;
}

export interface StatGains {
  strength: number;
  stamina: number;
  endurance: number;
  flexibility: number;
}

export function calculateLevel(experience: number): LevelInfo {
  const level = Math.floor(experience / 1000) + 1;
  const xpRequired = (level - 1) * 1000;
  const xpForNext = level * 1000;
  
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

export function calculateXPReward(duration: number, totalVolume: number, exerciseCount: number): number {
  const baseDurationXP = Math.floor(duration / 5) * 10; // 10 XP per 5 minutes
  const baseVolumeXP = Math.floor(totalVolume / 100) * 5; // 5 XP per 100 lbs
  const baseExerciseXP = exerciseCount * 15; // 15 XP per exercise
  
  return Math.max(baseDurationXP + baseVolumeXP + baseExerciseXP, 50); // Minimum 50 XP
}

export function calculateStatGains(workoutType: string, duration: number, intensity: number): StatGains {
  const baseDuration = Math.floor(duration / 10); // Base stat gain per 10 minutes
  const intensityMultiplier = intensity / 100;
  
  const baseGains = {
    strength: 0,
    stamina: 0,
    endurance: 0,
    flexibility: 0
  };
  
  switch (workoutType.toLowerCase()) {
    case 'strength':
      baseGains.strength = Math.floor((baseDuration * 2 + intensityMultiplier * 3));
      baseGains.stamina = Math.floor((baseDuration * 0.5));
      break;
    case 'cardio':
      baseGains.endurance = Math.floor((baseDuration * 2 + intensityMultiplier * 3));
      baseGains.stamina = Math.floor((baseDuration * 1.5));
      break;
    case 'flexibility':
      baseGains.flexibility = Math.floor((baseDuration * 2 + intensityMultiplier * 2));
      baseGains.endurance = Math.floor((baseDuration * 0.5));
      break;
    case 'core':
      baseGains.strength = Math.floor((baseDuration * 1));
      baseGains.endurance = Math.floor((baseDuration * 1));
      baseGains.flexibility = Math.floor((baseDuration * 0.5));
      break;
    default:
      // Mixed workout
      baseGains.strength = Math.floor((baseDuration * 1));
      baseGains.stamina = Math.floor((baseDuration * 1));
      baseGains.endurance = Math.floor((baseDuration * 1));
      baseGains.flexibility = Math.floor((baseDuration * 0.5));
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
