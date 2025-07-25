/**
 * Workout Validation and XP Allocation System
 * Balances effort validation with reasonable rewards using multiple validation layers
 */

import { allocateSessionXP, type ActivityInput } from "../shared/stat-allocation.js";

export interface WorkoutValidationConfig {
  // Minimum thresholds to prevent trivial workouts
  minWorkoutDuration: number; // minutes
  minSetsPerExercise: number;
  minRepsPerSet: Record<string, number>; // by exercise category
  minVolume: number; // total weight moved
  
  // RPE validation ranges
  maxRPE: number;
  minRPE: number;
  
  // Time-based validation
  maxWorkoutDuration: number; // prevent impossible long sessions
  minRestBetweenSets: number; // seconds
}

const DEFAULT_CONFIG: WorkoutValidationConfig = {
  minWorkoutDuration: 5, // at least 5 minutes
  minSetsPerExercise: 1,
  minRepsPerSet: {
    strength: 1,
    cardio: 30, // seconds of cardio
    core: 5,
    plyometric: 3,
    balance: 10, // seconds
    flexibility: 15 // seconds
  },
  minVolume: 0, // allow bodyweight exercises
  maxRPE: 10,
  minRPE: 1,
  maxWorkoutDuration: 300, // 5 hours max
  minRestBetweenSets: 0 // allow circuit training
};

export interface ExercisePerformanceInput {
  exerciseId: number;
  exercise: {
    name: string;
    category: string;
    statTypes: { strength?: number; stamina?: number; agility?: number };
  };
  sets: Array<{
    reps: number;
    weight?: number;
    duration?: number;
    completed: boolean;
  }>;
}

export interface WorkoutValidationResult {
  isValid: boolean;
  validationErrors: string[];
  xpMultiplier: number; // 0.1 to 2.0 based on validation confidence
  suspiciousReasons: string[];
}

/**
 * Multi-layer workout validation system
 */
export class WorkoutValidator {
  private config: WorkoutValidationConfig;

