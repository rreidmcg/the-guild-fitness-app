import { db } from "./db";
import { users, workoutSessions, achievements, userAchievements, monsters, exercises } from "@shared/schema";
import { eq, sql, and, gte, lte, desc, count } from "drizzle-orm";

export interface AnalyticsData {
  userEngagement: {
    totalUsers: number;
    activeUsers24h: number;
    activeUsers7d: number;
    activeUsers30d: number;
    retentionRate: number;
  };
  workoutStats: {
    totalWorkouts: number;
    averageWorkoutsPerUser: number;
    workoutCompletionRate: number;
    topExercises: Array<{ name: string; count: number }>;
    averageWorkoutDuration: number;
  };
  achievementStats: {
    totalAchievements: number;
    achievementUnlockRate: number;
    topAchievements: Array<{ name: string; unlocks: number; percentage: number }>;
  };
  battleStats: {
    totalBattles: number;
    averageBattlesPerUser: number;
    topMonsters: Array<{ name: string; defeatedCount: number }>;
  };
  userProgression: {
    averageLevel: number;
    levelDistribution: Array<{ level: number; count: number }>;
    averageStrength: number;
    averageStamina: number;
    averageAgility: number;
  };
}

export class AnalyticsService {
  async getUserEngagement(): Promise<AnalyticsData['userEngagement']> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users);

    const [activeUsers24hResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, yesterday));

    const [activeUsers7dResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, weekAgo));

    const [activeUsers30dResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, monthAgo));

    const totalUsers = totalUsersResult.count;
    const activeUsers30d = activeUsers30dResult.count;
    const retentionRate = totalUsers > 0 ? (activeUsers30d / totalUsers) * 100 : 0;

    return {
      totalUsers,
      activeUsers24h: activeUsers24hResult.count,
      activeUsers7d: activeUsers7dResult.count,
      activeUsers30d,
      retentionRate: Math.round(retentionRate * 100) / 100
    };
  }

  async getWorkoutStats(): Promise<AnalyticsData['workoutStats']> {
    const [totalWorkoutsResult] = await db
      .select({ count: count() })
      .from(workoutSessions);

    const [userCountResult] = await db
      .select({ count: count() })
      .from(users);

    const totalWorkouts = totalWorkoutsResult.count;
    const userCount = userCountResult.count;
    const averageWorkoutsPerUser = userCount > 0 ? totalWorkouts / userCount : 0;

    // Calculate average workout duration
    const [avgDurationResult] = await db
      .select({ 
        avgDuration: sql<number>`AVG(${workoutSessions.duration})` 
      })
      .from(workoutSessions)
      .where(sql`${workoutSessions.duration} IS NOT NULL`);

    const averageWorkoutDuration = avgDurationResult.avgDuration || 0;

    // Get top exercises (simplified - would need exercise performance data)
    const topExercises = [
      { name: "Push-ups", count: 150 },
      { name: "Squats", count: 135 },
      { name: "Planks", count: 120 },
      { name: "Lunges", count: 95 },
      { name: "Burpees", count: 80 }
    ];

    return {
      totalWorkouts,
      averageWorkoutsPerUser: Math.round(averageWorkoutsPerUser * 100) / 100,
      workoutCompletionRate: 85.5, // Placeholder - would calculate from session data
      topExercises,
      averageWorkoutDuration: Math.round(averageWorkoutDuration)
    };
  }

  async getAchievementStats(): Promise<AnalyticsData['achievementStats']> {
    const [totalAchievementsResult] = await db
      .select({ count: count() })
      .from(achievements);

    const [totalUserAchievementsResult] = await db
      .select({ count: count() })
      .from(userAchievements);

    const [userCountResult] = await db
      .select({ count: count() })
      .from(users);

    const totalAchievements = totalAchievementsResult.count;
    const totalUserAchievements = totalUserAchievementsResult.count;
    const userCount = userCountResult.count;

    const maxPossibleUnlocks = totalAchievements * userCount;
    const achievementUnlockRate = maxPossibleUnlocks > 0 ? 
      (totalUserAchievements / maxPossibleUnlocks) * 100 : 0;

    // Get top achievements with unlock counts
    const topAchievements = await db
      .select({
        achievementId: userAchievements.achievementId,
        name: achievements.name,
        unlocks: count(userAchievements.id)
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .groupBy(userAchievements.achievementId, achievements.name)
      .orderBy(desc(count(userAchievements.id)))
      .limit(10);

    const topAchievementsWithPercentage = topAchievements.map(achievement => ({
      name: achievement.name,
      unlocks: achievement.unlocks,
      percentage: userCount > 0 ? Math.round((achievement.unlocks / userCount) * 100 * 100) / 100 : 0
    }));

    return {
      totalAchievements,
      achievementUnlockRate: Math.round(achievementUnlockRate * 100) / 100,
      topAchievements: topAchievementsWithPercentage
    };
  }

  async getBattleStats(): Promise<AnalyticsData['battleStats']> {
    const [totalUsersResult] = await db
      .select({ 
        totalBattles: sql<number>`SUM(${users.battlesWon})`,
        userCount: count()
      })
      .from(users);

    const totalBattles = totalUsersResult.totalBattles || 0;
    const userCount = totalUsersResult.userCount;
    const averageBattlesPerUser = userCount > 0 ? totalBattles / userCount : 0;

    // Get monster defeat statistics (placeholder data)
    const topMonsters = [
      { name: "Goblin Scout", defeatedCount: 245 },
      { name: "Wild Boar", defeatedCount: 198 },
      { name: "Forest Spider", defeatedCount: 167 },
      { name: "Skeleton Warrior", defeatedCount: 134 },
      { name: "Orc Raider", defeatedCount: 89 }
    ];

    return {
      totalBattles,
      averageBattlesPerUser: Math.round(averageBattlesPerUser * 100) / 100,
      topMonsters
    };
  }

  async getUserProgression(): Promise<AnalyticsData['userProgression']> {
    const [progressionStats] = await db
      .select({
        avgLevel: sql<number>`AVG(${users.level})`,
        avgStrength: sql<number>`AVG(${users.strength})`,
        avgStamina: sql<number>`AVG(${users.stamina})`,
        avgAgility: sql<number>`AVG(${users.agility})`
      })
      .from(users);

    // Get level distribution
    const levelDistribution = await db
      .select({
        level: users.level,
        count: count()
      })
      .from(users)
      .groupBy(users.level)
      .orderBy(users.level);

    return {
      averageLevel: Math.round((progressionStats.avgLevel || 0) * 100) / 100,
      levelDistribution,
      averageStrength: Math.round((progressionStats.avgStrength || 0) * 100) / 100,
      averageStamina: Math.round((progressionStats.avgStamina || 0) * 100) / 100,
      averageAgility: Math.round((progressionStats.avgAgility || 0) * 100) / 100
    };
  }

  async getFullAnalytics(): Promise<AnalyticsData> {
    const [
      userEngagement,
      workoutStats,
      achievementStats,
      battleStats,
      userProgression
    ] = await Promise.all([
      this.getUserEngagement(),
      this.getWorkoutStats(),
      this.getAchievementStats(),
      this.getBattleStats(),
      this.getUserProgression()
    ]);

    return {
      userEngagement,
      workoutStats,
      achievementStats,
      battleStats,
      userProgression
    };
  }

  // Content management methods
  async createExercise(exerciseData: any) {
    const [exercise] = await db
      .insert(exercises)
      .values(exerciseData)
      .returning();
    return exercise;
  }

  async updateExercise(id: number, exerciseData: any) {
    const [exercise] = await db
      .update(exercises)
      .set(exerciseData)
      .where(eq(exercises.id, id))
      .returning();
    return exercise;
  }

  async deleteExercise(id: number) {
    await db
      .delete(exercises)
      .where(eq(exercises.id, id));
  }

  async createMonster(monsterData: any) {
    const [monster] = await db
      .insert(monsters)
      .values(monsterData)
      .returning();
    return monster;
  }

  async updateMonster(id: number, monsterData: any) {
    const [monster] = await db
      .update(monsters)
      .set(monsterData)
      .where(eq(monsters.id, id))
      .returning();
    return monster;
  }

  async deleteMonster(id: number) {
    await db
      .delete(monsters)
      .where(eq(monsters.id, id));
  }

  async createAchievement(achievementData: any) {
    const [achievement] = await db
      .insert(achievements)
      .values(achievementData)
      .returning();
    return achievement;
  }

  async updateAchievement(id: number, achievementData: any) {
    const [achievement] = await db
      .update(achievements)
      .set(achievementData)
      .where(eq(achievements.id, id))
      .returning();
    return achievement;
  }

  async deleteAchievement(id: number) {
    await db
      .delete(achievements)
      .where(eq(achievements.id, id));
  }
}

export const analyticsService = new AnalyticsService();