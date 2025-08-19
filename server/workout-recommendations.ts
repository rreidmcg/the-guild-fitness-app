/**
 * Personalized Workout Recommendation Engine
 * Analyzes user stats, fitness goals, workout history, and recovery to suggest optimal workouts
 */

import { db } from "./db";
import { users, exercises, workoutSessions, exercisePerformances } from "../shared/schema.js";
import { eq, desc, gte, sql } from "drizzle-orm";

export interface WorkoutRecommendation {
  id: string;
  name: string;
  description: string;
  reason: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDuration: number; // minutes
  targetStats: {
    strength?: number;
    stamina?: number;
    agility?: number;
  };
  exercises: RecommendedExercise[];
  score: number; // Higher = better match
}

export interface RecommendedExercise {
  exerciseId: number;
  name: string;
  category: string;
  muscleGroups: string[];
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  restTime: number;
  reason: string;
}

export interface UserProfile {
  userId: number;
  level: number;
  strength: number;
  stamina: number;
  agility: number;
  fitnessGoal: string;
  height: number;
  weight: number;
  recentWorkouts: any[];
  personalRecords: any[];
  lastWorkoutDate?: Date;
}

export class WorkoutRecommendationEngine {
  private async getUserProfile(userId: number): Promise<UserProfile> {
    // Get user stats and basic info
    const [user] = await db
      .select({
        userId: users.id,
        level: users.level,
        strength: users.strength,
        stamina: users.stamina,
        agility: users.agility,
        fitnessGoal: users.fitnessGoal,
        height: users.height,
        weight: users.weight,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error("User not found");
    }

    // Get recent workouts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentWorkouts = await db
      .select()
      .from(workoutSessions)
      .where(
        eq(workoutSessions.userId, userId)
      )
      .orderBy(desc(workoutSessions.completedAt))
      .limit(10);

    return {
      userId: user.userId,
      level: user.level || 1,
      strength: user.strength || 0,
      stamina: user.stamina || 0,
      agility: user.agility || 0,
      fitnessGoal: user.fitnessGoal || "general_fitness",
      height: user.height || 170,
      weight: user.weight || 70,
      recentWorkouts,
      personalRecords: [], // Could be expanded later
      lastWorkoutDate: recentWorkouts[0]?.completedAt || undefined,
    };
  }

  private calculateStatWeaknesses(profile: UserProfile): { stat: string; deficit: number }[] {
    const { strength, stamina, agility } = profile;
    const total = strength + stamina + agility;
    const average = total / 3;

    const weaknesses = [
      { stat: "strength", deficit: Math.max(0, average - strength) },
      { stat: "stamina", deficit: Math.max(0, average - stamina) },
      { stat: "agility", deficit: Math.max(0, average - agility) },
    ].filter(w => w.deficit > 0);

    return weaknesses.sort((a, b) => b.deficit - a.deficit);
  }

  private getRecoveryStatus(profile: UserProfile): "fresh" | "light" | "moderate" | "heavy" {
    if (!profile.lastWorkoutDate) return "fresh";

    const daysSinceLastWorkout = Math.floor(
      (Date.now() - profile.lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastWorkout >= 2) return "fresh";
    if (daysSinceLastWorkout >= 1) return "light";
    
    // Check recent workout intensity
    const recentIntensiveWorkouts = profile.recentWorkouts
      .filter(w => w.completedAt && Date.now() - w.completedAt.getTime() < 48 * 60 * 60 * 1000)
      .length;

    if (recentIntensiveWorkouts >= 2) return "heavy";
    return "moderate";
  }

  private async generateRecommendations(profile: UserProfile): Promise<WorkoutRecommendation[]> {
    const recommendations: WorkoutRecommendation[] = [];
    const weaknesses = this.calculateStatWeaknesses(profile);
    const recovery = this.getRecoveryStatus(profile);

    // Get all available exercises
    const allExercises = await db.select().from(exercises);

    // 1. Stat-focused recommendation
    if (weaknesses.length > 0) {
      const targetStat = weaknesses[0].stat;
      const targetExercises = allExercises.filter(ex => 
        ex.statTypes && (ex.statTypes as any)[targetStat] > 0
      );

      if (targetExercises.length > 0) {
        recommendations.push(await this.createStatFocusedWorkout(
          targetStat, targetExercises, profile, recovery
        ));
      }
    }

    // 2. Fitness goal recommendation
    recommendations.push(await this.createGoalBasedWorkout(profile, allExercises, recovery));

    // 3. Balanced recommendation
    recommendations.push(await this.createBalancedWorkout(profile, allExercises, recovery));

    // 4. Recovery/Light recommendation (if needed)
    if (recovery === "heavy" || recovery === "moderate") {
      recommendations.push(await this.createRecoveryWorkout(profile, allExercises));
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  private async createStatFocusedWorkout(
    targetStat: string,
    exercises: any[],
    profile: UserProfile,
    recovery: string
  ): Promise<WorkoutRecommendation> {
    const statCapitalized = targetStat.charAt(0).toUpperCase() + targetStat.slice(1);
    const targetExercises = exercises
      .filter(ex => (ex.statTypes as any)[targetStat] > 0)
      .slice(0, 4);

    const recommendedExercises = targetExercises.map(ex => this.generateExerciseParams(ex, profile, recovery));

    return {
      id: `stat-${targetStat}`,
      name: `${statCapitalized} Focus Training`,
      description: `Targeted workout to improve your ${targetStat} stat and address your current weakness.`,
      reason: `Your ${targetStat} is lower than your other stats. This workout will help balance your character.`,
      difficulty: this.getDifficultyForProfile(profile),
      estimatedDuration: this.calculateWorkoutDuration(recommendedExercises),
      targetStats: { [targetStat]: 3 } as any,
      exercises: recommendedExercises,
      score: 90 + (profile.level * 2), // High priority for stat balancing
    };
  }

  private async createGoalBasedWorkout(
    profile: UserProfile,
    exercises: any[],
    recovery: string
  ): Promise<WorkoutRecommendation> {
    const goalMapping = {
      "lose_weight": { focus: "stamina", name: "Fat Burning", exercises: ["cardio", "plyometric"] },
      "gain_muscle": { focus: "strength", name: "Muscle Building", exercises: ["strength"] },
      "improve_endurance": { focus: "stamina", name: "Endurance Training", exercises: ["cardio"] },
      "general_fitness": { focus: "balanced", name: "General Fitness", exercises: ["strength", "cardio", "plyometric"] },
    };

    const goal = goalMapping[profile.fitnessGoal as keyof typeof goalMapping] || goalMapping.general_fitness;
    const targetExercises = exercises.filter(ex => 
      goal.exercises.includes(ex.category)
    ).slice(0, 5);

    const recommendedExercises = targetExercises.map(ex => this.generateExerciseParams(ex, profile, recovery));

    return {
      id: `goal-${profile.fitnessGoal}`,
      name: `${goal.name} Workout`,
      description: `Customized workout aligned with your fitness goal: ${profile.fitnessGoal.replace("_", " ")}.`,
      reason: `This workout matches your stated fitness goal and will help you progress efficiently.`,
      difficulty: this.getDifficultyForProfile(profile),
      estimatedDuration: this.calculateWorkoutDuration(recommendedExercises),
      targetStats: goal.focus === "balanced" 
        ? { strength: 2, stamina: 2, agility: 1 }
        : { [goal.focus]: 3 } as any,
      exercises: recommendedExercises,
      score: 85 + (profile.level * 1.5),
    };
  }

  private async createBalancedWorkout(
    profile: UserProfile,
    exercises: any[],
    recovery: string
  ): Promise<WorkoutRecommendation> {
    // Select exercises from different categories
    const strengthExercises = exercises.filter(ex => ex.category === "strength").slice(0, 2);
    const cardioExercises = exercises.filter(ex => ex.category === "cardio").slice(0, 2);
    const agilityExercises = exercises.filter(ex => ex.category === "plyometric").slice(0, 1);

    const allSelected = [...strengthExercises, ...cardioExercises, ...agilityExercises];
    const recommendedExercises = allSelected.map(ex => this.generateExerciseParams(ex, profile, recovery));

    return {
      id: "balanced-workout",
      name: "Balanced Training Session",
      description: "A well-rounded workout targeting all major fitness components.",
      reason: "Perfect for maintaining overall fitness and progressing all stats equally.",
      difficulty: this.getDifficultyForProfile(profile),
      estimatedDuration: this.calculateWorkoutDuration(recommendedExercises),
      targetStats: { strength: 2, stamina: 2, agility: 2 },
      exercises: recommendedExercises,
      score: 75 + profile.level,
    };
  }

  private async createRecoveryWorkout(
    profile: UserProfile,
    exercises: any[]
  ): Promise<WorkoutRecommendation> {
    // Light cardio and flexibility exercises
    const lightExercises = exercises
      .filter(ex => ex.category === "cardio" || ex.category === "flexibility")
      .slice(0, 3);

    const recommendedExercises = lightExercises.map(ex => ({
      exerciseId: ex.id,
      name: ex.name,
      category: ex.category,
      muscleGroups: ex.muscleGroups,
      sets: 2,
      reps: ex.category === "cardio" ? 1 : 12,
      duration: ex.category === "cardio" ? 10 : undefined,
      restTime: 90,
      reason: "Light intensity for recovery",
    }));

    return {
      id: "recovery-workout",
      name: "Active Recovery Session",
      description: "Gentle workout to promote recovery while maintaining activity.",
      reason: "Your recent workout intensity suggests you need active recovery to prevent overtraining.",
      difficulty: "beginner" as const,
      estimatedDuration: 20,
      targetStats: { stamina: 1 },
      exercises: recommendedExercises,
      score: 95, // High priority when recovery is needed
    };
  }

  private generateExerciseParams(exercise: any, profile: UserProfile, recovery: string): RecommendedExercise {
    const baseIntensity = this.getIntensityMultiplier(profile.level, recovery);
    
    // Adjust based on exercise category
    let sets = 3;
    let reps = 12;
    let restTime = 60;

    switch (exercise.category) {
      case "strength":
        sets = Math.floor(3 * baseIntensity);
        reps = Math.floor(8 + (profile.strength / 5));
        restTime = 90;
        break;
      case "cardio":
        sets = 1;
        reps = 1;
        restTime = 30;
        break;
      case "plyometric":
        sets = Math.floor(4 * baseIntensity);
        reps = Math.floor(6 + (profile.agility / 3));
        restTime = 120;
        break;
    }

    return {
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.muscleGroups,
      sets: Math.max(1, sets),
      reps: Math.max(1, reps),
      restTime,
      reason: this.getExerciseReason(exercise, profile),
    };
  }

  private getIntensityMultiplier(level: number, recovery: string): number {
    const baseMultiplier = Math.min(1.5, 0.5 + (level / 20));
    
    switch (recovery) {
      case "heavy": return baseMultiplier * 0.6;
      case "moderate": return baseMultiplier * 0.8;
      case "light": return baseMultiplier * 0.9;
      default: return baseMultiplier;
    }
  }

  private getDifficultyForProfile(profile: UserProfile): "beginner" | "intermediate" | "advanced" {
    const totalStats = profile.strength + profile.stamina + profile.agility;
    
    if (totalStats < 15) return "beginner";
    if (totalStats < 50) return "intermediate";
    return "advanced";
  }

  private calculateWorkoutDuration(exercises: RecommendedExercise[]): number {
    return exercises.reduce((total, ex) => {
      const exerciseTime = ex.sets * ((ex.duration || (ex.reps * 3)) + ex.restTime);
      return total + Math.floor(exerciseTime / 60);
    }, 0);
  }

  private getExerciseReason(exercise: any, profile: UserProfile): string {
    const reasons = [
      `Great for your current ${profile.fitnessGoal.replace("_", " ")} goal`,
      `Targets ${exercise.muscleGroups.join(", ")} effectively`,
      `Perfect for level ${profile.level} training`,
      `Builds your weakest stats`,
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  public async getRecommendationsForUser(userId: number): Promise<WorkoutRecommendation[]> {
    const profile = await this.getUserProfile(userId);
    return await this.generateRecommendations(profile);
  }
}

// Export singleton instance
export const workoutRecommendationEngine = new WorkoutRecommendationEngine();