  constructor(config: WorkoutValidationConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Validate a workout session and calculate appropriate XP multiplier
   */
  validateWorkout(
    performances: ExercisePerformanceInput[],
    duration: number,
    userBodyweight: number,
    reportedRPE: number
  ): WorkoutValidationResult {
    const errors: string[] = [];
    const suspicious: string[] = [];
    let confidenceScore = 1.0;

    // 1. Basic validation
    if (duration < this.config.minWorkoutDuration) {
      errors.push(`Workout too short (${duration} min < ${this.config.minWorkoutDuration} min minimum)`);
    }

    if (duration > this.config.maxWorkoutDuration) {
      errors.push(`Workout impossibly long (${duration} min > ${this.config.maxWorkoutDuration} min maximum)`);
    }

    if (reportedRPE < this.config.minRPE || reportedRPE > this.config.maxRPE) {
      errors.push(`Invalid RPE: ${reportedRPE} (must be ${this.config.minRPE}-${this.config.maxRPE})`);
    }

    // 2. Exercise-level validation
    for (const performance of performances) {
      const category = performance.exercise.category;
      const minReps = this.config.minRepsPerSet[category] || 1;
      
      const completedSets = performance.sets.filter(set => set.completed);
      
      if (completedSets.length < this.config.minSetsPerExercise) {
        errors.push(`${performance.exercise.name}: Too few sets (${completedSets.length} < ${this.config.minSetsPerExercise})`);
        continue;
      }

      for (const set of completedSets) {
        // Check minimum reps/duration
        const actualWork = set.duration || set.reps;
        if (actualWork < minReps) {
          suspicious.push(`${performance.exercise.name}: Very low work (${actualWork} < ${minReps} expected)`);
          confidenceScore *= 0.7; // Reduce confidence but don't invalidate
        }

        // Check for impossible performance
        if (category === "strength" && set.weight && set.weight > userBodyweight * 3) {
          suspicious.push(`${performance.exercise.name}: Very heavy weight (${set.weight}lbs vs ${userBodyweight}lbs bodyweight)`);
          confidenceScore *= 0.8;
        }
      }
    }

    // 3. Consistency validation
    const totalVolume = this.calculateTotalVolume(performances);
    const workoutIntensity = this.estimateWorkoutIntensity(performances, duration);
    
    // Check RPE vs calculated intensity consistency
    const expectedRPE = this.estimateRPEFromIntensity(workoutIntensity);
    const rpeDifference = Math.abs(reportedRPE - expectedRPE);
    
    if (rpeDifference > 3) {
      suspicious.push(`RPE mismatch: reported ${reportedRPE} vs estimated ${expectedRPE.toFixed(1)}`);
      confidenceScore *= 0.85;
    }

    // 4. Time-based plausibility
    const estimatedMinDuration = this.estimateMinimumDuration(performances);
    if (duration < estimatedMinDuration * 0.5) {
      suspicious.push(`Very fast workout: ${duration}min vs ${estimatedMinDuration.toFixed(1)}min estimated minimum`);
      confidenceScore *= 0.6;
    }

    // 5. Calculate final XP multiplier
    let xpMultiplier = Math.max(0.1, Math.min(2.0, confidenceScore));
    
    // Bonus for longer, well-structured workouts
    if (duration >= 30 && rpeDifference <= 1 && suspicious.length === 0) {
      xpMultiplier = Math.min(2.0, xpMultiplier * 1.2);
    }

    return {
      isValid: errors.length === 0,
      validationErrors: errors,
      xpMultiplier,
      suspiciousReasons: suspicious
    };
  }

  /**
   * Calculate validated XP using the sophisticated stat allocation system
   */
  calculateValidatedXP(
    performances: ExercisePerformanceInput[],
    duration: number,
    userBodyweight: number,
    reportedRPE: number
  ): {
    xpTotal: number;
    xpStr: number;
    xpSta: number;
    xpAgi: number;
    validation: WorkoutValidationResult;
  } {
    const validation = this.validateWorkout(performances, duration, userBodyweight, reportedRPE);
    
    if (!validation.isValid) {
      // Return minimal XP for invalid workouts
      return {
        xpTotal: 0,
        xpStr: 0,
        xpSta: 0,
        xpAgi: 0,
        validation
      };
    }

    // Convert to activities for the stat allocation engine
    const activities: ActivityInput[] = performances.flatMap(performance => {
      return performance.sets
        .filter(set => set.completed)
        .map(set => {
          const activity: ActivityInput = {
            movement_type: this.getMovementType(performance.exercise.category),
            bodyweight_kg: userBodyweight * 0.453592, // Convert lbs to kg
            RPE: reportedRPE
          };

          if (performance.exercise.category === "strength" || performance.exercise.category === "core") {
            activity.sets = 1;
            activity.reps = set.reps;
            activity.load_kg = set.weight ? set.weight * 0.453592 : userBodyweight * 0.453592;
            activity.interval_seconds = this.estimateSetDuration(set.reps, set.weight);
          } else {
            activity.minutes = set.duration ? set.duration / 60 : this.estimateExerciseDuration(performance.exercise.category, set.reps);
          }

          return activity;
        });
    });

    // Calculate base XP using the sophisticated system
    const sessionResults = allocateSessionXP(activities);

    // Apply validation multiplier
    const multiplier = validation.xpMultiplier;
    
    return {
      xpTotal: Math.round(sessionResults.xp_total * multiplier),
      xpStr: Math.round(sessionResults.xp_str * multiplier),
      xpSta: Math.round(sessionResults.xp_sta * multiplier),
      xpAgi: Math.round(sessionResults.xp_agi * multiplier),
      validation
    };
  }

  private calculateTotalVolume(performances: ExercisePerformanceInput[]): number {
    return performances.reduce((total, performance) => {
      return total + performance.sets
        .filter(set => set.completed)
        .reduce((setTotal, set) => {
          const weight = set.weight || 0;
          const reps = set.reps || 0;
          return setTotal + (weight * reps);
        }, 0);
    }, 0);
  }

  private estimateWorkoutIntensity(performances: ExercisePerformanceInput[], duration: number): number {
    const totalSets = performances.reduce((total, p) => total + p.sets.filter(s => s.completed).length, 0);
    const setsPerMinute = totalSets / duration;
    
    // Normalize to 1-10 scale based on workout density
    return Math.min(10, Math.max(1, setsPerMinute * 3 + 2));
  }

  private estimateRPEFromIntensity(intensity: number): number {
    // Simple mapping from workout intensity to expected RPE
    return Math.min(10, Math.max(1, intensity * 0.8 + 1));
  }

  private estimateMinimumDuration(performances: ExercisePerformanceInput[]): number {
    let totalTime = 0;
    
    for (const performance of performances) {
      const completedSets = performance.sets.filter(set => set.completed);
      
      for (const set of completedSets) {
        // Add work time
        totalTime += set.duration || this.estimateSetDuration(set.reps, set.weight);
        // Add rest time (assume 60-90 seconds between sets)
        totalTime += 75;
      }
    }
    
    return totalTime / 60; // Convert to minutes
  }

  private estimateSetDuration(reps: number, weight?: number): number {
    // Estimate seconds per set based on reps and weight
    const baseTime = reps * 2; // 2 seconds per rep baseline
    const weightFactor = weight ? Math.log10(weight + 1) * 0.5 : 0;
    return baseTime + weightFactor;
  }

  private estimateExerciseDuration(category: string, reps: number): number {
    const baseDurations: Record<string, number> = {
      cardio: 2, // 2 seconds per "rep" for cardio
      plyometric: 3, // 3 seconds per explosive movement
      balance: 5, // 5 seconds per balance hold
      flexibility: 3 // 3 seconds per stretch rep
    };
    
    return (baseDurations[category] || 2) * reps;
  }

  private getMovementType(category: string): "resistance" | "cardio" | "skill" {
    if (category === "strength" || category === "core") return "resistance";
    if (category === "cardio") return "cardio";
    return "skill";
  }
}

// Export singleton instance
export const workoutValidator = new WorkoutValidator();