import { 
  users, exercises, workouts, workoutSessions, exercisePerformances, personalRecords, userExercisePreferences, workoutPrograms, programWorkouts, wardrobeItems, userWardrobe, dailyProgress, playerMail, achievements, userAchievements, socialShares, socialShareLikes, liabilityWaivers, workoutPreferences, workoutFeedback, monsters, appRequests,
  type User, type InsertUser, type Exercise, type InsertExercise, 
  type Workout, type InsertWorkout, type WorkoutSession, type InsertWorkoutSession,
  type ExercisePerformance, type InsertExercisePerformance,
  type PersonalRecord, type InsertPersonalRecord,
  type UserExercisePreferences, type InsertUserExercisePreferences,
  type WorkoutProgram, type InsertWorkoutProgram,
  type ProgramWorkout, type InsertProgramWorkout,
  type WardrobeItem, type InsertWardrobeItem,
  type UserWardrobe, type InsertUserWardrobe,
  type DailyProgress, type InsertDailyProgress,
  type PlayerMail, type InsertPlayerMail,
  type Achievement, type InsertAchievement,
  type UserAchievement, type InsertUserAchievement,
  type SocialShare, type InsertSocialShare,
  type SocialShareLike, type InsertSocialShareLike,
  type LiabilityWaiver, type InsertLiabilityWaiver,
  type WorkoutPreferences, type InsertWorkoutPreferences,
  type WorkoutFeedback, type InsertWorkoutFeedback,
  type Monster, type InsertMonster,
  type AppRequest, type InsertAppRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import { dailyResetService } from "./daily-reset-system.js";
import { applyStreakBonus } from "./streak-bonus.js";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getLeaderboard(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User>;

  // Exercise operations
  getExercises(): Promise<Exercise[]>;
  getAllExercises(): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;

  // Monster operations  
  getAllMonsters(): Promise<Monster[]>;
  getMonster(id: number): Promise<Monster | undefined>;
  createMonster(monster: InsertMonster): Promise<Monster>;
  updateMonster(id: number, updates: Partial<Monster>): Promise<Monster>;

  // Workout operations
  getUserWorkouts(userId: number): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, updates: Partial<Workout>): Promise<Workout>;
  deleteWorkout(id: number): Promise<void>;

  // Workout session operations
  getUserWorkoutSessions(userId: number): Promise<WorkoutSession[]>;
  getAllWorkoutSessions(): Promise<WorkoutSession[]>;
  getWorkoutSession(id: number): Promise<WorkoutSession | undefined>;
  getWorkoutSessionById(sessionId: number, userId: number): Promise<WorkoutSession & { exercises: any[] } | undefined>;
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;

  // Exercise performance operations
  getSessionPerformances(sessionId: number): Promise<ExercisePerformance[]>;
  createExercisePerformance(performance: InsertExercisePerformance): Promise<ExercisePerformance>;

  // Personal records
  getUserPersonalRecords(userId: number): Promise<PersonalRecord[]>;
  createPersonalRecord(record: InsertPersonalRecord): Promise<PersonalRecord>;
  updatePersonalRecord(id: number, updates: Partial<PersonalRecord>): Promise<PersonalRecord>;

  // User exercise preferences
  getUserExercisePreferences(userId: number): Promise<UserExercisePreferences[]>;
  getUserExercisePreference(userId: number, exerciseId: number): Promise<UserExercisePreferences | undefined>;
  upsertUserExercisePreference(preference: InsertUserExercisePreferences): Promise<UserExercisePreferences>;

  // Workout programs
  getAllWorkoutPrograms(): Promise<WorkoutProgram[]>;
  getWorkoutProgram(id: number): Promise<WorkoutProgram | undefined>;
  getProgramWorkouts(programId: number): Promise<ProgramWorkout[]>;
  getUserPurchasedPrograms(userId: number): Promise<string[]>;
  purchaseWorkoutProgram(userId: number, programId: string): Promise<User>;

  // Shop system
  getAllShopItems(): Promise<any[]>;
  purchaseShopItem(userId: number, itemId: number): Promise<{ success: boolean; message: string }>;
  addGems(userId: number, amount: number): Promise<User>;
  purchaseStreakFreeze(userId: number): Promise<{ success: boolean; message: string }>;
  
  // Founders pack
  getFoundersPackClaimCount(): Promise<number>;
  canUserClaimFoundersPack(userId: number): Promise<boolean>;
  claimFoundersPack(userId: number, paymentIntentId: string): Promise<{ success: boolean; message: string; claimNumber?: number }>;

  // Wardrobe operations
  getWardrobeItemsWithOwnership(userId: number): Promise<any[]>;
  purchaseWardrobeItem(userId: number, itemId: number): Promise<any>;
  equipWardrobeItem(userId: number, itemId: number, category: string): Promise<void>;
  unequipWardrobeItem(userId: number, category: string): Promise<void>;

  // Shop operations (using wardrobe items as shop items)
  getShopItems(userId: number): Promise<any[]>;
  purchaseShopItem(userId: number, itemId: number): Promise<any>;

  // Achievement operations
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement>;
  checkAndUnlockAchievements(userId: number): Promise<UserAchievement[]>;
  markAchievementAsViewed(userId: number, achievementId: number): Promise<UserAchievement>;

  // Social sharing operations
  createSocialShare(share: InsertSocialShare): Promise<SocialShare>;
  getSocialShares(limit?: number): Promise<any[]>;
  getUserSocialShares(userId: number): Promise<SocialShare[]>;
  likeSocialShare(shareId: number, userId: number): Promise<SocialShareLike>;
  unlikeSocialShare(shareId: number, userId: number): Promise<void>;

  // Daily quest operations
  getDailyProgress(userId: number, date: string): Promise<DailyProgress | undefined>;
  updateDailyProgress(userId: number, date: string, updates: Partial<DailyProgress>): Promise<DailyProgress>;
  toggleDailyQuest(userId: number, questType: 'hydration' | 'steps' | 'protein' | 'sleep', completed: boolean): Promise<{ completed: boolean; xpAwarded: boolean; streakFreezeAwarded: boolean; xpRemoved?: boolean; streakFreezeRemoved?: boolean }>;
  completeDailyQuest(userId: number, questType: 'hydration' | 'steps' | 'protein' | 'sleep'): Promise<{ completed: boolean; xpAwarded: boolean; streakFreezeAwarded: boolean }>;

  // Mail system operations
  getPlayerMail(userId: number): Promise<PlayerMail[]>;
  sendWelcomeEmail(userId: number): Promise<void>;

  // App request operations
  createAppRequest(request: InsertAppRequest): Promise<AppRequest>;
  getUserAppRequests(userId: number): Promise<AppRequest[]>;
  getAllAppRequests(): Promise<AppRequest[]>;
  updateAppRequestStatus(requestId: number, status: string, adminNotes?: string, adminUserId?: number): Promise<AppRequest>;
  createPlayerMail(mail: InsertPlayerMail): Promise<PlayerMail>;
  markMailAsRead(mailId: number, userId: number): Promise<void>;
  claimMailRewards(mailId: number, userId: number): Promise<{ success: boolean; rewards?: any }>;
  sendBulkMail(mail: Omit<InsertPlayerMail, 'userId'>, targetUserIds?: number[]): Promise<number>; // Returns count of mails sent
  
  // Streak system operations
  updateStreak(userId: number): Promise<void>;
  useStreakFreeze(userId: number): Promise<{ success: boolean; remainingFreezes: number }>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getSystemStats(): Promise<{
    totalUsers: number;
    activeToday: number;
    totalWorkouts: number;
    averageLevel: number;
  }>;

  // Liability waiver operations
  createLiabilityWaiver(waiver: InsertLiabilityWaiver): Promise<LiabilityWaiver>;
  getUserLiabilityWaiver(userId: number): Promise<LiabilityWaiver | undefined>;
  updateUserLiabilityWaiverStatus(userId: number, accepted: boolean, ipAddress?: string): Promise<User>;

  // AI Workout Recommendation operations
  getUserWorkoutPreferences(userId: number): Promise<any>;
  updateUserWorkoutPreferences(userId: number, preferences: any): Promise<any>;
  getRecentWorkoutFeedback(userId: number, limit: number): Promise<any[]>;
  createWorkoutFeedback(feedback: any): Promise<any>;
  getUserStats(userId: number): Promise<any>;
  getExercises(): Promise<Exercise[]>;

  // App request operations
  createAppRequest(request: InsertAppRequest): Promise<AppRequest>;
  getAllAppRequests(): Promise<AppRequest[]>;
  getUserAppRequests(userId: number): Promise<AppRequest[]>;
  updateAppRequestStatus(id: number, status: string, adminNotes?: string, reviewedBy?: number): Promise<AppRequest>;
}

