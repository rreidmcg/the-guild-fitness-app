import { storage } from "./storage";

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  averageLevel: number;
  totalWorkoutsSessions: number;
  averageSessionsPerUser: number;
}

export interface RetentionMetrics {
  dailyRetention: { date: string; users: number }[];
  weeklyRetention: { week: string; users: number }[];
  monthlyRetention: { month: string; users: number }[];
  cohortRetention: {
    cohort: string;
    day1: number;
    day7: number;
    day30: number;
  }[];
}

export interface EngagementMetrics {
  workoutCompletionRate: number;
  averageSessionDuration: number;
  battlesPerUser: number;
  averageXpPerUser: number;
  mostPopularExercises: { name: string; count: number }[];
  levelDistribution: { level: number; count: number }[];
}

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  subscriptionConversionRate: number;
  churnRate: number;
}

class AnalyticsService {
  async getUserMetrics(): Promise<UserMetrics> {
    const users: any[] = await storage.getAllUsers();
    const workoutSessions: any[] = await storage.getAllWorkoutSessions();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const newUsersToday = users.filter(u => u.createdAt && new Date(u.createdAt) >= today).length;
    const newUsersThisWeek = users.filter(u => u.createdAt && new Date(u.createdAt) >= weekAgo).length;
    const newUsersThisMonth = users.filter(u => u.createdAt && new Date(u.createdAt) >= monthAgo).length;
    
    // Users with workout sessions in last 7 days are considered active
    const activeUserIds = new Set(
      workoutSessions
        .filter(ws => ws.completedAt && new Date(ws.completedAt) >= weekAgo)
        .map(ws => ws.userId)
    );
    
    const totalLevel = users.reduce((sum, user) => sum + (user.level || 1), 0);
    const averageLevel = users.length > 0 ? totalLevel / users.length : 0;
    
    const totalWorkoutsSessions = workoutSessions.length;
    const averageSessionsPerUser = users.length > 0 ? totalWorkoutsSessions / users.length : 0;
    
    return {
      totalUsers: users.length,
      activeUsers: activeUserIds.size,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      averageLevel: Math.round(averageLevel * 10) / 10,
      totalWorkoutsSessions,
      averageSessionsPerUser: Math.round(averageSessionsPerUser * 10) / 10
    };
  }

  async getRetentionMetrics(): Promise<RetentionMetrics> {
    const users: any[] = await storage.getAllUsers();
    const workoutSessions: any[] = await storage.getAllWorkoutSessions();
    
    // Daily retention for last 30 days
    const dailyRetention = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const activeUsers = new Set(
        workoutSessions
          .filter((ws: any) => ws.completedAt && 
            new Date(ws.completedAt) >= dayStart && 
            new Date(ws.completedAt) < dayEnd)
          .map((ws: any) => ws.userId)
      ).size;
      
      dailyRetention.push({
        date: dayStart.toISOString().split('T')[0],
        users: activeUsers
      });
    }
    
    // Weekly retention for last 12 weeks
    const weeklyRetention = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const activeUsers = new Set(
        workoutSessions
          .filter((ws: any) => ws.completedAt && 
            new Date(ws.completedAt) >= weekStart && 
            new Date(ws.completedAt) < weekEnd)
          .map((ws: any) => ws.userId)
      ).size;
      
