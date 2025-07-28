import OpenAI from "openai";
import { storage } from "./storage";
import type { WorkoutPreferences, Exercise, WorkoutFeedback } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface WorkoutRecommendation {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDuration: number;
  targetMuscleGroups: string[];
  exercises: Array<{
    exerciseId: number;
    sets: number;
    reps: number;
    weight?: number;
    duration?: number;
    restTime?: number;
    notes?: string;
  }>;
  aiReasoning: string;
  adaptationTips: string[];
}

class AIWorkoutEngine {
  async generateRecommendations(userId: number): Promise<WorkoutRecommendation[]> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found");

    const preferences = await storage.getUserWorkoutPreferences(userId);
    const recentFeedback = await storage.getRecentWorkoutFeedback(userId, 10);
    const userStats = await storage.getUserStats(userId);
    const availableExercises = await storage.getExercises();

    // Build context for AI
    const userContext = this.buildUserContext(user, preferences, recentFeedback, userStats);
    const exerciseDatabase = this.buildExerciseContext(availableExercises);

    const prompt = `You are an expert fitness AI trainer creating personalized workout recommendations. Generate 3 different workout options for this user.

USER PROFILE:
${userContext}

AVAILABLE EXERCISES:
${exerciseDatabase}

REQUIREMENTS:
1. Create exactly 3 distinct workout recommendations
2. Each workout should be optimized for the user's equipment, fitness level, and preferences
3. Consider recent feedback to avoid exercises they found too difficult/easy
4. Balance muscle groups and training styles
5. Provide clear reasoning for each recommendation
6. Include adaptation tips for progressive overload
7. Respond in valid JSON format

JSON STRUCTURE:
{
  "recommendations": [
    {
      "name": "Workout Name",
      "description": "Brief description of workout focus",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedDuration": 45,
      "targetMuscleGroups": ["chest", "triceps", "shoulders"],
      "exercises": [
        {
          "exerciseId": 1,
          "sets": 3,
          "reps": 12,
          "weight": 0,
          "restTime": 60,
          "notes": "Focus on form over weight"
        }
      ],
      "aiReasoning": "Why this workout was recommended",
      "adaptationTips": ["How to progress", "Modifications available"]
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert fitness trainer with deep knowledge of exercise science, progressive overload, and personalized programming. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return result.recommendations.map((rec: any, index: number) => ({
        ...rec,
        id: `ai_${Date.now()}_${index}`,
      }));

    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      throw new Error("Failed to generate AI workout recommendations");
    }
  }

  private buildUserContext(user: any, preferences: WorkoutPreferences | null, feedback: WorkoutFeedback[], stats: any): string {
    const fitnessLevel = preferences?.fitnessLevel || "beginner";
    const equipmentAccess = preferences?.equipmentAccess || "home_gym";
    const workoutsPerWeek = preferences?.workoutsPerWeek || 3;
    const sessionDuration = preferences?.sessionDuration || 45;
    const trainingStyle = preferences?.trainingStyle || "balanced";

    let context = `
- Fitness Level: ${fitnessLevel}
- Equipment Access: ${equipmentAccess}
- Preferred Workouts Per Week: ${workoutsPerWeek}
- Preferred Session Duration: ${sessionDuration} minutes
- Training Style: ${trainingStyle}
- Current Stats: Strength ${stats.strength}, Stamina ${stats.stamina}, Agility ${stats.agility}
- Character Level: ${user.level}`;

    if (preferences?.injuriesLimitations?.length) {
      context += `\n- Injuries/Limitations: ${preferences.injuriesLimitations.join(", ")}`;
    }

    if (preferences?.preferredMuscleGroups?.length) {
      context += `\n- Preferred Muscle Groups: ${preferences.preferredMuscleGroups.join(", ")}`;
    }

    if (preferences?.avoidedExercises?.length) {
      context += `\n- Avoided Exercises: ${preferences.avoidedExercises.join(", ")}`;
    }

    if (feedback.length > 0) {
      context += `\n\nRECENT WORKOUT FEEDBACK:`;
      feedback.slice(0, 5).forEach((fb, i) => {
        context += `\nWorkout ${i + 1}: Difficulty ${fb.difficultyRating}/10, Volume: ${fb.volumeFeedback}, Intensity: ${fb.intensityFeedback}`;
        if (fb.notes) context += ` - Notes: ${fb.notes}`;
      });
    }

    return context;
  }

  private buildExerciseContext(exercises: Exercise[]): string {
    return exercises.map(ex => 
      `ID: ${ex.id}, Name: "${ex.name}", Category: ${ex.category}, Muscles: ${ex.muscleGroups.join(", ")}, Stats: ${Object.entries(ex.statTypes).map(([k,v]) => `${k}:${v}`).join(",")}`
    ).join("\n");
  }

  async adaptWorkoutBasedOnFeedback(
    originalRecommendation: WorkoutRecommendation,
    feedback: WorkoutFeedback
  ): Promise<WorkoutRecommendation> {
    const prompt = `Based on user feedback, adapt this workout recommendation:

ORIGINAL WORKOUT:
${JSON.stringify(originalRecommendation, null, 2)}

USER FEEDBACK:
- Difficulty Rating: ${feedback.difficultyRating}/10
- Volume Feedback: ${feedback.volumeFeedback}
- Intensity Feedback: ${feedback.intensityFeedback}
- Notes: ${feedback.notes || "None"}

ADAPTATION RULES:
- If difficulty > 7: Reduce sets/reps/weight by 10-15%
- If difficulty < 4: Increase sets/reps/weight by 10-15%
- If volume "too_much": Reduce total sets by 1-2
- If volume "too_little": Add 1-2 sets or additional exercise
- If intensity "too_hard": Reduce weight, increase rest times
- If intensity "too_easy": Increase weight, reduce rest times

Respond with adapted workout in same JSON format.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert fitness trainer adapting workouts based on user feedback. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        ...result,
        id: `adapted_${Date.now()}`,
        aiReasoning: `Adapted based on feedback: ${result.adaptationReasoning || "General adjustments made"}`,
      };

    } catch (error) {
      console.error("Error adapting workout:", error);
      // Return original if adaptation fails
      return originalRecommendation;
    }
  }

  async generateEquipmentAlternatives(exerciseId: number, targetEquipment: string): Promise<Exercise[]> {
    const exercise = await storage.getExercise(exerciseId);
    if (!exercise) return [];

    const allExercises = await storage.getExercises();
    
    // Filter exercises that target similar muscle groups but work with different equipment
    const alternatives = allExercises.filter(ex => 
      ex.id !== exerciseId &&
      ex.muscleGroups.some(muscle => exercise.muscleGroups.includes(muscle)) &&
      this.exerciseMatchesEquipment(ex, targetEquipment)
    );

    return alternatives.slice(0, 5); // Return top 5 alternatives
  }

  private exerciseMatchesEquipment(exercise: Exercise, equipment: string): boolean {
    const exerciseName = exercise.name.toLowerCase();
    
    switch (equipment) {
      case "bodyweight_only":
        return !exerciseName.includes("dumbbell") && 
               !exerciseName.includes("barbell") && 
               !exerciseName.includes("machine") &&
               !exerciseName.includes("cable");
      
      case "home_gym":
        return !exerciseName.includes("machine") && 
               !exerciseName.includes("cable");
      
      case "full_gym":
        return true; // All exercises available
      
      default:
        return true;
    }
  }
}

export const aiWorkoutEngine = new AIWorkoutEngine();