export class DatabaseStorage implements IStorage {
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeDefaultUser();
      await this.initializeDefaultExercises();
      await this.initializeDefaultWardrobeItems();
      this.initialized = true;
    }
  }

  private async initializeDefaultUser() {
    // Check if default user exists
    const existingUser = await db.select().from(users).where(eq(users.id, 1)).limit(1);
    if (existingUser.length > 0) return;

    // Create default user
    await db.insert(users).values({
      username: "Player",
      password: "defaultpassword",
      experience: 0,
      level: 1,
      strength: 10,
      stamina: 10,
      agility: 10,
      gold: 100,
      gender: "male",
      skinColor: "#F5C6A0",
      hairColor: "#8B4513",
      currentTier: "E",
      currentTitle: "Recruit"
    });
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
      for (const exercise of defaultExercises) {
        await db.insert(exercises).values(exercise);
      }
    } catch (error) {
      console.log("Default exercises already exist or error inserting:", error);
    }
  }

  private async initializeDefaultWardrobeItems() {
    // Items are now populated manually via SQL, skipping all initialization
    return;

    const defaultWardrobeItems = [
      // Head armor
      { name: "Leather Helm", category: "head", rarity: "common", price: 15, unlockLevel: 1, color: "#8B4513", description: "Basic leather protection", statBonus: { stamina: 1 } },
      { name: "Iron Helmet", category: "head", rarity: "rare", price: 75, unlockLevel: 8, color: "#696969", description: "Sturdy metal helmet", statBonus: { stamina: 3, strength: 1 } },
      { name: "Crown of Power", category: "head", rarity: "legendary", price: 500, unlockLevel: 25, color: "#FFD700", description: "Majestic crown that enhances all abilities", statBonus: { strength: 2, stamina: 2, agility: 2 } },
      
      // Shoulders
      { name: "Cloth Shoulders", category: "shoulders", rarity: "common", price: 12, unlockLevel: 1, color: "#8FBC8F", description: "Basic cloth shoulder guards", statBonus: { agility: 1 } },
      { name: "Steel Pauldrons", category: "shoulders", rarity: "rare", price: 60, unlockLevel: 6, color: "#778899", description: "Heavy shoulder armor", statBonus: { strength: 2, stamina: 1 } },
      { name: "Dragon Shoulders", category: "shoulders", rarity: "epic", price: 200, unlockLevel: 18, color: "#DC143C", description: "Shoulder guards made from dragon hide", statBonus: { strength: 3, stamina: 2 } },
      
      // Neck
      { name: "Simple Necklace", category: "neck", rarity: "common", price: 8, unlockLevel: 1, color: "#C0C0C0", description: "Basic silver necklace", statBonus: { agility: 1 } },
      { name: "Amulet of Strength", category: "neck", rarity: "rare", price: 80, unlockLevel: 10, color: "#8B0000", description: "Enhances physical power", statBonus: { strength: 3 } },
      { name: "Pendant of Wisdom", category: "neck", rarity: "epic", price: 180, unlockLevel: 15, color: "#4169E1", description: "Increases all stats moderately", statBonus: { strength: 2, stamina: 2, agility: 2 } },
      
      // Chest armor
      { name: "Cloth Tunic", category: "chest", rarity: "common", price: 20, unlockLevel: 1, color: "#8FBC8F", description: "Basic cloth chest piece", statBonus: { stamina: 2 } },
      { name: "Chainmail Hauberk", category: "chest", rarity: "rare", price: 100, unlockLevel: 12, color: "#708090", description: "Flexible metal protection", statBonus: { stamina: 5, strength: 1 } },
      { name: "Dragonscale Chestplate", category: "chest", rarity: "legendary", price: 400, unlockLevel: 22, color: "#800080", description: "Ultimate chest protection", statBonus: { strength: 3, stamina: 5, agility: 1 } },
      
      // Hands
      { name: "Cloth Gloves", category: "hands", rarity: "common", price: 6, unlockLevel: 1, color: "#8FBC8F", description: "Basic hand protection", statBonus: { agility: 1 } },
      { name: "Iron Gauntlets", category: "hands", rarity: "rare", price: 45, unlockLevel: 7, color: "#696969", description: "Heavy metal gloves", statBonus: { strength: 2, stamina: 1 } },
      { name: "Gloves of Dexterity", category: "hands", rarity: "epic", price: 120, unlockLevel: 14, color: "#32CD32", description: "Enhances hand coordination", statBonus: { agility: 4, strength: 1 } },
      
      // Waist
      { name: "Rope Belt", category: "waist", rarity: "common", price: 5, unlockLevel: 1, color: "#8B4513", description: "Simple rope belt", statBonus: { agility: 1 } },
      { name: "Leather Belt", category: "waist", rarity: "rare", price: 35, unlockLevel: 5, color: "#654321", description: "Sturdy leather belt with pouches", statBonus: { stamina: 2, agility: 1 } },
      { name: "Champion's Girdle", category: "waist", rarity: "epic", price: 150, unlockLevel: 16, color: "#DAA520", description: "Belt of a true champion", statBonus: { strength: 2, stamina: 2, agility: 2 } },
      
      // Legs
      { name: "Cloth Pants", category: "legs", rarity: "common", price: 15, unlockLevel: 1, color: "#8B4513", description: "Basic cloth leg protection", statBonus: { stamina: 1 } },
      { name: "Mail Leggings", category: "legs", rarity: "rare", price: 65, unlockLevel: 9, color: "#778899", description: "Flexible leg armor", statBonus: { stamina: 3, agility: 1 } },
      { name: "Plate Legguards", category: "legs", rarity: "epic", price: 170, unlockLevel: 17, color: "#2F4F4F", description: "Heavy plate leg armor", statBonus: { strength: 2, stamina: 4 } },
      
      // Feet
      { name: "Cloth Shoes", category: "feet", rarity: "common", price: 10, unlockLevel: 1, color: "#654321", description: "Basic footwear", statBonus: { agility: 1 } },
      { name: "Iron Boots", category: "feet", rarity: "rare", price: 50, unlockLevel: 8, color: "#696969", description: "Heavy metal boots", statBonus: { strength: 1, stamina: 2 } },
      { name: "Boots of Speed", category: "feet", rarity: "legendary", price: 280, unlockLevel: 20, color: "#87CEEB", description: "Boots that greatly enhance movement", statBonus: { agility: 5, stamina: 1 } },
    ];

    try {
      for (const item of defaultWardrobeItems) {
        await db.insert(wardrobeItems).values(item);
      }
    } catch (error) {
      console.log("Default wardrobe items already exist or error inserting:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`lower(${users.username}) = lower(${username})`);
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return user || undefined;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
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

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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
      .values(insertExercise as any)
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
      .values(insertWorkout as any)
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
      .values(insertSession as any)
      .returning();
    return session;
  }

  async getWorkoutSessionById(sessionId: number, userId: number): Promise<WorkoutSession & { exercises: any[] } | undefined> {
    await this.ensureInitialized();
    
    // Get the workout session
    const [session] = await db.select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      ));
    
    if (!session) {
      return undefined;
    }

    // Get exercises data from the session
    // The exercises are stored in the session data when it's created
    const exercises = (session as any).exercises || [];

    return {
      ...session,
      exercises
    };
  }

  async getAllWorkoutSessions(): Promise<WorkoutSession[]> {
    await this.ensureInitialized();
    return await db.select().from(workoutSessions);
  }

  async getAllUsers(): Promise<User[]> {
    await this.ensureInitialized();
    return await db.select().from(users);
  }

  async getLeaderboard(): Promise<User[]> {
    await this.ensureInitialized();
    return await db.select().from(users)
      .orderBy(desc(users.experience))
      .limit(100);
  }

  async getExercises(): Promise<Exercise[]> {
    return await this.getAllExercises();
  }

  // Exercise performance operations
  async getSessionPerformances(sessionId: number): Promise<ExercisePerformance[]> {
    return await db.select().from(exercisePerformances).where(eq(exercisePerformances.sessionId, sessionId));
  }

  async createExercisePerformance(insertPerformance: InsertExercisePerformance): Promise<ExercisePerformance> {
    const [performance] = await db
      .insert(exercisePerformances)
      .values(insertPerformance as any)
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

  // User exercise preferences
  async getUserExercisePreferences(userId: number): Promise<UserExercisePreferences[]> {
    return await db.select().from(userExercisePreferences).where(eq(userExercisePreferences.userId, userId));
  }

  async getUserExercisePreference(userId: number, exerciseId: number): Promise<UserExercisePreferences | undefined> {
    const [preference] = await db.select().from(userExercisePreferences)
      .where(and(
        eq(userExercisePreferences.userId, userId),
        eq(userExercisePreferences.exerciseId, exerciseId)
      ));
    return preference || undefined;
  }

  async upsertUserExercisePreference(preference: InsertUserExercisePreferences): Promise<UserExercisePreferences> {
    console.log('Storage: Upserting exercise preference:', preference);
    const existing = await this.getUserExercisePreference(preference.userId, preference.exerciseId);
    console.log('Storage: Existing preference found:', existing);
    
    if (existing) {
      // Update existing preference
      const updateData = {
        ...preference,
        updatedAt: new Date()
      };
      console.log('Storage: Updating preference with data:', updateData);
      const [updated] = await db
        .update(userExercisePreferences)
        .set(updateData)
        .where(and(
          eq(userExercisePreferences.userId, preference.userId),
          eq(userExercisePreferences.exerciseId, preference.exerciseId)
        ))
        .returning();
      console.log('Storage: Updated preference result:', updated);
      return updated;
    } else {
      // Create new preference
      console.log('Storage: Creating new preference with data:', preference);
      const [created] = await db
        .insert(userExercisePreferences)
        .values(preference)
        .returning();
      console.log('Storage: Created preference result:', created);
      return created;
    }
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

  // Wardrobe operations
  async getWardrobeItemsWithOwnership(userId: number): Promise<any[]> {
    try {
      await this.ensureInitialized();
      
      console.log("Getting wardrobe items for user:", userId);
      const items = await db.select().from(wardrobeItems);
      console.log("Found wardrobe items:", items.length);
      
      const ownedItems = await db.select().from(userWardrobe).where(eq(userWardrobe.userId, userId));
      console.log("Found user owned items:", ownedItems.length);
      
      const user = await this.getUser(userId);
      console.log("Found user:", user?.id);
      
      return items.map(item => ({
        ...item,
        isOwned: ownedItems.some(owned => owned.wardrobeItemId === item.id),
        isEquipped: (
          (item.category === 'head' && user?.equippedHead === item.name) ||
          (item.category === 'shoulders' && user?.equippedShoulders === item.name) ||
          (item.category === 'neck' && user?.equippedNeck === item.name) ||
          (item.category === 'chest' && user?.equippedChest === item.name) ||
          (item.category === 'hands' && user?.equippedHands === item.name) ||
          (item.category === 'waist' && user?.equippedWaist === item.name) ||
          (item.category === 'legs' && user?.equippedLegs === item.name) ||
          (item.category === 'feet' && user?.equippedFeet === item.name)
        )
      }));
    } catch (error) {
      console.error("Error in getWardrobeItemsWithOwnership:", error);
      throw error;
    }
  }

  async purchaseWardrobeItem(userId: number, itemId: number): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const [item] = await db.select().from(wardrobeItems).where(eq(wardrobeItems.id, itemId));
    if (!item) throw new Error("Item not found");

    // Check if user can afford it
    if ((user.gold || 0) < (item.price || 0)) {
      throw new Error("Not enough gold");
    }

    // Check level requirement
    if ((user.level || 0) < (item.unlockLevel || 0)) {
      throw new Error(`Level ${item.unlockLevel} required`);
    }

    // Check if already owned
    const [existingOwnership] = await db.select().from(userWardrobe)
      .where(and(
        eq(userWardrobe.userId, userId),
        eq(userWardrobe.wardrobeItemId, itemId)
      ));
    
    if (existingOwnership) {
      throw new Error("Item already owned");
    }

    // Purchase the item
    await db.insert(userWardrobe).values({
      userId: userId,
      wardrobeItemId: itemId
    });

    // Deduct gold
    await this.updateUser(userId, { gold: (user.gold || 0) - (item.price || 0) });

    return { item, goldSpent: item.price };
  }

  async equipWardrobeItem(userId: number, itemId: number, category: string): Promise<void> {
    // Verify ownership
    const [ownership] = await db.select().from(userWardrobe)
      .where(and(
        eq(userWardrobe.userId, userId),
        eq(userWardrobe.wardrobeItemId, itemId)
      ));
    
    if (!ownership) throw new Error("Item not owned");

    const [item] = await db.select().from(wardrobeItems).where(eq(wardrobeItems.id, itemId));
    if (!item) throw new Error("Item not found");

    // Map category to user field
    const fieldMap: Record<string, string> = {
      head: 'equippedHead',
      shoulders: 'equippedShoulders',
      neck: 'equippedNeck',
      chest: 'equippedChest',
      hands: 'equippedHands',
      waist: 'equippedWaist',
      legs: 'equippedLegs',
      feet: 'equippedFeet'
    };

    const field = fieldMap[category];
    if (!field) throw new Error("Invalid category");

    // Update user's equipped item
    await this.updateUser(userId, { [field]: item.name });
  }

  async unequipWardrobeItem(userId: number, category: string): Promise<void> {
    const fieldMap: Record<string, string> = {
      head: 'equippedHead',
      shoulders: 'equippedShoulders',
      neck: 'equippedNeck',
      chest: 'equippedChest',
      hands: 'equippedHands',
      waist: 'equippedWaist',
      legs: 'equippedLegs',
      feet: 'equippedFeet'
    };

    const field = fieldMap[category];
    if (!field) throw new Error("Invalid category");

    // Remove equipped item
    await this.updateUser(userId, { [field]: null });
  }

  // Shop operations (reusing wardrobe items as shop items)
  async getShopItems(userId: number): Promise<any[]> {
    return await this.getWardrobeItemsWithOwnership(userId);
  }

  async purchaseShopItem(userId: number, itemId: number): Promise<any> {
    return await this.purchaseWardrobeItem(userId, itemId);
  }

  // Achievement operations (moved to proper section below)

  // Daily quest operations
  async getDailyProgress(userId: number, date?: string): Promise<DailyProgress | undefined> {
    await this.ensureInitialized();
    
    // Get user's timezone to ensure proper daily reset
    const user = await this.getUser(userId);
    const userTimezone = user?.timezone || undefined;
    
    // Check and perform daily reset if needed
    await dailyResetService.checkAndResetDailyQuests(userId, userTimezone);
    
    // Use current date for user's timezone if not provided
    const targetDate = date || dailyResetService.getCurrentDateForUser(userTimezone);
    
    const results = await db.select()
      .from(dailyProgress)
      .where(and(eq(dailyProgress.userId, userId), eq(dailyProgress.date, targetDate)))
      .limit(1);
    return results[0];
  }

  async updateDailyProgress(userId: number, date: string, updates: Partial<DailyProgress>): Promise<DailyProgress> {
    await this.ensureInitialized();
    
    // Try to get existing progress
    const existing = await this.getDailyProgress(userId, date);
    
    if (existing) {
      // Update existing record
      const results = await db.update(dailyProgress)
        .set(updates)
        .where(and(eq(dailyProgress.userId, userId), eq(dailyProgress.date, date)))
        .returning();
      return results[0];
    } else {
      // Create new record
      const results = await db.insert(dailyProgress)
        .values({
          userId,
          date,
          hydration: false,
          steps: false,
          protein: false,
          sleep: false,
          xpAwarded: false,
          ...updates
        })
        .returning();
      return results[0];
    }
  }

  async toggleDailyQuest(userId: number, questType: 'hydration' | 'steps' | 'protein' | 'sleep', completed: boolean): Promise<{ completed: boolean; xpAwarded: boolean; streakFreezeAwarded: boolean; xpRemoved?: boolean; streakFreezeRemoved?: boolean }> {
    await this.ensureInitialized();
    
    // Get user's timezone for proper daily reset
    const user = await this.getUser(userId);
    const userTimezone = user?.timezone || undefined;
    
    // Check and perform daily reset if needed
    await dailyResetService.checkAndResetDailyQuests(userId, userTimezone);
    
    // Use user's timezone to get current date
    const today = dailyResetService.getCurrentDateForUser(userTimezone);
    
    // Get or create today's progress
    let progress = await this.getDailyProgress(userId, today);
    if (!progress) {
      progress = await this.updateDailyProgress(userId, today, {});
    }
    
    // Store previous state
    const previousAllCompleted = progress.hydration && progress.steps && progress.protein && progress.sleep;
    const previousTwoOrMoreCompleted = [progress.hydration, progress.steps, progress.protein, progress.sleep].filter(Boolean).length >= 2;
    const wasXpAwarded = progress.xpAwarded;
    const wasStreakFreezeAwarded = progress.streakFreezeAwarded;
    
    // Update the specific quest state
    const updatedProgress = await this.updateDailyProgress(userId, today, {
      [questType]: completed
    });
    
    // Check completion states after this change
    const allCompleted = updatedProgress.hydration && updatedProgress.steps && updatedProgress.protein && updatedProgress.sleep;
    const twoOrMoreCompleted = [updatedProgress.hydration, updatedProgress.steps, updatedProgress.protein, updatedProgress.sleep].filter(Boolean).length >= 2;
    let xpAwarded = false;
    let streakFreezeAwarded = false;
    let xpRemoved = false;
    let streakFreezeRemoved = false;
    
    if (completed) {
      // COMPLETING A QUEST - Award 5 XP for individual quest completion with streak bonus
      const user = await this.getUser(userId);
      if (user) {
        const streakBonus = applyStreakBonus(5, user.currentStreak ?? 0);
        await this.updateUser(userId, {
          experience: (user.experience ?? 0) + streakBonus.finalXp
        });
        
        // Record activity to prevent atrophy
        const { AtrophySystem } = await import("./atrophy-system.js");
        await AtrophySystem.recordActivity(userId);
      }
      
      // Award additional 5 XP bonus for completing all daily quests
      if (allCompleted && !updatedProgress.xpAwarded) {
        const updatedUser = await this.getUser(userId); // Get updated user data
        if (updatedUser) {
          const bonusStreakBonus = applyStreakBonus(5, updatedUser.currentStreak ?? 0);
          await this.updateUser(userId, {
            experience: (updatedUser.experience ?? 0) + bonusStreakBonus.finalXp // Add bonus XP with streak multiplier
          });
          
          // Mark bonus XP as awarded
          await this.updateDailyProgress(userId, today, {
            xpAwarded: true
          });
          xpAwarded = true;
        }
      }
      
      if (twoOrMoreCompleted && !updatedProgress.streakFreezeAwarded) {
        // Award streak freeze if user has less than 2 (requires 2 of 4 quests)
        const user = await this.getUser(userId);
        if (user && (user.streakFreezeCount ?? 0) < 2) {
          await this.updateUser(userId, {
            streakFreezeCount: (user.streakFreezeCount ?? 0) + 1
          });
          
          // Mark streak freeze as awarded
          await this.updateDailyProgress(userId, today, {
            streakFreezeAwarded: true
          });
          streakFreezeAwarded = true;
        }
      }
      
      // Record daily quest activity to prevent atrophy when 2+ quests are completed
      if (twoOrMoreCompleted) {
        await import("./atrophy-system.js").then(module => {
          module.AtrophySystem.recordActivity(userId);
        });
      }
    } else {
      // UNCHECKING A QUEST - Remove XP for individual quest (with original streak bonus that was applied)
      const user = await this.getUser(userId);
      if (user) {
        const streakBonus = applyStreakBonus(5, user.currentStreak ?? 0);
        await this.updateUser(userId, {
          experience: Math.max(0, (user.experience ?? 0) - streakBonus.finalXp)
        });
        
        // Remove bonus XP if it was awarded and we no longer have all 4 quests
        if (previousAllCompleted && !allCompleted && wasXpAwarded) {
          const updatedUser = await this.getUser(userId); // Get updated user data
          if (updatedUser) {
            const bonusStreakBonus = applyStreakBonus(5, updatedUser.currentStreak ?? 0);
            await this.updateUser(userId, {
              experience: Math.max(0, (updatedUser.experience ?? 0) - bonusStreakBonus.finalXp) // Remove bonus XP with streak multiplier
            });
            
            // Mark bonus XP as not awarded
            await this.updateDailyProgress(userId, today, {
              xpAwarded: false
            });
            xpRemoved = true;
          }
        }
        
        // Remove streak freeze if it was awarded and we now have less than 2 quests
        if (previousTwoOrMoreCompleted && !twoOrMoreCompleted && wasStreakFreezeAwarded) {
          if ((user.streakFreezeCount ?? 0) > 0) {
            await this.updateUser(userId, {
              streakFreezeCount: (user.streakFreezeCount ?? 0) - 1
            });
            
            // Mark streak freeze as not awarded
            await this.updateDailyProgress(userId, today, {
              streakFreezeAwarded: false
            });
            streakFreezeRemoved = true;
          }
        }
      }
    }
    
    // Update streak after quest change
    await this.updateStreak(userId);
    
    return { completed, xpAwarded, streakFreezeAwarded, xpRemoved, streakFreezeRemoved };
  }

  // Keep backwards compatibility
  async completeDailyQuest(userId: number, questType: 'hydration' | 'steps' | 'protein' | 'sleep'): Promise<{ completed: boolean; xpAwarded: boolean; streakFreezeAwarded: boolean }> {
    const result = await this.toggleDailyQuest(userId, questType, true);
    return { completed: result.completed, xpAwarded: result.xpAwarded, streakFreezeAwarded: result.streakFreezeAwarded };
  }

  async updateStreak(userId: number): Promise<void> {
    await this.ensureInitialized();
    
    const today = new Date().toISOString().split('T')[0];
    const user = await this.getUser(userId);
    if (!user) return;
    
    // Get today's progress
    const todaysProgress = await this.getDailyProgress(userId, today);
    
    // Check if user has completed workout sessions today
    const todaysWorkouts = await db.select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(sql`DATE(${workoutSessions.completedAt})`, today)
      ));
    
    // Count completed daily quests
    const completedQuests = [
      todaysProgress?.hydration,
      todaysProgress?.steps, 
      todaysProgress?.protein,
      todaysProgress?.sleep
    ].filter(Boolean).length;
    
    // Check if streak requirements are met:
    // - 2 of 4 daily quests completed OR at least 1 workout completed
    const streakRequirementMet = completedQuests >= 2 || todaysWorkouts.length > 0;
    
    if (streakRequirementMet) {
      // Extend or start streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let newStreak = 1;
      if (user.lastStreakDate === yesterdayStr) {
        // Continue existing streak
        newStreak = (user.currentStreak ?? 0) + 1;
      }
      
      await this.updateUser(userId, {
        currentStreak: newStreak,
        lastStreakDate: today
      });
    } else if (user.lastStreakDate) {
      // Check if streak should be broken
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // If last streak was not yesterday and today's requirements aren't met
      if (user.lastStreakDate < yesterdayStr) {
        // Streak is broken - reset to 0
        await this.updateUser(userId, {
          currentStreak: 0,
          lastStreakDate: null
        });
      }
    }
  }

  async useStreakFreeze(userId: number): Promise<{ success: boolean; remainingFreezes: number }> {
    await this.ensureInitialized();
    
    const user = await this.getUser(userId);
    if (!user || (user.streakFreezeCount ?? 0) <= 0) {
      return { success: false, remainingFreezes: user?.streakFreezeCount ?? 0 };
    }
    
    // Use streak freeze - extend last streak date to today
    const today = new Date().toISOString().split('T')[0];
    const newFreezeCount = (user.streakFreezeCount ?? 0) - 1;
    
    await this.updateUser(userId, {
      streakFreezeCount: newFreezeCount,
      lastStreakDate: today
    });
    
    return { success: true, remainingFreezes: newFreezeCount };
  }

  // Admin operations (getAllUsers already defined above)

  async getSystemStats(): Promise<{
    totalUsers: number;
    activeToday: number;
    totalWorkouts: number;
    averageLevel: number;
  }> {
    await this.ensureInitialized();
    
    // Get total users
    const totalUsersResult = await db.select({ count: sql`COUNT(*)`.as('count') }).from(users);
    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    // Get total workout sessions
    const totalWorkoutsResult = await db.select({ count: sql`COUNT(*)`.as('count') }).from(workoutSessions);
    const totalWorkouts = Number(totalWorkoutsResult[0]?.count || 0);

    // Get average level
    const avgLevelResult = await db.select({ avg: sql`AVG(level)`.as('avg') }).from(users);
    const averageLevel = Math.round(Number(avgLevelResult[0]?.avg || 1));

    // For now, consider all users as active today (in production, you'd check login timestamps)
    const activeToday = totalUsers;

    return {
      totalUsers,
      activeToday,
      totalWorkouts,
      averageLevel
    };
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    await this.ensureInitialized();
    
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: number, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User> {
    await this.ensureInitialized();
    
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: stripeInfo.customerId,
        stripeSubscriptionId: stripeInfo.subscriptionId,
        subscriptionStatus: 'active'
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Mail system operations
  async getPlayerMail(userId: number): Promise<PlayerMail[]> {
    await this.ensureInitialized();
    
    return await db
      .select()
      .from(playerMail)
      .where(eq(playerMail.userId, userId))
      .orderBy(desc(playerMail.createdAt));
  }

  async createPlayerMail(mail: InsertPlayerMail): Promise<PlayerMail> {
    await this.ensureInitialized();
    
    const [createdMail] = await db
      .insert(playerMail)
      .values(mail as any)
      .returning();
    return createdMail;
  }

  async markMailAsRead(mailId: number, userId: number): Promise<void> {
    await this.ensureInitialized();
    
    await db
      .update(playerMail)
      .set({ isRead: true })
      .where(and(eq(playerMail.id, mailId), eq(playerMail.userId, userId)));
  }

  async claimMailRewards(mailId: number, userId: number): Promise<{ success: boolean; rewards?: any }> {
    await this.ensureInitialized();
    
    // Get the mail with rewards
    const [mail] = await db
      .select()
      .from(playerMail)
      .where(and(eq(playerMail.id, mailId), eq(playerMail.userId, userId)));
    
    if (!mail || mail.rewardsClaimed || !mail.rewards) {
      return { success: false };
    }

    const rewards = mail.rewards;
    
    // Update user with rewards (if any)
    if (rewards && (rewards.gold || rewards.xp)) {
      const user = await this.getUser(userId);
      if (user) {
        await this.updateUser(userId, {
          gold: (user.gold || 0) + (Number(rewards.gold) || 0),
          experience: (user.experience || 0) + (Number(rewards.xp) || 0)
        });
      }
    }

    // Add items to inventory
    if (rewards.items && rewards.items.length > 0) {
      const { playerInventory } = await import("@shared/schema");
      for (const item of rewards.items) {
        // Check if item already exists in inventory
        const [existingItem] = await db
          .select()
          .from(playerInventory)
          .where(and(
            eq(playerInventory.userId, userId),
            eq(playerInventory.itemType, item.itemType),
            eq(playerInventory.itemName, item.itemName)
          ));

        if (existingItem) {
          // Update quantity
          await db
            .update(playerInventory)
            .set({ 
              quantity: (existingItem.quantity || 0) + item.quantity 
            })
            .where(eq(playerInventory.id, existingItem.id));
        } else {
          // Create new inventory item
          await db
            .insert(playerInventory)
            .values({
              userId,
              itemType: item.itemType,
              itemName: item.itemName,
              quantity: item.quantity
            });
        }
      }
    }

    // Mark rewards as claimed
    await db
      .update(playerMail)
      .set({ rewardsClaimed: true })
      .where(eq(playerMail.id, mailId));

    return { success: true, rewards };
  }

  async sendBulkMail(mail: Omit<InsertPlayerMail, 'userId'>, targetUserIds?: number[]): Promise<number> {
    await this.ensureInitialized();
    
    console.log('sendBulkMail called with mail:', mail);
    
    let userIds: number[];
    
    if (targetUserIds && targetUserIds.length > 0) {
      userIds = targetUserIds;
    } else {
      // Send to all users if no specific targets
      const allUsers = await db.select({ id: users.id }).from(users);
      userIds = allUsers.map(u => u.id);
    }

    console.log('Sending mail to users:', userIds);

    // Create mail for each user
    const mailEntries = userIds.map(userId => ({
      ...mail,
      userId
    }));

    console.log('Mail entries to insert:', mailEntries);

    try {
      await db.insert(playerMail).values(mailEntries as any);
      console.log('Mail insertion successful');
    } catch (insertError: any) {
      console.error('Database insert error:', insertError);
      console.error('Insert error message:', insertError.message);
      throw insertError;
    }
    
    return mailEntries.length;
  }

  // Achievement operations
  async getAllAchievements(): Promise<Achievement[]> {
    await this.ensureInitialized();
    return await db.select().from(achievements);
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    await this.ensureInitialized();
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }

  async unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    await this.ensureInitialized();
    
    // Check if already unlocked
    const existing = await db
      .select()
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Unlock achievement
    const [userAchievement] = await db
      .insert(userAchievements)
      .values({ userId, achievementId })
      .returning();

    // Award gold reward
    const achievement = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, achievementId))
      .limit(1);

    if (achievement.length > 0 && achievement[0]?.goldReward && achievement[0].goldReward > 0) {
      const user = await this.getUser(userId);
      if (user) {
        await this.updateUser(userId, {
          gold: (user.gold || 0) + achievement[0].goldReward
        });
      }
    }

    return userAchievement;
  }

  // Social sharing operations
  async createSocialShare(share: InsertSocialShare): Promise<SocialShare> {
    await this.ensureInitialized();
    
    const [newShare] = await db
      .insert(socialShares)
      .values(share as any)
      .returning();
    
    return newShare;
  }

  async getSocialShares(limit: number = 20): Promise<any[]> {
    await this.ensureInitialized();
    
    return await db
      .select({
        id: socialShares.id,
        shareType: socialShares.shareType,
        title: socialShares.title,
        description: socialShares.description,
        shareData: socialShares.shareData,
        likesCount: socialShares.likesCount,
        createdAt: socialShares.createdAt,
        username: users.username,
        level: users.level,
        currentTitle: users.currentTitle
      })
      .from(socialShares)
      .leftJoin(users, eq(socialShares.userId, users.id))
      .orderBy(desc(socialShares.createdAt))
      .limit(limit);
  }

  async getUserSocialShares(userId: number): Promise<SocialShare[]> {
    await this.ensureInitialized();
    
    return await db
      .select()
      .from(socialShares)
      .where(eq(socialShares.userId, userId))
      .orderBy(desc(socialShares.createdAt));
  }

  async likeSocialShare(shareId: number, userId: number): Promise<SocialShareLike> {
    await this.ensureInitialized();
    
    // Check if already liked
    const existing = await db
      .select()
      .from(socialShareLikes)
      .where(and(
        eq(socialShareLikes.shareId, shareId),
        eq(socialShareLikes.userId, userId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Add like
    const [like] = await db
      .insert(socialShareLikes)
      .values({ shareId, userId })
      .returning();

    // Update likes count
    await db
      .update(socialShares)
      .set({ 
        likesCount: sql`${socialShares.likesCount} + 1`
      })
      .where(eq(socialShares.id, shareId));

    return like;
  }

  async unlikeSocialShare(shareId: number, userId: number): Promise<void> {
    await this.ensureInitialized();
    
    // Remove like
    await db
      .delete(socialShareLikes)
      .where(and(
        eq(socialShareLikes.shareId, shareId),
        eq(socialShareLikes.userId, userId)
      ));

    // Update likes count
    await db
      .update(socialShares)
      .set({ 
        likesCount: sql`${socialShares.likesCount} - 1`
      })
      .where(eq(socialShares.id, shareId));
  }

  async checkAndUnlockAchievements(userId: number): Promise<UserAchievement[]> {
    await this.ensureInitialized();
    
    const newUnlocks: UserAchievement[] = [];
    
    // Get user stats and data
    const user = await this.getUser(userId);
    if (!user) return newUnlocks;
    
    // Get user's workout sessions count
    const workoutSessions = await this.getUserWorkoutSessions(userId);
    const totalWorkouts = workoutSessions.length;
    
    // Get all achievements
    const allAchievements = await this.getAllAchievements();
    
    // Get already unlocked achievements
    const userAchievements = await this.getUserAchievements(userId);
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));
    
    // Check each achievement
    for (const achievement of allAchievements) {
      // Skip if already unlocked
      if (unlockedIds.has(achievement.id)) continue;
      
      let shouldUnlock = false;
      
      // Check based on achievement type
      switch (achievement.type) {
        case 'workout_count':
          shouldUnlock = totalWorkouts >= achievement.requirement;
          break;
        case 'workout_streak':
          shouldUnlock = (user.currentStreak || 0) >= achievement.requirement;
          break;
        case 'strength_level':
          shouldUnlock = (user.strength || 0) >= achievement.requirement;
          break;
        case 'stamina_level':
          shouldUnlock = (user.stamina || 0) >= achievement.requirement;
          break;
        case 'agility_level':
          shouldUnlock = (user.agility || 0) >= achievement.requirement;
          break;
        case 'character_level':
          shouldUnlock = (user.level || 0) >= achievement.requirement;
          break;
        case 'gold_earned':
          shouldUnlock = (user.gold || 0) >= achievement.requirement;
          break;
      }
      
      // Unlock if conditions are met
      if (shouldUnlock) {
        const newUnlock = await this.unlockAchievement(userId, achievement.id);
        newUnlocks.push(newUnlock);
      }
    }
    
    return newUnlocks;
  }

  async markAchievementAsViewed(userId: number, achievementId: number): Promise<UserAchievement> {
    await this.ensureInitialized();
    
    try {
      // Update the user achievement to mark as viewed
      const [updatedAchievement] = await db
        .update(userAchievements)
        .set({ isViewed: true })
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievementId)
          )
        )
        .returning();

      if (!updatedAchievement) {
        throw new Error(`Achievement ${achievementId} not found for user ${userId}`);
      }

      return updatedAchievement;
    } catch (error) {
      console.error(`Error marking achievement as viewed:`, error);
      throw error;
    }
  }

  // Monster operations
  async getAllMonsters(): Promise<Monster[]> {
    return await db.select().from(monsters);
  }

  async getMonster(id: number): Promise<Monster | undefined> {
    const [monster] = await db.select().from(monsters).where(eq(monsters.id, id));
    return monster || undefined;
  }

  async createMonster(insertMonster: InsertMonster): Promise<Monster> {
    const [result] = await db.insert(monsters).values(insertMonster).returning();
    return result;
  }

  async updateMonster(id: number, updates: Partial<Monster>): Promise<Monster> {
    const [result] = await db
      .update(monsters)
      .set(updates)
      .where(eq(monsters.id, id))
      .returning();
    return result;
  }

  // Liability waiver operations
  async createLiabilityWaiver(waiver: InsertLiabilityWaiver): Promise<LiabilityWaiver> {
    const [result] = await db.insert(liabilityWaivers).values(waiver).returning();
    return result;
  }

  async getUserLiabilityWaiver(userId: number): Promise<LiabilityWaiver | undefined> {
    const [waiver] = await db.select().from(liabilityWaivers).where(eq(liabilityWaivers.userId, userId));
    return waiver || undefined;
  }

  async updateUserLiabilityWaiverStatus(userId: number, accepted: boolean, ipAddress?: string): Promise<User> {
    const updates: Partial<User> = {
      liabilityWaiverAccepted: accepted,
      liabilityWaiverAcceptedAt: new Date(),
    };
    
    if (ipAddress) {
      updates.liabilityWaiverIpAddress = ipAddress;
    }

    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // AI Workout Recommendation operations
  async getUserWorkoutPreferences(userId: number): Promise<WorkoutPreferences | null> {
    const [preferences] = await db
      .select()
      .from(workoutPreferences)
      .where(eq(workoutPreferences.userId, userId));
    return preferences || null;
  }

  async updateUserWorkoutPreferences(userId: number, prefs: InsertWorkoutPreferences): Promise<WorkoutPreferences> {
    // Check if preferences exist
    const existing = await this.getUserWorkoutPreferences(userId);
    
    if (existing) {
      const [updated] = await db
        .update(workoutPreferences)
        .set({ ...prefs, updatedAt: new Date() })
        .where(eq(workoutPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(workoutPreferences)
        .values({ ...prefs, userId })
        .returning();
      return created;
    }
  }

  async getRecentWorkoutFeedback(userId: number, limit: number): Promise<WorkoutFeedback[]> {
    return await db
      .select()
      .from(workoutFeedback)
      .where(eq(workoutFeedback.userId, userId))
      .orderBy(desc(workoutFeedback.createdAt))
      .limit(limit);
  }

  async createWorkoutFeedback(feedback: InsertWorkoutFeedback): Promise<WorkoutFeedback> {
    await this.ensureInitialized();
    const [result] = await db.insert(workoutFeedback).values(feedback as any).returning();
    return result;
  }

  async getUserStats(userId: number): Promise<any> {
    const [user] = await db.select({
      strength: users.strength,
      stamina: users.stamina,
      agility: users.agility,
      level: users.level,
      experience: users.experience,
      currentTier: users.currentTier,
    }).from(users).where(eq(users.id, userId));
    return user || { strength: 0, stamina: 0, agility: 0, level: 1, experience: 0, currentTier: 'E' };
  }

  // getExercises already defined above

  // Workout program purchase operations
  async getUserPurchasedPrograms(userId: number): Promise<string[]> {
    const [user] = await db.select({ purchasedPrograms: users.purchasedPrograms }).from(users).where(eq(users.id, userId));
    return user?.purchasedPrograms || [];
  }

  async purchaseWorkoutProgram(userId: number, programId: string): Promise<User> {
    // Get current purchased programs
    const currentPrograms = await this.getUserPurchasedPrograms(userId);
    
    // Add new program if not already purchased
    if (!currentPrograms.includes(programId)) {
      currentPrograms.push(programId);
    }
    
    // Update user with new purchased programs
    const [updatedUser] = await db
      .update(users)
      .set({ purchasedPrograms: currentPrograms })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  // Shop system operations
  async getAllShopItems(): Promise<any[]> {
    const { shopItems } = await import("@shared/schema");
    return await db.select().from(shopItems).where(eq(shopItems.isActive, true));
  }

  // purchaseShopItem method is already defined above at line 579

  async addGems(userId: number, amount: number): Promise<User> {
    const [user] = await db.select({ gems: users.gems }).from(users).where(eq(users.id, userId));
    const newGemAmount = (user?.gems || 0) + amount;
    
    const [updatedUser] = await db
      .update(users)
      .set({ gems: newGemAmount })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async purchaseStreakFreeze(userId: number): Promise<{ success: boolean; message: string }> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const gemCost = 25;
    if ((user.gems || 0) < gemCost) {
      return { success: false, message: "Not enough gems (need 25)" };
    }

    if ((user.streakFreezeCount || 0) >= 2) {
      return { success: false, message: "You already have the maximum streak freezes (2)" };
    }

    const newGems = (user.gems || 0) - gemCost;
    const newFreezes = (user.streakFreezeCount || 0) + 1;

    await db.update(users).set({ 
      gems: newGems, 
      streakFreezeCount: newFreezes 
    }).where(eq(users.id, userId));

    return { success: true, message: "Streak freeze purchased!" };
  }

  // Founders pack operations
  async getFoundersPackClaimCount(): Promise<number> {
    const { foundersPackClaims } = await import("@shared/schema");
    const { sql } = await import("drizzle-orm");
    const result = await db.select({ count: sql<number>`count(*)` }).from(foundersPackClaims);
    return result[0]?.count || 0;
  }

  async canUserClaimFoundersPack(userId: number): Promise<boolean> {
    const { foundersPackClaims } = await import("@shared/schema");
    
    // Check if user already claimed
    const [existingClaim] = await db.select().from(foundersPackClaims).where(eq(foundersPackClaims.userId, userId));
    if (existingClaim) {
      return false; // User already claimed
    }

    // Check if we're under 100 claims
    const claimCount = await this.getFoundersPackClaimCount();
    return claimCount < 100;
  }

  async claimFoundersPack(userId: number, paymentIntentId: string): Promise<{ success: boolean; message: string; claimNumber?: number }> {
    const { foundersPackClaims } = await import("@shared/schema");
    
    // Double-check eligibility
    if (!(await this.canUserClaimFoundersPack(userId))) {
      return { success: false, message: "Founders Pack no longer available or already claimed" };
    }

    // Get next claim number
    const claimCount = await this.getFoundersPackClaimCount();
    const claimNumber = claimCount + 1;

    // Create claim record
    const [claim] = await db.insert(foundersPackClaims).values({
      userId,
      claimNumber,
      paymentIntentId
    }).returning();

    // Add rewards to user
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Add gold, gems, title, and purchased program
    const newGold = (user.gold || 0) + 1000;
    const newGems = (user.gems || 0) + 200;
    const newPurchasedPrograms = [...(user.purchasedPrograms || []), "founders-at-home-12week"];

    await db.update(users).set({
      gold: newGold,
      gems: newGems,
      currentTitle: "The First Flame",
      purchasedPrograms: newPurchasedPrograms
    }).where(eq(users.id, userId));

    return { 
      success: true, 
      message: `Founders Pack #${claimNumber} claimed! Welcome, First Flame!`,
      claimNumber 
    };
  }

  // App request operations
  async createAppRequest(request: InsertAppRequest): Promise<AppRequest> {
    await this.ensureInitialized();
    
    const [createdRequest] = await db
      .insert(appRequests)
      .values(request as any)
      .returning();
    return createdRequest;
  }

  async getAllAppRequests(): Promise<AppRequest[]> {
    await this.ensureInitialized();
    
    return await db
      .select()
      .from(appRequests)
      .orderBy(desc(appRequests.submittedAt));
  }

  async getUserAppRequests(userId: number): Promise<AppRequest[]> {
    await this.ensureInitialized();
    
    return await db
      .select()
      .from(appRequests)
      .where(eq(appRequests.userId, userId))
      .orderBy(desc(appRequests.submittedAt));
  }

  async updateAppRequestStatus(id: number, status: string, adminNotes?: string, reviewedBy?: number): Promise<AppRequest> {
    await this.ensureInitialized();
    
    const [updatedRequest] = await db
      .update(appRequests)
      .set({
        status,
        adminNotes,
        reviewedBy,
        reviewedAt: new Date()
      })
      .where(eq(appRequests.id, id))
      .returning();
    
    return updatedRequest;
  }

  // Welcome email system
  async sendWelcomeEmail(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const welcomeMail: InsertPlayerMail = {
      userId,
      senderType: "system",
      senderName: "The Guild Development Team",
      subject: "Welcome to The Guild: Gamified Fitness!",
      content: `Welcome to The Guild, ${user.username}!

Thank you for joining this exciting project! You're now part of a community that's transforming fitness through gamification.

🎮 **What You Can Expect:**
• RPG-style character progression as you workout
• Earn XP and level up your Strength, Stamina, and Agility
• Battle monsters in progressive dungeons to earn gold
• Daily quests to maintain your fitness streak
• Compete on leaderboards with other guild members

🚀 **This Project Will Continue to Evolve**
The Guild is actively being developed with new features, content, and improvements based on community feedback. Your experience will keep getting better as we add:
• New workout programs and exercises
• Additional RPG mechanics and rewards
• Enhanced social features
• More dungeon content and challenges

💬 **Have Ideas or Feedback?**
We value your input! Use the feedback button in your mail to submit suggestions, report issues, or request new features. Your feedback directly shapes the future of The Guild.

Start your fitness journey today and watch your character grow stronger with every workout!

**The Guild Development Team**`,
      mailType: "announcement",
      isRead: false,
      rewards: null,
      rewardsClaimed: false,
      expiresAt: null
    };

    await this.createPlayerMail(welcomeMail);
  }
}

export const storage = new DatabaseStorage();
