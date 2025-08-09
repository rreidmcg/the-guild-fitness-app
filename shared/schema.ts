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
  strengthXp: integer("strength_xp").default(0),
  stamina: integer("stamina").default(0),
  staminaXp: integer("stamina_xp").default(0),
  agility: integer("agility").default(0),
  agilityXp: integer("agility_xp").default(0),
  gold: integer("gold").default(0),
  gems: integer("gems").default(0), // Premium currency
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
  // Atrophy system
  lastActivityDate: text("last_activity_date"), // YYYY-MM-DD format - last workout, battle, or streak freeze
  atrophyImmunityUntil: text("atrophy_immunity_until"), // YYYY-MM-DD format - grace period for new users
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
  customAvatarUrl: text("custom_avatar_url"), // URL to custom avatar image
  // Personal fitness information
  height: integer("height_cm"), // Height in centimeters
  weight: integer("weight_kg"), // Weight in kilograms
  fitnessGoal: text("fitness_goal"), // "lose_weight", "gain_muscle", "improve_endurance", "general_fitness"
  measurementUnit: text("measurement_unit").default("metric"), // "metric" or "imperial"
  timezone: text("timezone"), // User's timezone for daily quest resets (e.g., "America/New_York")
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false), // Whether user has completed the onboarding flow
  // Subscription fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // "active", "inactive", "canceled", "past_due"
  subscriptionEndDate: timestamp("subscription_end_date"),
  // Purchased workout programs
  purchasedPrograms: text("purchased_programs").array().default([]), // Array of program IDs user has purchased
  // Liability waiver fields
  liabilityWaiverAccepted: boolean("liability_waiver_accepted").default(false),
  liabilityWaiverAcceptedAt: timestamp("liability_waiver_accepted_at"),
  liabilityWaiverIpAddress: text("liability_waiver_ip_address"),
  // Account moderation fields
  isBanned: boolean("is_banned").default(false),
  
  // Demo access
  isDemoAccount: boolean("is_demo_account").default(false),
  banReason: text("ban_reason"),
  bannedAt: timestamp("banned_at"),
  bannedUntil: timestamp("banned_until"), // null = permanent ban
  bannedBy: text("banned_by"), // admin username who issued the ban
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  deleteReason: text("delete_reason"),
  deletedBy: text("deleted_by"), // admin username who deleted the account
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
  // Updated to support sections, supersets, and better exercise data
  exercises: json("exercises").$type<Array<{
    exerciseId: number;
    sets: number;
    reps?: number;
    duration?: number; // for time-based exercises
    weight?: number;
    restTime?: number;
    section?: string; // section name (e.g., "Warm-up", "Main", "Cool-down")
    supersetGroup?: string; // identifier for superset grouping
    order?: number; // order within section
    fields?: string[]; // tracking fields like ['weight', 'RIR', 'RPE', 'reps'] etc.
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
  perceivedEffort: integer("perceived_effort"), // RPE scale 1-10
  exercises: json("exercises").$type<Array<{
    exerciseId: number;
    name: string;
    category?: string;
    sets: Array<{
      reps?: number;
      weight?: number;
      duration?: number;
      rpe?: number;
      completed: boolean;
    }>;
  }>>(), // Store exercise performance data
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

// User Exercise Preferences - stores personalized metrics for exercises
export const userExercisePreferences = pgTable("user_exercise_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  exerciseId: integer("exercise_id").references(() => exercises.id),
  preferredWeight: integer("preferred_weight"),
  preferredReps: integer("preferred_reps"),
  preferredDuration: integer("preferred_duration"),
  preferredRpe: integer("preferred_rpe"), // Preferred RIR/RPE
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userExerciseIdx: uniqueIndex("user_exercise_idx").on(table.userId, table.exerciseId),
}));

export const insertUserExercisePreferencesSchema = createInsertSchema(userExercisePreferences).omit({
  id: true,
  updatedAt: true,
});