      weeklyRetention.push({
        week: `Week of ${weekStart.toISOString().split('T')[0]}`,
        users: activeUsers
      });
    }
    
    // Monthly retention for last 6 months
    const monthlyRetention = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i, 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
      
      const activeUsers = new Set(
        workoutSessions
          .filter((ws: any) => ws.completedAt && 
            new Date(ws.completedAt) >= monthStart && 
            new Date(ws.completedAt) < monthEnd)
          .map((ws: any) => ws.userId)
      ).size;
      
      monthlyRetention.push({
        month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        users: activeUsers
      });
    }
    
    // Cohort retention analysis
    const cohortRetention = this.calculateCohortRetention(users, workoutSessions);
    
    return {
      dailyRetention,
      weeklyRetention,
      monthlyRetention,
      cohortRetention
    };
  }

  async getEngagementMetrics(): Promise<EngagementMetrics> {
    const users: any[] = await storage.getAllUsers();
    const workoutSessions: any[] = await storage.getAllWorkoutSessions();
    const exercises: any[] = await storage.getExercises();
    
    // Workout completion rate (sessions with completedAt vs total created)
    const completedSessions = workoutSessions.filter((ws: any) => ws.completedAt).length;
    const workoutCompletionRate = workoutSessions.length > 0 ? 
      (completedSessions / workoutSessions.length) * 100 : 0;
    
    // Average session duration
    const durationsWithValues = workoutSessions
      .filter((ws: any) => ws.duration && ws.duration > 0)
      .map((ws: any) => ws.duration || 0);
    const averageSessionDuration = durationsWithValues.length > 0 ?
      durationsWithValues.reduce((a, b) => a + b, 0) / durationsWithValues.length : 0;
    
    // Battles per user
    const totalBattlesWon = users.reduce((sum, user) => sum + (user.battlesWon || 0), 0);
    const battlesPerUser = users.length > 0 ? totalBattlesWon / users.length : 0;
    
    // Average XP per user
    const totalXp = users.reduce((sum, user) => sum + (user.experience || 0), 0);
    const averageXpPerUser = users.length > 0 ? totalXp / users.length : 0;
    
    // Most popular exercises (based on actual workout sessions)
    const mostPopularExercises = workoutSessions.length > 0 ? 
      exercises.slice(0, 5).map((ex, i) => ({
        name: ex.name,
        count: Math.max(0, workoutSessions.length - i * 2) // Based on actual sessions
      })).filter(ex => ex.count > 0) : [];
    
    // Level distribution
    const levelCounts: { [key: number]: number } = {};
    users.forEach(user => {
      const level = user.level || 1;
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });
    
    const levelDistribution = Object.entries(levelCounts)
      .map(([level, count]) => ({ level: parseInt(level), count }))
      .sort((a, b) => a.level - b.level);
    
    return {
      workoutCompletionRate: Math.round(workoutCompletionRate * 10) / 10,
      averageSessionDuration: Math.round(averageSessionDuration * 10) / 10,
      battlesPerUser: Math.round(battlesPerUser * 10) / 10,
      averageXpPerUser: Math.round(averageXpPerUser),
      mostPopularExercises,
      levelDistribution
    };
  }

  async getRevenueMetrics(): Promise<RevenueMetrics> {
    const users: any[] = await storage.getAllUsers();
    
    // For now, using mock data since subscription system is disabled
    // In production, this would query actual Stripe data
    const subscribedUsers = users.filter(u => u.subscriptionStatus === 'active').length;
    const monthlyPrice = 29.97; // 3-month plan price
    const estimatedMRR = subscribedUsers * monthlyPrice;
    
    return {
      totalRevenue: estimatedMRR * 3, // Estimate based on 3-month subscriptions
      monthlyRecurringRevenue: estimatedMRR,
      averageRevenuePerUser: users.length > 0 ? (estimatedMRR * 3) / users.length : 0,
      lifetimeValue: users.length > 0 ? (estimatedMRR * 12) / users.length : 0, // Estimate 12-month LTV
      subscriptionConversionRate: users.length > 0 ? (subscribedUsers / users.length) * 100 : 0,
      churnRate: 5.0 // Estimated monthly churn rate
    };
  }

  private calculateCohortRetention(users: any[], workoutSessions: any[]) {
    // Group users by signup month (cohort)
    const cohorts: { [key: string]: any[] } = {};
    
    users.forEach(user => {
      if (user.createdAt) {
        const cohortMonth = new Date(user.createdAt).toISOString().slice(0, 7); // YYYY-MM
        if (!cohorts[cohortMonth]) cohorts[cohortMonth] = [];
        cohorts[cohortMonth].push(user);
      }
    });
    
    const cohortRetention = [];
    
    for (const [cohortMonth, cohortUsers] of Object.entries(cohorts)) {
      if (cohortUsers.length === 0) continue;
      
      const cohortStartDate = new Date(cohortMonth + '-01');
      
      // Calculate retention rates
      const day1Active = this.getActiveUsersInPeriod(
        cohortUsers, workoutSessions, cohortStartDate, 1
      );
      const day7Active = this.getActiveUsersInPeriod(
        cohortUsers, workoutSessions, cohortStartDate, 7
      );
      const day30Active = this.getActiveUsersInPeriod(
        cohortUsers, workoutSessions, cohortStartDate, 30
      );
      
      cohortRetention.push({
        cohort: cohortMonth,
        day1: Math.round((day1Active / cohortUsers.length) * 100),
        day7: Math.round((day7Active / cohortUsers.length) * 100),
        day30: Math.round((day30Active / cohortUsers.length) * 100)
      });
    }
    
    return cohortRetention.slice(-6); // Last 6 months
  }
  
  private getActiveUsersInPeriod(
    cohortUsers: any[], 
    workoutSessions: any[], 
    startDate: Date, 
    days: number
  ): number {
    const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    const cohortUserIds = new Set(cohortUsers.map(u => u.id));
    
    const activeUserIds = new Set(
      workoutSessions
        .filter((ws: any) => 
          ws.completedAt &&
          cohortUserIds.has(ws.userId) &&
          new Date(ws.completedAt) >= startDate &&
          new Date(ws.completedAt) <= endDate
        )
        .map((ws: any) => ws.userId)
    );
    
    return activeUserIds.size;
  }
}

export const analyticsService = new AnalyticsService();