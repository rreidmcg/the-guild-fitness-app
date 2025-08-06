import { db } from "./db";
import { users } from "../shared/schema";
import { eq, and, lt, or, isNull } from "drizzle-orm";

export class AtrophySystem {
  /**
   * Record user activity to prevent atrophy
   * Updates lastActivityDate to current date
   */
  static async recordActivity(userId: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      await db
        .update(users)
        .set({
          lastActivityDate: today,
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error(`Error recording activity for user ${userId}:`, error);
    }
  }

  /**
   * Check for users who need atrophy applied and apply it
   * Should be called daily via a scheduled job
   */
  static async processAtrophy(): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    try {
      // Get all users who haven't had activity today and are not immune to atrophy
      const inactiveUsers = await db
        .select()
        .from(users)
        .where(
          and(
            // Last activity was before today or is null
            or(
              isNull(users.lastActivityDate),
              lt(users.lastActivityDate, today)
            ),
            // Atrophy immunity has expired or is null
            or(
              isNull(users.atrophyImmunityUntil),
              lt(users.atrophyImmunityUntil, today)
            )
          )
        );

      console.log(`Processing atrophy for ${inactiveUsers.length} inactive users`);
      console.log(`Query conditions: today=${today}`);
      if (inactiveUsers.length === 0) {
        // Debug: Let's see all users and their activity dates
        const allUsers = await db.select().from(users);
        console.log('All users activity status:');
        for (const user of allUsers) {
          console.log(`  ${user.username}: lastActivity=${user.lastActivityDate}, immunity=${user.atrophyImmunityUntil}, beforeToday=${user.lastActivityDate ? user.lastActivityDate < today : 'null'}`);
        }
      }

      for (const user of inactiveUsers) {
        await this.applyAtrophy(user.id, user);
      }
    } catch (error) {
      console.error("Error processing atrophy:", error);
    }
  }

  /**
   * Apply 1% atrophy to XP and stats for a specific user
   */
  static async applyAtrophy(userId: number, userData: any): Promise<void> {
    try {
      // Calculate 1% reduction (minimum 1 point loss if they have any XP)
      const xpLoss = userData.experience > 0 ? Math.max(1, Math.floor(userData.experience * 0.01)) : 0;
      
      // Calculate 1% XP loss for individual stats (use XP fields, not stat levels)
      const strengthXpLoss = Math.max(userData.strengthXp > 0 ? 1 : 0, Math.floor((userData.strengthXp || 0) * 0.01));
      const staminaXpLoss = Math.max(userData.staminaXp > 0 ? 1 : 0, Math.floor((userData.staminaXp || 0) * 0.01));
      const agilityXpLoss = Math.max(userData.agilityXp > 0 ? 1 : 0, Math.floor((userData.agilityXp || 0) * 0.01));

      // Don't let XP go below 0
      const newExperience = Math.max(0, userData.experience - xpLoss);
      const newStrengthXp = Math.max(0, (userData.strengthXp || 0) - strengthXpLoss);
      const newStaminaXp = Math.max(0, (userData.staminaXp || 0) - staminaXpLoss);
      const newAgilityXp = Math.max(0, (userData.agilityXp || 0) - agilityXpLoss);

      // Recalculate levels based on new XP (allows for level-down)
      const newLevel = this.calculateLevel(newExperience);
      const newStrength = this.calculateStatLevel(newStrengthXp);
      const newStamina = this.calculateStatLevel(newStaminaXp);
      const newAgility = this.calculateStatLevel(newAgilityXp);

      // Update the user's stats including levels and XP
      await db
        .update(users)
        .set({
          experience: newExperience,
          level: newLevel,
          strengthXp: newStrengthXp,
          staminaXp: newStaminaXp,
          agilityXp: newAgilityXp,
          strength: newStrength,
          stamina: newStamina,
          agility: newAgility,
        })
        .where(eq(users.id, userId));

      console.log(`Applied atrophy to user ${userId}: -${xpLoss} XP (${userData.experience} → ${newExperience}, Level ${userData.level} → ${newLevel}), STR: ${userData.strength} → ${newStrength}, STA: ${userData.stamina} → ${newStamina}, AGI: ${userData.agility} → ${newAgility}`);
    } catch (error) {
      console.error(`Error applying atrophy to user ${userId}:`, error);
    }
  }

