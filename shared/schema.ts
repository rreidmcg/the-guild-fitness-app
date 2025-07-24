import { pgTable, text, serial, integer, boolean, json, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with character progression
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  strength: integer("strength").default(0),
  stamina: integer("stamina").default(0),
  agility: integer("agility").default(0),
  gold: integer("gold").default(0),
  battlesWon: integer("battles_won").default(0),
  // Health system
  currentHp: integer("current_hp").default(40), // Default HP for starting character
  lastHpUpdateAt: timestamp("last_hp_update_at").defaultNow(),
  // Magic Points system
  currentMp: integer("current_mp").default(20), // Default MP for starting character
  lastMpUpdateAt: timestamp("last_mp_update_at").defaultNow(),
  // Player tier and progression
  currentTier: text("current_tier").default("E"), // E, D, C, B, A, S
  highestTierCompleted: text("highest_tier_completed").default(""),
  currentTitle: text("current_title").default("Recruit"),
  // Streak system
  currentStreak: integer("current_streak").default(0),
  lastStreakDate: text("last_streak_date"), // YYYY-MM-DD format
  streakFreezeCount: integer("streak_freeze_count").default(0), // Max 2
  // Character customization - New armor slot system
  equippedHead: text("equipped_head"),
  equippedShoulders: text("equipped_shoulders"),
  equippedNeck: text("equipped_neck"),
  equippedChest: text("equipped_chest"),
  equippedHands: text("equipped_hands"),
  equippedWaist: text("equipped_waist"),
  equippedLegs: text("equipped_legs"),
  equippedFeet: text("equipped_feet"),
  skinColor: text("skin_color").default("#F5C6A0"),
  hairColor: text("hair_color").default("#8B4513"),
  gender: text("gender").default("male"),
  // Personal fitness information
  height: integer("height_cm"), // Height in centimeters
  weight: integer("weight_kg"), // Weight in kilograms
  fitnessGoal: text("fitness_goal"), // "lose_weight", "gain_muscle", "improve_endurance", "general_fitness"
  measurementUnit: text("measurement_unit").default("metric"), // "metric" or "imperial"
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

// Player inventory for consumable items
export const playerInventory = pgTable("player_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  itemType: text("item_type").notNull(), // "potion"
  itemName: text("item_name").notNull(), // "minor_healing", "major_healing", "full_healing"
  quantity: integer("quantity").default(0),
}, (table) => ({
  userItemIdx: uniqueIndex("user_item_idx").on(table.userId, table.itemType, table.itemName),
}));

// Daily quest progress tracking
export const dailyProgress = pgTable("daily_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  hydration: boolean("hydration").default(false),
  steps: boolean("steps").default(false),
  protein: boolean("protein").default(false),
  xpAwarded: boolean("xp_awarded").default(false), // Track if 5 XP was already given
  streakFreezeAwarded: boolean("streak_freeze_awarded").default(false), // Track if streak freeze was given
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userDateIdx: uniqueIndex("user_date_idx").on(table.userId, table.date),
}));

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
  category: text("category").notNull(), // 'head', 'shoulders', 'neck', 'chest', 'hands', 'waist', 'legs', 'feet'
  rarity: text("rarity").default("common"), // 'common', 'rare', 'epic', 'legendary'
  price: integer("price").default(0), // Gold cost
  unlockLevel: integer("unlock_level").default(1), // Level required to unlock
  color: text("color").notNull(), // Hex color for the item
  description: text("description"),
  statBonus: json("stat_bonus").$type<{
    strength?: number;
    stamina?: number;
    agility?: number;
  }>().default({}), // Stat bonuses for equipment
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

// Monsters for the battle system
export const monsters = pgTable("monsters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tier: text("tier").notNull(), // E, D, C, B, A, S
  level: integer("level").notNull(),
  maxHp: integer("max_hp").notNull(),
  attack: integer("attack").notNull(),
  goldReward: integer("gold_reward").default(0),
  description: text("description"),
  isBoss: boolean("is_boss").default(false),
});

// User achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // workout_streak, pr, volume, tier_clear, etc.
  requirement: integer("requirement").notNull(), // threshold to unlock
  goldReward: integer("gold_reward").default(0),
  title: text("title"), // optional title unlock
});

// User's unlocked achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
}, (table) => ({
  userAchievementUnique: uniqueIndex("user_achievement_idx").on(table.userId, table.achievementId),
}));

// Player abilities/skills
export const abilities = pgTable("abilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // attack, defense, heal, buff
  unlockTier: text("unlock_tier").notNull(), // E, D, C, B, A, S
  cooldown: integer("cooldown").default(0),
  effect: json("effect").$type<{
    damage?: number;
    healing?: number;
    buffType?: string;
    buffAmount?: number;
    duration?: number;
  }>().notNull(),
});

// User's unlocked abilities
export const userAbilities = pgTable("user_abilities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  abilityId: integer("ability_id").references(() => abilities.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
}, (table) => ({
  userAbilityUnique: uniqueIndex("user_ability_idx").on(table.userId, table.abilityId),
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

export const insertMonsterSchema = createInsertSchema(monsters).omit({
  id: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertAbilitySchema = createInsertSchema(abilities).omit({
  id: true,
});

export const insertUserAbilitySchema = createInsertSchema(userAbilities).omit({
  id: true,
  unlockedAt: true,
});

export const insertPlayerInventorySchema = createInsertSchema(playerInventory).omit({
  id: true,
});

export const insertExercisePerformanceSchema = createInsertSchema(exercisePerformances).omit({
  id: true,
});

export const insertPersonalRecordSchema = createInsertSchema(personalRecords).omit({
  id: true,
  achievedAt: true,
});

export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({
  id: true,
  createdAt: true,
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
export type Monster = typeof monsters.$inferSelect;
export type InsertMonster = z.infer<typeof insertMonsterSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type Ability = typeof abilities.$inferSelect;
export type InsertAbility = z.infer<typeof insertAbilitySchema>;
export type UserAbility = typeof userAbilities.$inferSelect;
export type InsertUserAbility = z.infer<typeof insertUserAbilitySchema>;
export type PlayerInventory = typeof playerInventory.$inferSelect;
export type InsertPlayerInventory = z.infer<typeof insertPlayerInventorySchema>;
export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
