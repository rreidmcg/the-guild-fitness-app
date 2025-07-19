import { 
  users, exercises, workouts, workoutSessions, exercisePerformances, personalRecords, workoutPrograms, programWorkouts, wardrobeItems, userWardrobe,
  type User, type InsertUser, type Exercise, type InsertExercise, 
  type Workout, type InsertWorkout, type WorkoutSession, type InsertWorkoutSession,
  type ExercisePerformance, type InsertExercisePerformance,
  type PersonalRecord, type InsertPersonalRecord,
  type WorkoutProgram, type InsertWorkoutProgram,
  type ProgramWorkout, type InsertProgramWorkout,
  type WardrobeItem, type InsertWardrobeItem,
  type UserWardrobe, type InsertUserWardrobe
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

  // Wardrobe operations
  getWardrobeItemsWithOwnership(userId: number): Promise<any[]>;
  purchaseWardrobeItem(userId: number, itemId: number): Promise<any>;
  equipWardrobeItem(userId: number, itemId: number, category: string): Promise<void>;
  unequipWardrobeItem(userId: number, category: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeDefaultExercises();
      await this.initializeDefaultWardrobeItems();
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

  private async initializeDefaultWardrobeItems() {
    // Check if wardrobe items already exist
    const existingItems = await db.select().from(wardrobeItems).limit(1);
    if (existingItems.length > 0) return;

    const defaultWardrobeItems = [
      // Hats
      { name: "Red Cap", category: "hat", rarity: "common", price: 5, unlockLevel: 1, color: "#FF0000", description: "A basic red cap" },
      { name: "Blue Beanie", category: "hat", rarity: "common", price: 8, unlockLevel: 2, color: "#0000FF", description: "A cozy blue beanie" },
      { name: "Knight Helmet", category: "hat", rarity: "rare", price: 25, unlockLevel: 5, color: "#C0C0C0", description: "A sturdy knight's helmet" },
      { name: "Crown of Champions", category: "hat", rarity: "legendary", price: 100, unlockLevel: 10, color: "#FFD700", description: "Only for the mightiest warriors" },

      // Shirts
      { name: "White T-Shirt", category: "shirt", rarity: "common", price: 3, unlockLevel: 1, color: "#FFFFFF", description: "A simple white t-shirt" },
      { name: "Green Tank Top", category: "shirt", rarity: "common", price: 6, unlockLevel: 2, color: "#00FF00", description: "Perfect for workouts" },
      { name: "Armor Vest", category: "shirt", rarity: "rare", price: 30, unlockLevel: 6, color: "#8B4513", description: "Protective leather armor" },
      { name: "Hero's Tunic", category: "shirt", rarity: "epic", price: 60, unlockLevel: 8, color: "#800080", description: "Worn by legendary heroes" },

      // Pants
      { name: "Blue Jeans", category: "pants", rarity: "common", price: 4, unlockLevel: 1, color: "#000080", description: "Classic blue jeans" },
      { name: "Black Shorts", category: "pants", rarity: "common", price: 7, unlockLevel: 2, color: "#000000", description: "Comfortable workout shorts" },
      { name: "Battle Pants", category: "pants", rarity: "rare", price: 20, unlockLevel: 4, color: "#654321", description: "Reinforced combat trousers" },
      { name: "Golden Leggings", category: "pants", rarity: "legendary", price: 80, unlockLevel: 9, color: "#FFD700", description: "Shimmering golden pants" },

      // Shoes
      { name: "White Sneakers", category: "shoes", rarity: "common", price: 6, unlockLevel: 1, color: "#FFFFFF", description: "Basic white sneakers" },
      { name: "Red Running Shoes", category: "shoes", rarity: "common", price: 9, unlockLevel: 2, color: "#FF0000", description: "Made for speed" },
      { name: "Combat Boots", category: "shoes", rarity: "rare", price: 15, unlockLevel: 3, color: "#000000", description: "Heavy-duty boots" },
      { name: "Winged Sandals", category: "shoes", rarity: "epic", price: 50, unlockLevel: 7, color: "#FFD700", description: "Swift as the wind" },
    ];

    try {
      await db.insert(wardrobeItems).values(defaultWardrobeItems);
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

  // Wardrobe operations
  async getWardrobeItemsWithOwnership(userId: number): Promise<any[]> {
    await this.ensureInitialized();
    
    const items = await db.select().from(wardrobeItems);
    const ownedItems = await db.select().from(userWardrobe).where(eq(userWardrobe.userId, userId));
    const user = await this.getUser(userId);
    
    return items.map(item => ({
      ...item,
      isOwned: ownedItems.some(owned => owned.wardrobeItemId === item.id),
      isEquipped: (
        (item.category === 'hat' && user?.equippedHat === item.name) ||
        (item.category === 'shirt' && user?.equippedShirt === item.name) ||  
        (item.category === 'pants' && user?.equippedPants === item.name) ||
        (item.category === 'shoes' && user?.equippedShoes === item.name)
      )
    }));
  }

  async purchaseWardrobeItem(userId: number, itemId: number): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const [item] = await db.select().from(wardrobeItems).where(eq(wardrobeItems.id, itemId));
    if (!item) throw new Error("Item not found");

    // Check if user can afford it
    if (user.gold < item.price) {
      throw new Error("Not enough gold");
    }

    // Check level requirement
    if (user.level < item.unlockLevel) {
      throw new Error(`Level ${item.unlockLevel} required`);
    }

    // Check if already owned
    const [existingOwnership] = await db.select().from(userWardrobe)
      .where(eq(userWardrobe.userId, userId))
      .where(eq(userWardrobe.wardrobeItemId, itemId));
    
    if (existingOwnership) {
      throw new Error("Item already owned");
    }

    // Purchase the item
    await db.insert(userWardrobe).values({
      userId: userId,
      wardrobeItemId: itemId
    });

    // Deduct gold
    await this.updateUser(userId, { gold: user.gold - item.price });

    return { item, goldSpent: item.price };
  }

  async equipWardrobeItem(userId: number, itemId: number, category: string): Promise<void> {
    // Verify ownership
    const [ownership] = await db.select().from(userWardrobe)
      .where(eq(userWardrobe.userId, userId))
      .where(eq(userWardrobe.wardrobeItemId, itemId));
    
    if (!ownership) throw new Error("Item not owned");

    const [item] = await db.select().from(wardrobeItems).where(eq(wardrobeItems.id, itemId));
    if (!item) throw new Error("Item not found");

    // Map category to user field
    const fieldMap: Record<string, string> = {
      hat: 'equippedHat',
      shirt: 'equippedShirt', 
      pants: 'equippedPants',
      shoes: 'equippedShoes'
    };

    const field = fieldMap[category];
    if (!field) throw new Error("Invalid category");

    // Update user's equipped item
    await this.updateUser(userId, { [field]: item.name });
  }

  async unequipWardrobeItem(userId: number, category: string): Promise<void> {
    const fieldMap: Record<string, string> = {
      hat: 'equippedHat',
      shirt: 'equippedShirt',
      pants: 'equippedPants', 
      shoes: 'equippedShoes'
    };

    const field = fieldMap[category];
    if (!field) throw new Error("Invalid category");

    // Remove equipped item
    await this.updateUser(userId, { [field]: null });
  }
}

export const storage = new DatabaseStorage();
