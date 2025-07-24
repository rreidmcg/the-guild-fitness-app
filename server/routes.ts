import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkoutSchema, insertWorkoutSessionSchema, insertExercisePerformanceSchema, users, playerInventory } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { authUtils } from "./auth";

// Simple in-memory session storage (in production, use proper session management)
let currentUserId: number = 1;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, username, password, height, weight, fitnessGoal, measurementUnit, gender } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Check if email already exists
      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ error: "Email already registered" });
        }
      }

      // Hash password securely
      const hashedPassword = await authUtils.hashPassword(password);
      
      // Generate email verification token
      const verificationToken = authUtils.generateVerificationToken();

      // Create user with profile data
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        height,
        weight,
        fitnessGoal,
        measurementUnit,
        gender,
        experience: 0,
        level: 1,
        strength: 0,
        stamina: 0,
        agility: 0,
        gold: 10,
        currentHp: 10,
        currentMp: 0,
        skinColor: "#F5C6A0",
        hairColor: "#8B4513",
        currentTier: "E",
        currentTitle: "Recruit"
      } as any);

      // Send verification email
      if (email) {
        const emailSent = await authUtils.sendVerificationEmail(email, username, verificationToken);
        if (!emailSent) {
          console.warn("Failed to send verification email to:", email);
        }
      }

      res.json({ 
        user: { ...newUser, password: undefined }, // Don't send password back
        message: "Account created successfully! Please check your email to verify your account.",
        emailVerificationSent: !!email
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Compare hashed passwords securely
      const passwordValid = await authUtils.comparePassword(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Check if email is verified (if email exists)
      if (user.email && !user.emailVerified) {
        return res.status(403).json({ 
          error: "Please verify your email address before logging in",
          emailVerificationRequired: true
        });
      }

      // Set the current user ID for session tracking
      currentUserId = user.id;

      res.json({ 
        user: { ...user, password: undefined }, // Don't send password back
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      // In production, this would destroy the session or invalidate the token
      // For now, just return success
      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // Admin routes - only accessible to users with <G.M.> title
  app.get("/api/admin/users", async (req, res) => {
    try {
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || currentUser.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Access denied" });
      }

      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/system-stats", async (req, res) => {
    try {
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || currentUser.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Access denied" });
      }

      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ error: "Failed to fetch system stats" });
    }
  });

  // Exercise routes
  app.get("/api/exercises", async (req, res) => {
    try {
      const exercises = await storage.getAllExercises();
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  // Workout routes
  app.get("/api/workouts", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const workouts = await storage.getUserWorkouts(userId);
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });

  app.post("/api/workouts", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const workoutData = insertWorkoutSchema.parse({ ...req.body, userId });
      const workout = await storage.createWorkout(workoutData);
      res.json(workout);
    } catch (error) {
      res.status(400).json({ error: "Invalid workout data" });
    }
  });

  app.put("/api/workouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workout = await storage.updateWorkout(id, req.body);
      res.json(workout);
    } catch (error) {
      res.status(500).json({ error: "Failed to update workout" });
    }
  });

  app.delete("/api/workouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkout(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workout" });
    }
  });

  // Workout session routes
  app.get("/api/workout-sessions", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const sessions = await storage.getUserWorkoutSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout sessions" });
    }
  });

  app.post("/api/workout-sessions", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const sessionData = insertWorkoutSessionSchema.parse({ ...req.body, userId });
      
      // Calculate XP and stat gains
      const { xpEarned, statsEarned } = calculateRewards(sessionData);
      sessionData.xpEarned = xpEarned;
      sessionData.statsEarned = statsEarned;
      
      const session = await storage.createWorkoutSession(sessionData);
      
      // Update user stats
      const user = await storage.getUser(userId);
      if (user) {
        const newExperience = (user.experience || 0) + xpEarned;
        const newLevel = calculateLevel(newExperience);
        
        await storage.updateUser(userId, {
          experience: newExperience,
          level: newLevel,
          strength: (user.strength || 0) + (statsEarned.strength || 0),
          stamina: (user.stamina || 0) + (statsEarned.stamina || 0),
          agility: (user.agility || 0) + (statsEarned.agility || 0),
        });
      }
      
      // Update streak after completing workout
      await storage.updateStreak(userId);
      
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid session data" });
    }
  });

  // Exercise performance routes
  app.post("/api/exercise-performances", async (req, res) => {
    try {
      const performanceData = insertExercisePerformanceSchema.parse(req.body);
      const performance = await storage.createExercisePerformance(performanceData);
      res.json(performance);
    } catch (error) {
      res.status(400).json({ error: "Invalid performance data" });
    }
  });

  // Personal records routes
  app.get("/api/personal-records", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const records = await storage.getUserPersonalRecords(userId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personal records" });
    }
  });

  // Wardrobe routes
  app.get("/api/wardrobe/items", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const items = await storage.getWardrobeItemsWithOwnership(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wardrobe items" });
    }
  });

  app.post("/api/wardrobe/purchase", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const { itemId } = req.body;
      const result = await storage.purchaseWardrobeItem(userId, itemId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message || "Failed to purchase item" });
    }
  });

  app.post("/api/wardrobe/equip", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const { itemId, category } = req.body;
      await storage.equipWardrobeItem(userId, itemId, category);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message || "Failed to equip item" });
    }
  });

  app.post("/api/wardrobe/unequip", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const { category } = req.body;
      await storage.unequipWardrobeItem(userId, category);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message || "Failed to unequip item" });
    }
  });

  // Workout Programs routes
  app.get("/api/workout-programs", async (req, res) => {
    try {
      const programs = await storage.getAllWorkoutPrograms();
      res.json(programs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout programs" });
    }
  });

  app.get("/api/workout-programs/:id/workouts", async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const workouts = await storage.getProgramWorkouts(programId);
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch program workouts" });
    }
  });

  // Get user stats with HP and MP regeneration
  app.get("/api/user/stats", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate max HP and MP
      const maxHp = Math.max(10, 10 + (user.stamina || 0) * 3);
      const maxMp = ((user.stamina || 0) * 2) + ((user.agility || 0) * 1); // MP Formula: (Stamina × 2) + (Agility × 1)
      let currentHp = maxHp; // Default to max HP if no HP tracking yet
      let currentMp = maxMp; // Default to max MP if no MP tracking yet
      
      try {
        // Try to get current HP and MP from database (may not exist yet)
        const [userWithStats] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
          
        if (userWithStats && userWithStats.currentHp !== null) {
          currentHp = userWithStats.currentHp;
          currentMp = userWithStats.currentMp || maxMp;
          
          const currentTime = Date.now();
          
          // Apply HP regeneration if not at max HP
          const lastHpUpdateTime = userWithStats.lastHpUpdateAt ? new Date(userWithStats.lastHpUpdateAt).getTime() : Date.now();
          const hpMinutesElapsed = Math.floor((currentTime - lastHpUpdateTime) / (1000 * 60));
          
          let hpChanged = false;
          if (currentHp < maxHp && hpMinutesElapsed > 0) {
            const hpRegenAmount = Math.floor(maxHp * 0.01) * hpMinutesElapsed; // 1% per minute
            currentHp = Math.min(maxHp, currentHp + hpRegenAmount);
            hpChanged = hpRegenAmount > 0;
          }
          
          // Apply MP regeneration if not at max MP
          const lastMpUpdateTime = userWithStats.lastMpUpdateAt ? new Date(userWithStats.lastMpUpdateAt).getTime() : Date.now();
          const mpMinutesElapsed = Math.floor((currentTime - lastMpUpdateTime) / (1000 * 60));
          
          let mpChanged = false;
          if (currentMp < maxMp && mpMinutesElapsed > 0) {
            // MP Regen = (Agility ÷ 2)% of Max MP per minute
            const mpRegenRate = Math.max(0.01, ((user.agility || 0) / 2) / 100); // At least 1% regen
            const mpRegenAmount = Math.floor(maxMp * mpRegenRate) * mpMinutesElapsed;
            currentMp = Math.min(maxMp, currentMp + mpRegenAmount);
            mpChanged = mpRegenAmount > 0;
          }
          
          // Update HP and/or MP in database if they changed
          if (hpChanged || mpChanged) {
            const updateData: any = {};
            if (hpChanged) {
              updateData.currentHp = currentHp;
              updateData.lastHpUpdateAt = new Date();
            }
            if (mpChanged) {
              updateData.currentMp = currentMp;
              updateData.lastMpUpdateAt = new Date();
            }
            
            await db.update(users)
              .set(updateData)
              .where(eq(users.id, userId));
          }
        }
      } catch (error) {
        console.log("HP/MP columns may not exist yet, defaulting to max values");
      }

      res.json({
        level: user.level,
        experience: user.experience,
        strength: user.strength,
        stamina: user.stamina,
        agility: user.agility,
        gold: user.gold,
        battlesWon: user.battlesWon || 0,
        currentTier: user.currentTier,
        currentTitle: user.currentTitle,
        currentHp,
        maxHp,
        currentMp,
        maxMp,
        username: user.username,
        height: user.height,
        weight: user.weight,
        fitnessGoal: user.fitnessGoal,
        skinColor: user.skinColor,
        hairColor: user.hairColor,
        gender: user.gender,
        measurementUnit: user.measurementUnit
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  // Update user stats (for battle rewards and workouts)
  app.patch("/api/user/stats", async (req, res) => {
    try {
      const { experienceGain, strengthGain, staminaGain, agilityGain, goldGain, battleWon } = req.body;
      const userId = currentUserId; // Use the current logged-in user
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const newXP = user.experience + (experienceGain || 0);
      const newLevel = calculateLevel(newXP);
      const newGold = (user.gold || 0) + (goldGain || 0);
      const newBattlesWon = (user.battlesWon || 0) + (battleWon ? 1 : 0);
      
      const updatedUser = await storage.updateUser(userId, {
        experience: newXP,
        level: newLevel,
        strength: user.strength + (strengthGain || 0),
        stamina: user.stamina + (staminaGain || 0),
        agility: user.agility + (agilityGain || 0),
        gold: newGold,
        battlesWon: newBattlesWon,
      });
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user stats" });
    }
  });

  // Update user gender
  app.patch("/api/user/gender", async (req, res) => {
    try {
      const { gender } = req.body;
      const userId = currentUserId; // Use the current logged-in user
      
      if (!gender || !["male", "female"].includes(gender)) {
        return res.status(400).json({ error: "Invalid gender value" });
      }
      
      const updatedUser = await storage.updateUser(userId, { gender });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user gender" });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", async (req, res) => {
    try {
      const { username, skinColor, hairColor, height, weight, fitnessGoal, measurementUnit } = req.body;
      const userId = currentUserId; // Use the current logged-in user
      
      const updates: any = {};
      if (username) updates.username = username;
      if (skinColor) updates.skinColor = skinColor;
      if (hairColor) updates.hairColor = hairColor;
      if (height !== undefined) updates.height = height;
      if (weight !== undefined) updates.weight = weight;
      if (fitnessGoal) updates.fitnessGoal = fitnessGoal;
      if (measurementUnit) updates.measurementUnit = measurementUnit;
      
      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  // Update user title
  app.patch("/api/user/update-title", async (req, res) => {
    try {
      const { title } = req.body;
      const userId = currentUserId; // Use the current logged-in user
      
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: "Valid title is required" });
      }
      
      // Get user to check level and current title
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Define title requirements based on level
      const titleRequirements = [
        { title: "Recruit", level: 1 },
        { title: "Novice", level: 2 },
        { title: "Apprentice", level: 5 }, 
        { title: "Journeyman", level: 10 },
        { title: "Expert", level: 15 },
        { title: "Master", level: 20 },
        { title: "Champion", level: 25 },
        { title: "Legend", level: 30 },
        { title: "Mythic", level: 40 },
      ];

      // Check if title is available for user's level
      const titleReq = titleRequirements.find(req => req.title === title);
      if (titleReq && user.level < titleReq.level) {
        return res.status(403).json({ 
          error: `You need to reach level ${titleReq.level} to unlock the "${title}" title` 
        });
      }

      // Only allow <G.M.> title if user already has it (prevent regular users from getting admin access)
      if (title === "<G.M.>" && user.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "You don't have permission to use this title" });
      }

      // Validate title exists in our requirements or is the special admin title
      const validTitles = titleRequirements.map(req => req.title).concat(["<G.M.>"]);
      if (!validTitles.includes(title)) {
        return res.status(400).json({ error: "Invalid title selected" });
      }
      
      const updatedUser = await storage.updateUser(userId, { currentTitle: title });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user title" });
    }
  });

  // Shop routes
  app.get("/api/shop/items", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      console.log("Fetching shop items for user", userId);
      const shopItems = await storage.getShopItems(userId);
      console.log("Shop items fetched:", shopItems?.length, "items");
      res.json(shopItems);
    } catch (error) {
      console.error("Shop items error:", error);
      res.status(500).json({ error: "Failed to fetch shop items" });
    }
  });

  app.post("/api/shop/purchase", async (req, res) => {
    try {
      const { itemId } = req.body;
      const userId = currentUserId; // Use the current logged-in user
      
      const result = await storage.purchaseShopItem(userId, itemId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Purchase failed" });
    }
  });

  // Wardrobe routes
  app.get("/api/wardrobe/items", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const items = await storage.getWardrobeItemsWithOwnership(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wardrobe items" });
    }
  });

  app.post("/api/wardrobe/purchase", async (req, res) => {
    try {
      const { itemId } = req.body;
      const userId = currentUserId; // Use the current logged-in user
      
      const result = await storage.purchaseWardrobeItem(userId, itemId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Purchase failed" });
    }
  });

  app.post("/api/wardrobe/equip", async (req, res) => {
    try {
      const { itemId, category } = req.body;
      const userId = currentUserId; // Use the current logged-in user
      
      await storage.equipWardrobeItem(userId, itemId, category);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Equip failed" });
    }
  });

  app.post("/api/wardrobe/unequip", async (req, res) => {
    try {
      const { category } = req.body;
      const userId = currentUserId; // Use the current logged-in user
      
      await storage.unequipWardrobeItem(userId, category);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Unequip failed" });
    }
  });

  // Achievements routes
  app.get("/api/user/achievements", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  // Daily quest routes
  app.get("/api/daily-progress", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const progress = await storage.getDailyProgress(userId, today);
      res.json(progress || {
        userId,
        date: today,
        hydration: false,
        steps: false,
        protein: false,
        xpAwarded: false
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily progress" });
    }
  });

  app.post("/api/complete-daily-quest", async (req, res) => {
    try {
      const { questType } = req.body;
      const userId = currentUserId; // Use the current logged-in user
      
      if (!questType || !['hydration', 'steps', 'protein'].includes(questType)) {
        return res.status(400).json({ error: "Invalid quest type" });
      }
      
      const result = await storage.completeDailyQuest(userId, questType);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete daily quest" });
    }
  });

  app.post("/api/use-streak-freeze", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const result = await storage.useStreakFreeze(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to use streak freeze" });
    }
  });

  // Inventory endpoints
  app.get("/api/inventory", async (req, res) => {
    const userId = currentUserId; // Use the current logged-in user
    
    try {
      const inventory = await db
        .select()
        .from(playerInventory)
        .where(eq(playerInventory.userId, userId));
      
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Use potion endpoint
  app.post("/api/use-potion", async (req, res) => {
    const userId = currentUserId; // Use the current logged-in user
    const { potionType } = req.body;
    
    if (!potionType || !["minor_healing", "major_healing", "full_healing", "minor_mana", "major_mana", "full_mana"].includes(potionType)) {
      return res.status(400).json({ error: "Invalid potion type" });
    }
    
    try {
      // Check if user has the potion
      const [inventoryItem] = await db
        .select()
        .from(playerInventory)
        .where(
          and(
            eq(playerInventory.userId, userId),
            eq(playerInventory.itemType, "potion"),
            eq(playerInventory.itemName, potionType)
          )
        );
      
      if (!inventoryItem || (inventoryItem.quantity || 0) <= 0) {
        return res.status(400).json({ error: "You don't have this potion" });
      }
      
      // Get user stats to calculate max HP and current HP
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
        
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Determine if this is a healing or mana potion
      const isHealingPotion = potionType.includes("healing");
      const isManaPotion = potionType.includes("mana");
      
      let result: any = { success: true };
      let updateData: any = {};
      
      if (isHealingPotion) {
        // Calculate max HP (10 base HP + 3 HP per stamina point)
        const maxHp = Math.max(10, 10 + (user.stamina || 0) * 3);
        
        // Calculate healing amount based on potion type
        let healAmount = 0;
        switch (potionType) {
          case "minor_healing":
            healAmount = Math.ceil(maxHp * 0.25); // 25% of max HP
            break;
          case "major_healing":
            healAmount = Math.ceil(maxHp * 0.50); // 50% of max HP
            break;
          case "full_healing":
            healAmount = maxHp; // Full HP
            break;
        }
        
        // Calculate new HP (can't exceed max HP)
        const newHp = Math.min(maxHp, (user.currentHp || maxHp) + healAmount);
        const actualHealing = newHp - (user.currentHp || maxHp);
        
        if (actualHealing <= 0) {
          return res.status(400).json({ error: "You are already at full health" });
        }
        
        updateData.currentHp = newHp;
        updateData.lastHpUpdateAt = new Date();
        result.healedAmount = actualHealing;
        result.newHp = newHp;
        result.maxHp = maxHp;
      } else if (isManaPotion) {
        // Calculate max MP: (Stamina × 2) + (Agility × 1)
        const maxMp = ((user.stamina || 0) * 2) + ((user.agility || 0) * 1);
        
        // Calculate mana restoration amount based on potion type
        let manaAmount = 0;
        switch (potionType) {
          case "minor_mana":
            manaAmount = Math.ceil(maxMp * 0.25); // 25% of max MP
            break;
          case "major_mana":
            manaAmount = Math.ceil(maxMp * 0.50); // 50% of max MP
            break;
          case "full_mana":
            manaAmount = maxMp; // Full MP
            break;
        }
        
        // Calculate new MP (can't exceed max MP)
        const currentMp = user.currentMp || maxMp;
        const newMp = Math.min(maxMp, currentMp + manaAmount);
        const actualRestoration = newMp - currentMp;
        
        if (actualRestoration <= 0) {
          return res.status(400).json({ error: "You are already at full mana" });
        }
        
        updateData.currentMp = newMp;
        updateData.lastMpUpdateAt = new Date();
        result.restoredAmount = actualRestoration;
        result.newMp = newMp;
        result.maxMp = maxMp;
      }
      
      // Update user stats and potion quantity in a transaction
      await db.transaction(async (tx) => {
        // Update user stats
        await tx
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId));
        
        // Decrease potion quantity
        if ((inventoryItem.quantity || 0) > 1) {
          await tx
            .update(playerInventory)
            .set({ quantity: (inventoryItem.quantity || 0) - 1 })
            .where(eq(playerInventory.id, inventoryItem.id));
        } else {
          await tx
            .delete(playerInventory)
            .where(eq(playerInventory.id, inventoryItem.id));
        }
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error using potion:", error);
      res.status(500).json({ error: "Failed to use potion" });
    }
  });

  // Purchase potion endpoint
  app.post("/api/shop/buy-potion", async (req, res) => {
    const userId = currentUserId; // Use the current logged-in user
    const { potionType, quantity = 1 } = req.body;
    
    const potionPrices = {
      minor_healing: 10,
      major_healing: 25,
      full_healing: 50,
      minor_mana: 8,
      major_mana: 20,
      full_mana: 40
    };
    
    if (!potionType || !potionPrices[potionType as keyof typeof potionPrices]) {
      return res.status(400).json({ error: "Invalid potion type" });
    }
    
    const totalCost = potionPrices[potionType as keyof typeof potionPrices] * quantity;
    
    try {
      // Get user's current gold
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
        
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if ((user.gold || 0) < totalCost) {
        return res.status(400).json({ error: "Not enough gold" });
      }
      
      // Update gold and inventory in a transaction
      await db.transaction(async (tx) => {
        // Deduct gold
        await tx
          .update(users)
          .set({ gold: (user.gold || 0) - totalCost })
          .where(eq(users.id, userId));
        
        // Add or update inventory
        const [existingItem] = await tx
          .select()
          .from(playerInventory)
          .where(
            and(
              eq(playerInventory.userId, userId),
              eq(playerInventory.itemType, "potion"),
              eq(playerInventory.itemName, potionType)
            )
          );
        
        if (existingItem) {
          await tx
            .update(playerInventory)
            .set({ quantity: (existingItem.quantity || 0) + quantity })
            .where(eq(playerInventory.id, existingItem.id));
        } else {
          await tx
            .insert(playerInventory)
            .values({
              userId,
              itemType: "potion",
              itemName: potionType,
              quantity
            });
        }
      });
      
      res.json({ success: true, goldSpent: totalCost });
    } catch (error) {
      console.error("Error purchasing potion:", error);
      res.status(500).json({ error: "Failed to purchase potion" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function calculateRewards(sessionData: any) {
  const baseXP = 50;
  const durationBonus = Math.floor((sessionData.duration || 0) / 10) * 10;
  const volumeBonus = Math.floor((sessionData.totalVolume || 0) / 100) * 5;
  
  const xpEarned = baseXP + durationBonus + volumeBonus;
  
  // Stat gains based on workout type - simplified logic
  const statsEarned = {
    strength: Math.floor(Math.random() * 3) + 1,
    stamina: Math.floor(Math.random() * 2) + 1,
    agility: Math.floor(Math.random() * 2) + 1,
  };
  
  return { xpEarned, statsEarned };
}

function calculateLevel(experience: number): number {
  // Simple level calculation: every 1000 XP = 1 level
  return Math.floor(experience / 1000) + 1;
}
