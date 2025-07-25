/**
 * Daily Quest Reset System
 * Handles automatic reset of daily quests at 12:00 AM local time
 */

import { db } from "./db.js";
import { dailyProgress, users } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";

export interface DailyResetService {
  checkAndResetDailyQuests(userId: number, userTimezone?: string): Promise<boolean>;
  getCurrentDateForUser(userTimezone?: string): string;
  shouldResetForUser(userId: number, userTimezone?: string): Promise<boolean>;
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