  /**
   * Calculate level from total XP (same logic as backend)
   */
  static calculateLevel(experience: number): number {
    if (experience < 0) return 1;
    
    let level = 1;
    let xpRequired = 0;
    
    // Keep incrementing level until we find where the player's XP fits
    while (xpRequired <= experience) {
      level++;
      xpRequired = this.getXpRequiredForLevel(level);
    }
    
    return level - 1;
  }

  /**
   * Calculate XP required for a specific level (matches backend formula)
   */
  static getXpRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    // Exponential formula: level^1.8 * 16 (same as backend)
    return Math.floor(Math.pow(level - 1, 1.8) * 16);
  }

  /**
   * Calculate stat level from total XP (same logic as stat-progression.ts)
   */
  static calculateStatLevel(totalXp: number): number {
    if (totalXp < 0) return 0;
    
    let level = 1;
    let xpRequired = 0;
    
    while (xpRequired <= totalXp) {
      level++;
      xpRequired = this.getStatXpRequiredForLevel(level);
    }
    
    return level - 1;
  }

  /**
   * Calculate XP required for a specific stat level (matches stat-progression.ts)
   */
  static getStatXpRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    // Exponential formula: level^2.5 * 10 (same as stat-progression.ts)
    return Math.floor(Math.pow(level - 1, 2.5) * 10);
  }



  /**
   * Use a streak freeze to prevent atrophy
   */
  static async useStreakFreeze(userId: number): Promise<boolean> {
    try {
      // Get user's current streak freeze count
      const user = await db
        .select({ streakFreezeCount: users.streakFreezeCount })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user[0] || (user[0].streakFreezeCount || 0) <= 0) {
        return false; // No streak freezes available
      }

      const today = new Date().toISOString().split('T')[0];

      // Use streak freeze and record activity
      await db
        .update(users)
        .set({
          streakFreezeCount: (user[0].streakFreezeCount || 0) - 1,
          lastActivityDate: today,
        })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      console.error(`Error using streak freeze for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Grant new user immunity period (7 days)
   */
  static async grantNewUserImmunity(userId: number): Promise<void> {
    const immunityEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    try {
      await db
        .update(users)
        .set({
          atrophyImmunityUntil: immunityEndDate,
          lastActivityDate: today,
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error(`Error granting immunity to user ${userId}:`, error);
    }
  }

  /**
   * Check if a user needs atrophy warning
   */
  static async getUserAtrophyStatus(userId: number): Promise<{
    isAtRisk: boolean;
    daysInactive: number;
    hasImmunity: boolean;
    immunityEndsOn?: string;
  }> {
    try {
      const user = await db
        .select({
          lastActivityDate: users.lastActivityDate,
          atrophyImmunityUntil: users.atrophyImmunityUntil,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user[0]) {
        return { isAtRisk: false, daysInactive: 0, hasImmunity: false };
      }

      const today = new Date().toISOString().split('T')[0];
      const lastActivity = user[0].lastActivityDate;
      const immunityUntil = user[0].atrophyImmunityUntil;

      // Check if user has immunity
      const hasImmunity = immunityUntil && immunityUntil >= today;

      // Calculate days inactive
      let daysInactive = 0;
      if (lastActivity) {
        const lastActivityDate = new Date(lastActivity);
        const todayDate = new Date(today);
        daysInactive = Math.floor((todayDate.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000));
      }

      return {
        isAtRisk: daysInactive >= 1 && !hasImmunity,
        daysInactive,
        hasImmunity: !!hasImmunity,
        immunityEndsOn: immunityUntil || undefined,
      };
    } catch (error) {
      console.error(`Error checking atrophy status for user ${userId}:`, error);
      return { isAtRisk: false, daysInactive: 0, hasImmunity: false };
    }
  }
}