import { db } from "./db";
import { users } from "../shared/schema";
import { eq, and, lt } from "drizzle-orm";

export class AtrophySystem {
  /**
   * Check for users who need atrophy applied and apply it
   * Should be called daily via a scheduled job
   */
  static async processAtrophy(): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
      // Get all users who haven't had activity in the last day and are not immune to atrophy
      const inactiveUsers = await db
        .select()
        .from(users)
        .where(
          and(
            // Last activity was before yesterday or is null
            lt(users.lastActivityDate, yesterday),
            // Atrophy immunity has expired or is null
            lt(users.atrophyImmunityUntil, today)
          )
        );

      console.log(`Processing atrophy for ${inactiveUsers.length} inactive users`);

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
      // Calculate 1% reduction (minimum 1 point loss if they have any)
      const xpLoss = Math.max(1, Math.floor(userData.experience * 0.01));
      const strengthLoss = Math.max(userData.strength > 0 ? 1 : 0, Math.floor(userData.strength * 0.01));
      const staminaLoss = Math.max(userData.stamina > 0 ? 1 : 0, Math.floor(userData.stamina * 0.01));
      const agilityLoss = Math.max(userData.agility > 0 ? 1 : 0, Math.floor(userData.agility * 0.01));

      // Don't let stats go below 0
      const newExperience = Math.max(0, userData.experience - xpLoss);
      const newStrength = Math.max(0, userData.strength - strengthLoss);
      const newStamina = Math.max(0, userData.stamina - staminaLoss);
      const newAgility = Math.max(0, userData.agility - agilityLoss);

      // Update the user's stats
      await db
        .update(users)
        .set({
          experience: newExperience,
          strength: newStrength,
          stamina: newStamina,
          agility: newAgility,
        })
        .where(eq(users.id, userId));

      console.log(`Applied atrophy to user ${userId}: -${xpLoss} XP, -${strengthLoss} STR, -${staminaLoss} STA, -${agilityLoss} AGI`);
    } catch (error) {
      console.error(`Error applying atrophy to user ${userId}:`, error);
    }
  }

  /**
   * Record user activity to prevent atrophy
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

      if (!user[0] || user[0].streakFreezeCount <= 0) {
        return false; // No streak freezes available
      }

      const today = new Date().toISOString().split('T')[0];

      // Use streak freeze and record activity
      await db
        .update(users)
        .set({
          streakFreezeCount: user[0].streakFreezeCount - 1,
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