export type UserExercisePreferences = typeof userExercisePreferences.$inferSelect;
export type InsertUserExercisePreferences = z.infer<typeof insertUserExercisePreferencesSchema>;

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
  sleep: boolean("sleep").default(false), // New sleep quest (7+ hours)
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
  durationWeeks: integer("duration_weeks").default(4),
  difficultyLevel: text("difficulty_level").notNull(), // "novice", "intermediate", "advanced"
  price: integer("price").default(997), // Price in cents ($9.97 = 997 cents)
  workoutsPerWeek: integer("workouts_per_week").default(3),
  estimatedDuration: integer("estimated_duration").default(45), // Minutes per workout
  targetAudience: text("target_audience"), // Description of who this program is for
  features: text("features").array().default([]), // Array of program features/benefits
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Program workouts (individual sessions within programs) - enhanced to match standalone workouts
export const programWorkouts = pgTable("program_workouts", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => workoutPrograms.id),
  weekNumber: integer("week_number").notNull(),
  dayNumber: integer("day_number").notNull(), // 1-7 for days of week
  name: text("name").notNull(),
  description: text("description"),
  // Updated to match standalone workout structure exactly
  exercises: json("exercises").$type<Array<{
    exerciseId: number;
    sets: number;
    reps?: number;
    duration?: number; // for time-based exercises
    weight?: number;
    restTime?: number;
    section?: string; // section name (e.g., "Warm-up", "Main", "Cool-down")
    supersetGroup?: string; // identifier for superset grouping
    order?: number; // order within section
    fields?: string[]; // tracking fields like ['weight', 'RIR', 'RPE', 'reps'] etc.
  }>>().notNull(),
  notes: text("notes"), // Additional instructions or notes
  estimatedDuration: integer("estimated_duration"), // Estimated duration in minutes
  createdAt: timestamp("created_at").defaultNow(),
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
  currentHp: integer("current_hp").notNull().default(0), // Current HP for battle tracking
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
  isViewed: boolean("is_viewed").default(false),
}, (table) => ({
  userAchievementUnique: uniqueIndex("user_achievement_idx").on(table.userId, table.achievementId),
}));

