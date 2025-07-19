import { pgTable, text, serial, integer, boolean, json, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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
  gold: integer("gold").default(0),
  // Character customization
  equippedHat: text("equipped_hat"),
  equippedShirt: text("equipped_shirt"),
  equippedPants: text("equipped_pants"),
  equippedShoes: text("equipped_shoes"),
  skinColor: text("skin_color").default("#F5C6A0"),
  hairColor: text("hair_color").default("#8B4513"),
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

// Workout programs (structured fitness plans)
export const workoutPrograms = pgTable("workout_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  durationWeeks: integer("duration_weeks"),
  difficultyLevel: text("difficulty_level"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Program workouts (individual sessions within programs)
export const programWorkouts = pgTable("program_workouts", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => workoutPrograms.id),
  weekNumber: integer("week_number"),
  dayName: text("day_name"),
  workoutName: text("workout_name"),
  exercises: json("exercises").$type<Array<{
    name: string;
    reps?: string;
    duration?: string;
    holdTime?: string;
    instructions?: string;
  }>>().notNull(),
  instructions: text("instructions"),
  rounds: integer("rounds"),
  restSeconds: integer("rest_seconds"),
});

// Wardrobe items that users can unlock/purchase
export const wardrobeItems = pgTable("wardrobe_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'hat', 'shirt', 'pants', 'shoes'
  rarity: text("rarity").default("common"), // 'common', 'rare', 'epic', 'legendary'
  price: integer("price").default(0), // Gold cost
  unlockLevel: integer("unlock_level").default(1), // Level required to unlock
  color: text("color").notNull(), // Hex color for the item
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User's wardrobe collection (unlocked items)
export const userWardrobe = pgTable("user_wardrobe", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  wardrobeItemId: integer("wardrobe_item_id").references(() => wardrobeItems.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
}, (table) => ({
  userItemUnique: uniqueIndex("user_wardrobe_user_item_idx").on(table.userId, table.wardrobeItemId),
}));

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

export const insertWardrobeItemSchema = createInsertSchema(wardrobeItems).omit({
  id: true,
  createdAt: true,
});

export const insertUserWardrobeSchema = createInsertSchema(userWardrobe).omit({
  id: true,
  unlockedAt: true,
});

export const insertExercisePerformanceSchema = createInsertSchema(exercisePerformances).omit({
  id: true,
});

export const insertPersonalRecordSchema = createInsertSchema(personalRecords).omit({
  id: true,
  achievedAt: true,
});

export const insertWorkoutProgramSchema = createInsertSchema(workoutPrograms).omit({
  id: true,
  createdAt: true,
});

export const insertProgramWorkoutSchema = createInsertSchema(programWorkouts).omit({
  id: true,
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
export type WorkoutProgram = typeof workoutPrograms.$inferSelect;
export type InsertWorkoutProgram = z.infer<typeof insertWorkoutProgramSchema>;
export type ProgramWorkout = typeof programWorkouts.$inferSelect;
export type InsertProgramWorkout = z.infer<typeof insertProgramWorkoutSchema>;
export type WardrobeItem = typeof wardrobeItems.$inferSelect;
export type InsertWardrobeItem = z.infer<typeof insertWardrobeItemSchema>;
export type UserWardrobe = typeof userWardrobe.$inferSelect;
export type InsertUserWardrobe = z.infer<typeof insertUserWardrobeSchema>;
