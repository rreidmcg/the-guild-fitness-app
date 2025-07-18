import { 
  users, exercises, workouts, workoutSessions, exercisePerformances, personalRecords, workoutPrograms, programWorkouts,
  type User, type InsertUser, type Exercise, type InsertExercise, 
  type Workout, type InsertWorkout, type WorkoutSession, type InsertWorkoutSession,
  type ExercisePerformance, type InsertExercisePerformance,
  type PersonalRecord, type InsertPersonalRecord,
  type WorkoutProgram, type InsertWorkoutProgram,
  type ProgramWorkout, type InsertProgramWorkout
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  // Exercise operations
  getAllExercises(): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;

  // Workout operations
  getUserWorkouts(userId: number): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, updates: Partial<Workout>): Promise<Workout>;
  deleteWorkout(id: number): Promise<void>;

  // Workout session operations
  getUserWorkoutSessions(userId: number): Promise<WorkoutSession[]>;
  getWorkoutSession(id: number): Promise<WorkoutSession | undefined>;
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;

  // Exercise performance operations
  getSessionPerformances(sessionId: number): Promise<ExercisePerformance[]>;
  createExercisePerformance(performance: InsertExercisePerformance): Promise<ExercisePerformance>;

  // Personal records
  getUserPersonalRecords(userId: number): Promise<PersonalRecord[]>;
  createPersonalRecord(record: InsertPersonalRecord): Promise<PersonalRecord>;
  updatePersonalRecord(id: number, updates: Partial<PersonalRecord>): Promise<PersonalRecord>;

  // Workout programs
  getAllWorkoutPrograms(): Promise<WorkoutProgram[]>;
  getWorkoutProgram(id: number): Promise<WorkoutProgram | undefined>;
  getProgramWorkouts(programId: number): Promise<ProgramWorkout[]>;
}

export class DatabaseStorage implements IStorage {
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeDefaultExercises();
      this.initialized = true;
    }
  }

  private async initializeDefaultExercises() {
    // Check if exercises already exist
    const existingExercises = await db.select().from(exercises).limit(1);
    if (existingExercises.length > 0) return;

    const defaultExercises = [
      { name: "Bench Press", category: "strength", muscleGroups: ["chest", "triceps", "shoulders"], description: "Chest pressing exercise", statTypes: { strength: 3 } },
      { name: "Deadlift", category: "strength", muscleGroups: ["back", "legs", "core"], description: "Full body compound movement", statTypes: { strength: 3 } },
      { name: "Squats", category: "strength", muscleGroups: ["legs", "glutes", "core"], description: "Lower body compound exercise", statTypes: { strength: 3 } },
      { name: "Pull-ups", category: "strength", muscleGroups: ["back", "biceps"], description: "Upper body pulling exercise", statTypes: { strength: 2, agility: 1 } },
      { name: "Push-ups", category: "strength", muscleGroups: ["chest", "triceps", "shoulders"], description: "Bodyweight pushing exercise", statTypes: { strength: 2, stamina: 1 } },
      { name: "Running", category: "cardio", muscleGroups: ["legs", "core"], description: "Cardiovascular endurance", statTypes: { stamina: 3 } },
      { name: "Cycling", category: "cardio", muscleGroups: ["legs"], description: "Low impact cardio", statTypes: { stamina: 2, strength: 1 } },
      { name: "Burpees", category: "plyometric", muscleGroups: ["full body"], description: "High intensity full body", statTypes: { stamina: 1, agility: 2 } },
      { name: "Plank", category: "core", muscleGroups: ["core", "shoulders"], description: "Core stability exercise", statTypes: { strength: 1, stamina: 2 } },
      { name: "Box Jumps", category: "plyometric", muscleGroups: ["legs", "glutes"], description: "Explosive jump training", statTypes: { agility: 3 } },
      { name: "Power Clean", category: "olympic", muscleGroups: ["full body"], description: "Olympic lifting movement", statTypes: { strength: 1, stamina: 1, agility: 1 } },
      { name: "Mountain Climbers", category: "cardio", muscleGroups: ["core", "shoulders", "legs"], description: "High intensity cardio", statTypes: { stamina: 2, agility: 1 } },
    ];

    try {
      await db.insert(exercises).values(defaultExercises);
    } catch (error) {
      console.log("Default exercises already exist or error inserting:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  // Exercise operations
  async getAllExercises(): Promise<Exercise[]> {
    await this.ensureInitialized();
    return await db.select().from(exercises);
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise || undefined;
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const [exercise] = await db
      .insert(exercises)
      .values(insertExercise)
      .returning();
    return exercise;
  }

  // Workout operations
  async getUserWorkouts(userId: number): Promise<Workout[]> {
    return await db.select().from(workouts).where(eq(workouts.userId, userId));
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout || undefined;
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const [workout] = await db
      .insert(workouts)
      .values(insertWorkout)
      .returning();
    return workout;
  }

  async updateWorkout(id: number, updates: Partial<Workout>): Promise<Workout> {
    const [workout] = await db
      .update(workouts)
      .set(updates)
      .where(eq(workouts.id, id))
      .returning();
    if (!workout) throw new Error("Workout not found");
    return workout;
  }

  async deleteWorkout(id: number): Promise<void> {
    await db.delete(workouts).where(eq(workouts.id, id));
  }

  // Workout session operations
  async getUserWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    return await db.select().from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(workoutSessions.completedAt);
  }

  async getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id));
    return session || undefined;
  }

  async createWorkoutSession(insertSession: InsertWorkoutSession): Promise<WorkoutSession> {
    const [session] = await db
      .insert(workoutSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  // Exercise performance operations
  async getSessionPerformances(sessionId: number): Promise<ExercisePerformance[]> {
    return await db.select().from(exercisePerformances).where(eq(exercisePerformances.sessionId, sessionId));
  }

  async createExercisePerformance(insertPerformance: InsertExercisePerformance): Promise<ExercisePerformance> {
    const [performance] = await db
      .insert(exercisePerformances)
      .values(insertPerformance)
      .returning();
    return performance;
  }

  // Personal records
  async getUserPersonalRecords(userId: number): Promise<PersonalRecord[]> {
    return await db.select().from(personalRecords).where(eq(personalRecords.userId, userId));
  }

  async createPersonalRecord(insertRecord: InsertPersonalRecord): Promise<PersonalRecord> {
    const [record] = await db
      .insert(personalRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  async updatePersonalRecord(id: number, updates: Partial<PersonalRecord>): Promise<PersonalRecord> {
    const [record] = await db
      .update(personalRecords)
      .set(updates)
      .where(eq(personalRecords.id, id))
      .returning();
    if (!record) throw new Error("Personal record not found");
    return record;
  }

  // Workout program operations
  async getAllWorkoutPrograms(): Promise<WorkoutProgram[]> {
    return await db.select().from(workoutPrograms).orderBy(workoutPrograms.createdAt);
  }

  async getWorkoutProgram(id: number): Promise<WorkoutProgram | undefined> {
    const [program] = await db.select().from(workoutPrograms).where(eq(workoutPrograms.id, id));
    return program || undefined;
  }

  async getProgramWorkouts(programId: number): Promise<ProgramWorkout[]> {
    return await db.select().from(programWorkouts)
      .where(eq(programWorkouts.programId, programId))
      .orderBy(programWorkouts.weekNumber, programWorkouts.dayName);
  }
}

export const storage = new DatabaseStorage();
