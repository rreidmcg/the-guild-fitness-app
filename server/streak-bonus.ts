/**
 * Streak bonus system - applies XP multipliers for consistent daily engagement
 */

export interface StreakBonusInfo {
  multiplier: number;
  bonusActive: boolean;
  streakDays: number;
}

/**
 * Calculate XP multiplier based on current streak
 * @param currentStreak - User's current daily streak count
 * @returns Multiplier to apply to XP gains (1.0 = no bonus, 1.5 = 50% bonus)
 */
export function getStreakXpMultiplier(currentStreak: number): StreakBonusInfo {
  // 1.5x multiplier for 3+ day streaks
  const bonusActive = currentStreak >= 3;
  const multiplier = bonusActive ? 1.5 : 1.0;
  
  return {
    multiplier,
    bonusActive,
    streakDays: currentStreak
  };
}

/**
 * Apply streak bonus to XP amount
 * @param baseXp - Base XP amount before multiplier
 * @param currentStreak - User's current streak
 * @returns Adjusted XP amount with streak bonus applied
 */
export function applyStreakBonus(baseXp: number, currentStreak: number): {
  finalXp: number;
  bonusXp: number;
  bonusInfo: StreakBonusInfo;
} {
  const bonusInfo = getStreakXpMultiplier(currentStreak);
  const finalXp = Math.floor(baseXp * bonusInfo.multiplier);
  const bonusXp = finalXp - baseXp;
  
  return {
    finalXp,
    bonusXp,
    bonusInfo
  };
}