// User workout preferences for AI recommendations
export const workoutPreferences = pgTable("workout_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  equipmentAccess: text("equipment_access").notNull().default("home_gym"), // "full_gym", "home_gym", "bodyweight_only"
  workoutsPerWeek: integer("workouts_per_week").default(3),
  sessionDuration: integer("session_duration").default(45), // minutes
  fitnessLevel: text("fitness_level").default("beginner"), // "beginner", "intermediate", "advanced"
  injuriesLimitations: text("injuries_limitations").array().default([]),
  preferredMuscleGroups: text("preferred_muscle_groups").array().default([]),
  avoidedExercises: text("avoided_exercises").array().default([]),
  trainingStyle: text("training_style").default("balanced"), // "strength_focused", "cardio_focused", "balanced", "powerlifting"
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI-generated workout recommendations
export const workoutRecommendations = pgTable("workout_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  difficulty: text("difficulty").notNull(), // "beginner", "intermediate", "advanced"
  estimatedDuration: integer("estimated_duration"), // minutes
  targetMuscleGroups: text("target_muscle_groups").array().notNull(),
  exercises: json("exercises").$type<Array<{
    exerciseId: number;
    sets: number;
    reps: number;
    weight?: number;
    duration?: number;
    restTime?: number;
    notes?: string;
  }>>().notNull(),
  aiReasoning: text("ai_reasoning"), // Why this workout was recommended
  isCustomized: boolean("is_customized").default(false), // User modified the recommendation
  generatedAt: timestamp("generated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Recommendations expire after 1 week
});

// User feedback on workouts for AI learning
export const workoutFeedback = pgTable("workout_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  workoutSessionId: integer("workout_session_id").references(() => workoutSessions.id, { onDelete: "cascade" }),
  difficultyRating: integer("difficulty_rating"), // 1-10 scale
  volumeFeedback: text("volume_feedback"), // "too_much", "just_right", "too_little"
  intensityFeedback: text("intensity_feedback"), // "too_hard", "just_right", "too_easy"
  exerciseReplacements: json("exercise_replacements").$type<Array<{
    originalExerciseId: number;
    replacementExerciseId: number;
    reason: string;
  }>>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription history for analytics
export const subscriptionHistory = pgTable("subscription_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull(), // "active", "canceled", "past_due", "incomplete"
  planType: text("plan_type").default("premium_quarterly"), // "premium_quarterly"
  amount: integer("amount"), // in cents
  currency: text("currency").default("usd"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  canceledAt: timestamp("canceled_at"),
  cancelationReason: text("cancelation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  createdAt: true,
});

export const insertWorkoutPreferencesSchema = createInsertSchema(workoutPreferences).omit({
  id: true,
  updatedAt: true,
});

export const insertWorkoutRecommendationSchema = createInsertSchema(workoutRecommendations).omit({
  id: true,
  generatedAt: true,
});

export const insertWorkoutFeedbackSchema = createInsertSchema(workoutFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionHistorySchema = createInsertSchema(subscriptionHistory).omit({
  id: true,
  createdAt: true,
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
export type WorkoutPreferences = typeof workoutPreferences.$inferSelect;
export type InsertWorkoutPreferences = z.infer<typeof insertWorkoutPreferencesSchema>;
export type WorkoutRecommendation = typeof workoutRecommendations.$inferSelect;
export type InsertWorkoutRecommendation = z.infer<typeof insertWorkoutRecommendationSchema>;
export type WorkoutFeedback = typeof workoutFeedback.$inferSelect;
export type InsertWorkoutFeedback = z.infer<typeof insertWorkoutFeedbackSchema>;
export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;
export type InsertSubscriptionHistory = z.infer<typeof insertSubscriptionHistorySchema>;

// Player mail system
export const playerMail = pgTable("player_mail", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  senderType: text("sender_type").notNull(), // "admin", "system", "event"
  senderName: text("sender_name").notNull(), // "Developer Team", "System", etc.
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  mailType: text("mail_type", { enum: ["news", "reward", "announcement", "event"] }).notNull(),
  isRead: boolean("is_read").default(false),
  rewards: json("rewards").$type<{
    gold?: number;
    xp?: number;
    items?: Array<{
      itemType: string;
      itemName: string;
      quantity: number;
    }>;
  }>(),
  rewardsClaimed: boolean("rewards_claimed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiry date
});

// Social sharing system
export const socialShares = pgTable("social_shares", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  shareType: text("share_type").notNull(), // "workout", "achievement", "pr", "level_up"
  title: text("title").notNull(),
  description: text("description").notNull(),
  shareData: json("share_data").$type<{
    workoutName?: string;
    duration?: number;
    xpEarned?: number;
    achievementName?: string;
    prExercise?: string;
    prValue?: number;
    levelReached?: number;
    statsGained?: {
      strength?: number;
      stamina?: number;
      agility?: number;
    };
  }>(),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Magic links table for demo access
export const magicLinks = pgTable("magic_links", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isUsed: boolean("is_used").default(false),
  description: text("description"), // e.g., "Audit Demo Access"
});

// Social share likes
export const socialShareLikes = pgTable("social_share_likes", {
  id: serial("id").primaryKey(),
  shareId: integer("share_id").references(() => socialShares.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userShareLikeUnique: uniqueIndex("user_share_like_idx").on(table.userId, table.shareId),
}));

export const insertPlayerMailSchema = createInsertSchema(playerMail).omit({
  id: true,
  isRead: true,
  rewardsClaimed: true,
  createdAt: true,
});

export const insertSocialShareSchema = createInsertSchema(socialShares).omit({
  id: true,
  createdAt: true,
  likesCount: true,
});

export const insertSocialShareLikeSchema = createInsertSchema(socialShareLikes).omit({
  id: true,
  createdAt: true,
});

// Liability waivers table for record keeping
export const liabilityWaivers = pgTable("liability_waivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  acceptedAt: timestamp("accepted_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  waiverVersion: text("waiver_version").default("1.0"),
});

export const insertLiabilityWaiverSchema = createInsertSchema(liabilityWaivers).omit({
  id: true,
  acceptedAt: true,
});

// App requests/feedback system
export const appRequests = pgTable("app_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  category: text("category").notNull(), // "feature_request", "bug_report", "improvement", "general_feedback"
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "critical"
  status: text("status").notNull().default("submitted"), // "submitted", "reviewing", "in_progress", "completed", "declined"
  currentPage: text("current_page"), // Which page/section they were on when submitting
  deviceInfo: text("device_info"), // Browser/device information
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  adminNotes: text("admin_notes"),
});

export const insertAppRequestSchema = createInsertSchema(appRequests).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  adminNotes: true,
});

export type PlayerMail = typeof playerMail.$inferSelect;
export type InsertPlayerMail = z.infer<typeof insertPlayerMailSchema>;
export type SocialShare = typeof socialShares.$inferSelect;
export type InsertSocialShare = z.infer<typeof insertSocialShareSchema>;
export type SocialShareLike = typeof socialShareLikes.$inferSelect;
export type InsertSocialShareLike = z.infer<typeof insertSocialShareLikeSchema>;
export type LiabilityWaiver = typeof liabilityWaivers.$inferSelect;
export type InsertLiabilityWaiver = z.infer<typeof insertLiabilityWaiverSchema>;
export type AppRequest = typeof appRequests.$inferSelect;
export type InsertAppRequest = z.infer<typeof insertAppRequestSchema>;

// Shop items for real money and gem purchases
export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "gems", "streak_freeze", "consumables"
  price: integer("price").notNull(), // Price in cents for USD, or gem amount
  currency: text("currency").notNull(), // "usd", "gems"
  gemAmount: integer("gem_amount"), // For gem packs, how many gems this gives
  itemType: text("item_type"), // "gems", "streak_freeze", "potion"
  iconPath: text("icon_path"), // Path to item icon
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShopItemSchema = createInsertSchema(shopItems).omit({
  id: true,
  createdAt: true,
});

export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;

// Founders pack claims tracking
export const foundersPackClaims = pgTable("founders_pack_claims", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  claimNumber: integer("claim_number").notNull(), // 1-100 for first 100 claims
  claimedAt: timestamp("claimed_at").defaultNow(),
  paymentIntentId: text("payment_intent_id"),
});

export const insertFoundersPackClaimSchema = createInsertSchema(foundersPackClaims).omit({
  id: true,
  claimedAt: true,
});

export type FoundersPackClaim = typeof foundersPackClaims.$inferSelect;
export type InsertFoundersPackClaim = z.infer<typeof insertFoundersPackClaimSchema>;
