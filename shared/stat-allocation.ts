/**
 * Stat Allocation Engine for RPG Fitness App
 * Calculates XP and distributes it across Strength, Stamina, and Agility
 * based on exercise type and energy system classification
 */

export interface ActivityInput {
  movement_type: "resistance" | "cardio" | "skill";
  sets?: number; // resistance only
  reps?: number; // resistance only
  load_kg?: number; // resistance only
  bodyweight_kg: number; // user body mass
  minutes?: number; // duration for cardio/skill
  RPE: number; // 1-10 perceived effort scale
  interval_seconds?: number; // length of work burst
  average_HR_pct?: number; // optional, % of HRmax
}

export interface XPAllocation {
  xp_total: number;
  xp_str: number;
  xp_sta: number;
  xp_agi: number;
  energy_code: "P" | "G" | "M" | "O" | "R";
}

interface EnergySystemSplit {
  str: number;
  sta: number;
  agi: number;
}

// Energy system XP distribution percentages
const ENERGY_SPLITS: Record<string, EnergySystemSplit> = {
  P: { str: 0.65, sta: 0.15, agi: 0.20 }, // ATP-PC (≤10s or >95% HRmax)
  G: { str: 0.40, sta: 0.40, agi: 0.20 }, // Anaerobic glycolytic (10s-120s or 90-95% HRmax)
  M: { str: 0.25, sta: 0.55, agi: 0.20 }, // Mixed glycolytic→aerobic (120s-360s or 75-90% HRmax)
  O: { str: 0.10, sta: 0.80, agi: 0.10 }, // Aerobic oxidative (>360s or <75% HRmax)
  R: { str: 0.05, sta: 0.25, agi: 0.70 }  // Recovery/skill (RPE ≤5 and HR <65%)
};

// RPE multipliers for effort scaling
const RPE_MULTIPLIERS: Record<number, number> = {
  1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5,
  6: 1.0, 7: 1.0,
  8: 1.5, 9: 1.5,
  10: 2.0
};

// Base XP multiplier (adjustable during playtesting)
// Reduced from 10 to 2 to slow progression for long-term engagement
const BASE_XP_MULTIPLIER = 2;

/**
 * Calculates work units based on exercise type
 */
function calculateWorkUnits(activity: ActivityInput): number {
  if (activity.movement_type === "resistance") {
    const sets = activity.sets || 0;
    const reps = activity.reps || 0;
    const load_kg = activity.load_kg || activity.bodyweight_kg;
    const load_ratio = load_kg / activity.bodyweight_kg;
    
    return sets * reps * load_ratio;
  } else {
    // Cardio or skill
    return activity.minutes || 0;
  }
}

/**
 * Determines energy system classification based on duration and heart rate
 */
function classifyEnergySystem(activity: ActivityInput): "P" | "G" | "M" | "O" | "R" {
  const { interval_seconds, average_HR_pct, minutes, RPE } = activity;
  
  // Recovery classification first (overrides other conditions)
  if (RPE <= 5 && average_HR_pct && average_HR_pct < 65) {
    return "R";
  }
  
  // Heart rate based classification (if available)
  if (average_HR_pct) {
    if (average_HR_pct > 95) return "P";
    if (average_HR_pct >= 90) return "G";
    if (average_HR_pct >= 75) return "M";
    if (average_HR_pct < 75) return "O";
  }
  
  // Interval duration based classification
  if (interval_seconds) {
    if (interval_seconds <= 10) return "P";
    if (interval_seconds <= 120) return "G";
    if (interval_seconds <= 360) return "M";
    return "O";
  }
  
  // Fallback to total duration (in minutes)
  if (minutes) {
    if (minutes <= 0.17) return "P"; // ≤10 seconds
    if (minutes <= 2) return "G";
    if (minutes <= 6) return "M";
    return "O";
  }
  
  // Default fallback for resistance training without duration
  if (activity.movement_type === "resistance") {
    return "P"; // Most resistance training is ATP-PC dominant
  }
  
  return "O"; // Conservative fallback
}

/**
 * Main function to allocate XP based on activity input
 */
export function allocateXP(activity: ActivityInput): XPAllocation {
  // 1. Calculate work units
  const workUnits = calculateWorkUnits(activity);
  
  // 2. Apply RPE multiplier
  const rpeMultiplier = RPE_MULTIPLIERS[Math.round(activity.RPE)] || 1.0;
  const effortScore = workUnits * rpeMultiplier;
  
  // 3. Calculate base XP
  const baseXP = Math.round(effortScore * BASE_XP_MULTIPLIER);
  
  // 4. Classify energy system
  const energyCode = classifyEnergySystem(activity);
  
  // 5. Split XP according to energy system
  const split = ENERGY_SPLITS[energyCode];
  const xp_str = Math.round(baseXP * split.str);
  const xp_sta = Math.round(baseXP * split.sta);
  const xp_agi = Math.round(baseXP * split.agi);
  
  return {
    xp_total: baseXP,
    xp_str,
    xp_sta,
    xp_agi,
    energy_code: energyCode
  };
}

/**
 * Batch process multiple activities and aggregate results
 */
export function allocateSessionXP(activities: ActivityInput[]): XPAllocation {
  const results = activities.map(allocateXP);
  
  const totalXP = results.reduce((sum, r) => sum + r.xp_total, 0);
  const totalSTR = results.reduce((sum, r) => sum + r.xp_str, 0);
  const totalSTA = results.reduce((sum, r) => sum + r.xp_sta, 0);
  const totalAGI = results.reduce((sum, r) => sum + r.xp_agi, 0);
  
  // Determine dominant energy system for the session
  const energyCounts = results.reduce((counts, r) => {
    counts[r.energy_code] = (counts[r.energy_code] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  const dominantEnergy = Object.entries(energyCounts)
    .sort(([,a], [,b]) => b - a)[0][0] as "P" | "G" | "M" | "O" | "R";
  
  return {
    xp_total: totalXP,
    xp_str: totalSTR,
    xp_sta: totalSTA,
    xp_agi: totalAGI,
    energy_code: dominantEnergy
  };
}

/**
 * Apply daily caps and modifications (extensibility feature)
 */
export function applyDailyCaps(dailyXP: XPAllocation[], currentAllocation: XPAllocation): XPAllocation {
  const dailyTotal = dailyXP.reduce((sum, xp) => sum + xp.xp_total, 0) + currentAllocation.xp_total;
  const dailyOCode = dailyXP.filter(xp => xp.energy_code === "O").reduce((sum, xp) => sum + xp.xp_total, 0);
  
  // Cap daily STA gain if more than 80% of XP comes from O-code sessions
  const oCodePercentage = dailyOCode / dailyTotal;
  if (oCodePercentage > 0.80 && currentAllocation.energy_code === "O") {
    const cappedSTAGain = Math.round(currentAllocation.xp_sta * 0.7); // Reduce STA gain by 30%
    const difference = currentAllocation.xp_sta - cappedSTAGain;
    
    return {
      ...currentAllocation,
      xp_sta: cappedSTAGain,
      xp_str: currentAllocation.xp_str + Math.round(difference * 0.3),
      xp_agi: currentAllocation.xp_agi + Math.round(difference * 0.7)
    };
  }
  
  return currentAllocation;
}