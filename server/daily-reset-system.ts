/**
 * Daily Quest Reset System
 * Handles automatic reset of daily quests at 12:00 AM local time
 */

import { db } from "./db.js";
import { dailyProgress, users, workoutSessions } from "../shared/schema.js";
import { eq, and, sql } from "drizzle-orm";

export interface DailyResetService {
  checkAndResetDailyQuests(userId: number, userTimezone?: string): Promise<boolean>;
  getCurrentDateForUser(userTimezone?: string): string;
  shouldResetForUser(userId: number, userTimezone?: string): Promise<boolean>;
  checkAndApplyAutoStreakFreeze(userId: number, userTimezone?: string): Promise<boolean>;
}

export class DailyResetSystem implements DailyResetService {
  /**
   * Get the current date string for a user's timezone
   * Format: YYYY-MM-DD
   */
  getCurrentDateForUser(userTimezone?: string): string {
    try {
      const now = new Date();
      
      if (userTimezone) {
        // Use user's timezone if provided
        const userDate = new Intl.DateTimeFormat('en-CA', {
          timeZone: userTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(now);
        return userDate; // Already in YYYY-MM-DD format
      } else {
        // Fallback to server local time
        return now.toISOString().split('T')[0];
      }
    } catch (error) {
      // If timezone is invalid, fallback to server time
      console.warn(`Invalid timezone: ${userTimezone}, falling back to server time`);
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Check if daily quests should be reset for a user
   * Returns true if it's a new day since their last progress entry
   */
  async shouldResetForUser(userId: number, userTimezone?: string): Promise<boolean> {
    const currentDate = this.getCurrentDateForUser(userTimezone);
    
    // Get the user's most recent daily progress
    const latestProgress = await db.select()
      .from(dailyProgress)
      .where(eq(dailyProgress.userId, userId))
      .orderBy(dailyProgress.date)
      .limit(1);

    if (latestProgress.length === 0) {
      // No previous progress - first time user
      return false; // Don't reset, just let them start fresh
    }

    const lastProgressDate = latestProgress[0].date;
    return currentDate !== lastProgressDate;
  }

  /**
   * Check and reset daily quests if it's a new day
   * Returns true if a reset occurred
   */
  async checkAndResetDailyQuests(userId: number, userTimezone?: string): Promise<boolean> {
    const currentDate = this.getCurrentDateForUser(userTimezone);
    
    // Check if user has progress for today
    const todayProgress = await db.select()
      .from(dailyProgress)
      .where(and(
        eq(dailyProgress.userId, userId),
        eq(dailyProgress.date, currentDate)
      ))
      .limit(1);

    if (todayProgress.length === 0) {
      // No progress for today - check if we need to reset from yesterday
      const shouldReset = await this.shouldResetForUser(userId, userTimezone);
      
      if (shouldReset) {
        // Before creating new day, check if auto streak freeze should be applied
        await this.checkAndApplyAutoStreakFreeze(userId, userTimezone);
        
        // Create a fresh daily progress entry for today
        await db.insert(dailyProgress).values({
          userId,
          date: currentDate,
          hydration: false,
          steps: false,
          protein: false,
          sleep: false,
          xpAwarded: false,
          streakFreezeAwarded: false
        });
        
        return true; // Reset occurred
      }
    }

    return false; // No reset needed
  }

  /**
   * Check if player failed to meet streak requirements yesterday and auto-apply streak freeze if available
   * Returns true if a streak freeze was automatically applied
   */
  async checkAndApplyAutoStreakFreeze(userId: number, userTimezone?: string): Promise<boolean> {
    try {
      // Get yesterday's date
      const now = new Date();
      now.setDate(now.getDate() - 1);
      const yesterdayDate = this.getCurrentDateForUser(userTimezone).split('T')[0];
      
      // Calculate yesterday properly using user timezone
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Get user info
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user[0] || (user[0].streakFreezeCount ?? 0) <= 0) {
        return false; // No user or no streak freezes available
      }

      // Get yesterday's progress
      const yesterdayProgress = await db.select()
        .from(dailyProgress)
        .where(and(
          eq(dailyProgress.userId, userId),
          eq(dailyProgress.date, yesterdayStr)
        ))
        .limit(1);

      // Get yesterday's workouts
      const yesterdayWorkouts = await db.select()
        .from(workoutSessions)
        .where(and(
          eq(workoutSessions.userId, userId),
          eq(sql`DATE(${workoutSessions.completedAt})`, yesterdayStr)
        ));

      // Check if streak requirements were met yesterday
      const completedQuests = yesterdayProgress[0] ? [
        yesterdayProgress[0].hydration,
        yesterdayProgress[0].steps,
        yesterdayProgress[0].protein,
        yesterdayProgress[0].sleep
      ].filter(Boolean).length : 0;

      const streakRequirementMet = completedQuests >= 2 || yesterdayWorkouts.length > 0;

      // If requirements weren't met and user has an active streak, auto-apply freeze
      if (!streakRequirementMet && user[0].currentStreak && user[0].currentStreak > 0) {
        // Apply streak freeze automatically
        await db.update(users)
          .set({
            streakFreezeCount: (user[0].streakFreezeCount ?? 0) - 1,
            lastActivityDate: yesterdayStr, // Mark activity for yesterday to maintain streak
            lastStreakDate: yesterdayStr  // Maintain streak date
          })
          .where(eq(users.id, userId));

        console.log(`Auto-applied streak freeze for user ${userId} to maintain ${user[0].currentStreak}-day streak`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error in auto streak freeze for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get timezone-aware midnight time for a user
   * Returns the next midnight time in the user's timezone
   */
  getNextMidnightForUser(userTimezone?: string): Date {
    const now = new Date();
    
    if (userTimezone) {
      try {
        // Get the current time in user's timezone
        const userNow = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
        
        // Set to next midnight in user's timezone
        const userMidnight = new Date(userNow);
        userMidnight.setDate(userMidnight.getDate() + 1);
        userMidnight.setHours(0, 0, 0, 0);
        
        // Convert back to UTC
        const offset = userNow.getTime() - now.getTime();
        return new Date(userMidnight.getTime() - offset);
      } catch (error) {
        console.warn(`Error calculating midnight for timezone ${userTimezone}:`, error);
      }
    }
    
    // Fallback to server local midnight
    const serverMidnight = new Date(now);
    serverMidnight.setDate(serverMidnight.getDate() + 1);
    serverMidnight.setHours(0, 0, 0, 0);
    return serverMidnight;
  }
}

// Export singleton instance
export const dailyResetService = new DailyResetSystem();