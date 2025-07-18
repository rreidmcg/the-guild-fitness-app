import { 
  users, exercises, workouts, workoutSessions, exercisePerformances, personalRecords,
  type User, type InsertUser, type Exercise, type InsertExercise, 
  type Workout, type InsertWorkout, type WorkoutSession, type InsertWorkoutSession,
  type ExercisePerformance, type InsertExercisePerformance,
  type PersonalRecord, type InsertPersonalRecord
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private exercises: Map<number, Exercise> = new Map();
  private workouts: Map<number, Workout> = new Map();
  private workoutSessions: Map<number, WorkoutSession> = new Map();
  private exercisePerformances: Map<number, ExercisePerformance> = new Map();
  private personalRecords: Map<number, PersonalRecord> = new Map();
  
  private currentUserId = 1;
  private currentExerciseId = 1;
  private currentWorkoutId = 1;
  private currentSessionId = 1;
  private currentPerformanceId = 1;
  private currentRecordId = 1;

  constructor() {
    this.initializeDefaultExercises();
  }

  private initializeDefaultExercises() {
    const defaultExercises = [
      { name: "Bench Press", category: "strength", muscleGroups: ["chest", "triceps", "shoulders"], description: "Chest pressing exercise", statType: "strength" },
      { name: "Deadlift", category: "strength", muscleGroups: ["back", "legs", "core"], description: "Full body compound movement", statType: "strength" },
      { name: "Squats", category: "strength", muscleGroups: ["legs", "glutes", "core"], description: "Lower body compound exercise", statType: "strength" },
      { name: "Pull-ups", category: "strength", muscleGroups: ["back", "biceps"], description: "Upper body pulling exercise", statType: "strength" },
      { name: "Push-ups", category: "strength", muscleGroups: ["chest", "triceps", "shoulders"], description: "Bodyweight pushing exercise", statType: "strength" },
      { name: "Running", category: "cardio", muscleGroups: ["legs", "core"], description: "Cardiovascular endurance", statType: "endurance" },
      { name: "Cycling", category: "cardio", muscleGroups: ["legs"], description: "Low impact cardio", statType: "stamina" },
      { name: "Yoga Flow", category: "flexibility", muscleGroups: ["full body"], description: "Flexibility and balance", statType: "flexibility" },
      { name: "Plank", category: "core", muscleGroups: ["core", "shoulders"], description: "Core stability exercise", statType: "endurance" },
      { name: "Burpees", category: "cardio", muscleGroups: ["full body"], description: "High intensity full body", statType: "stamina" },
    ];

    defaultExercises.forEach(exercise => {
      this.createExercise(exercise);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      level: 1,
      experience: 0,
      strength: 0,
      stamina: 0,
      endurance: 0,
      flexibility: 0,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Exercise operations
  async getAllExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values());
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const exercise: Exercise = {
      ...insertExercise,
      id: this.currentExerciseId++,
    };
    this.exercises.set(exercise.id, exercise);
    return exercise;
  }

  // Workout operations
  async getUserWorkouts(userId: number): Promise<Workout[]> {
    return Array.from(this.workouts.values()).filter(workout => workout.userId === userId);
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const workout: Workout = {
      ...insertWorkout,
      id: this.currentWorkoutId++,
      createdAt: new Date(),
    };
    this.workouts.set(workout.id, workout);
    return workout;
  }

  async updateWorkout(id: number, updates: Partial<Workout>): Promise<Workout> {
    const workout = this.workouts.get(id);
    if (!workout) throw new Error("Workout not found");
    
    const updatedWorkout = { ...workout, ...updates };
    this.workouts.set(id, updatedWorkout);
    return updatedWorkout;
  }

  async deleteWorkout(id: number): Promise<void> {
    this.workouts.delete(id);
  }

  // Workout session operations
  async getUserWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    return Array.from(this.workoutSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
  }

  async getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    return this.workoutSessions.get(id);
  }

  async createWorkoutSession(insertSession: InsertWorkoutSession): Promise<WorkoutSession> {
    const session: WorkoutSession = {
      ...insertSession,
      id: this.currentSessionId++,
      completedAt: new Date(),
    };
    this.workoutSessions.set(session.id, session);
    return session;
  }

  // Exercise performance operations
  async getSessionPerformances(sessionId: number): Promise<ExercisePerformance[]> {
    return Array.from(this.exercisePerformances.values()).filter(perf => perf.sessionId === sessionId);
  }

  async createExercisePerformance(insertPerformance: InsertExercisePerformance): Promise<ExercisePerformance> {
    const performance: ExercisePerformance = {
      ...insertPerformance,
      id: this.currentPerformanceId++,
    };
    this.exercisePerformances.set(performance.id, performance);
    return performance;
  }

  // Personal records
  async getUserPersonalRecords(userId: number): Promise<PersonalRecord[]> {
    return Array.from(this.personalRecords.values()).filter(record => record.userId === userId);
  }

  async createPersonalRecord(insertRecord: InsertPersonalRecord): Promise<PersonalRecord> {
    const record: PersonalRecord = {
      ...insertRecord,
      id: this.currentRecordId++,
      achievedAt: new Date(),
    };
    this.personalRecords.set(record.id, record);
    return record;
  }

  async updatePersonalRecord(id: number, updates: Partial<PersonalRecord>): Promise<PersonalRecord> {
    const record = this.personalRecords.get(id);
    if (!record) throw new Error("Personal record not found");
    
    const updatedRecord = { ...record, ...updates };
    this.personalRecords.set(id, updatedRecord);
    return updatedRecord;
  }
}

export const storage = new MemStorage();
