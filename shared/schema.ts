import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with character progression
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  strength: integer("strength").default(0),
  stamina: integer("stamina").default(0),
  agility: integer("agility").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exercise database
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // strength, cardio, plyometric, etc.
  muscleGroups: text("muscle_groups").array().notNull(),
  description: text("description"),
  statTypes: json("stat_types").$type<{
    strength?: number;
    stamina?: number;
    agility?: number;
  }>().notNull(), // Points awarded per stat type
});

// Workout templates
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  exercises: json("exercises").$type<Array<{
    exerciseId: number;
    sets: number;
    reps: number;
    weight?: number;
    duration?: number;
    restTime?: number;
  }>>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workout sessions (completed workouts)
export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  workoutId: integer("workout_id").references(() => workouts.id),
  name: text("name").notNull(),
  duration: integer("duration"), // in minutes
  totalVolume: integer("total_volume"), // total weight lifted
  xpEarned: integer("xp_earned").default(0),
  statsEarned: json("stats_earned").$type<{
    strength?: number;
    stamina?: number;
    agility?: number;
  }>().default({}),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Exercise performances in sessions
export const exercisePerformances = pgTable("exercise_performances", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => workoutSessions.id),
  exerciseId: integer("exercise_id").references(() => exercises.id),
  sets: json("sets").$type<Array<{
    reps: number;
    weight?: number;
    duration?: number;
    completed: boolean;
  }>>().notNull(),
  personalRecord: boolean("personal_record").default(false),
});

// Personal Records
export const personalRecords = pgTable("personal_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  exerciseId: integer("exercise_id").references(() => exercises.id),
  recordType: text("record_type").notNull(), // max_weight, max_reps, best_time, etc.
  value: integer("value").notNull(),
  achievedAt: timestamp("achieved_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutSessionSchema = createInsertSchema(workoutSessions).omit({
  id: true,
  completedAt: true,
});

export const insertExercisePerformanceSchema = createInsertSchema(exercisePerformances).omit({
  id: true,
});

export const insertPersonalRecordSchema = createInsertSchema(personalRecords).omit({
  id: true,
  achievedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type ExercisePerformance = typeof exercisePerformances.$inferSelect;
export type InsertExercisePerformance = z.infer<typeof insertExercisePerformanceSchema>;
export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertPersonalRecord = z.infer<typeof insertPersonalRecordSchema>;
