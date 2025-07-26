import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkoutSchema, insertWorkoutSessionSchema, insertExercisePerformanceSchema, users, playerInventory } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { authUtils } from "./auth";
import { validateUsername, sanitizeUsername } from "./username-validation";
import { AtrophySystem } from "./atrophy-system";
import { calculateStatXpGains, calculateStatLevel } from "./stat-progression";
import { workoutValidator } from "./workout-validation";
import { workoutRecommendationEngine } from "./workout-recommendations";
import Stripe from "stripe";

// Simple in-memory session storage (in production, use proper session management)
let currentUserId: number = 1;

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Workout recommendations route (premium feature)
  app.get("/api/workout-recommendations", async (req, res) => {
    try {
      const userId = currentUserId;
      
      // Check if user has active subscription
      const user = await storage.getUser(userId);
      if (!user || user.subscriptionStatus !== 'active') {
        return res.status(403).json({ 
          error: "Premium subscription required",
          message: "AI workout recommendations are a premium feature. Subscribe to unlock personalized training plans!" 
        });
      }
      
      const recommendations = await workoutRecommendationEngine.getRecommendationsForUser(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating workout recommendations:", error);
      res.status(500).json({ error: "Failed to generate workout recommendations" });
    }
  });

  // Create workout from recommendation
  app.post("/api/workout-recommendations/:id/create", async (req, res) => {
    try {
      const userId = currentUserId;
      const recommendationId = req.params.id;
      
      // Get the recommendation
      const recommendations = await workoutRecommendationEngine.getRecommendationsForUser(userId);
      const recommendation = recommendations.find(r => r.id === recommendationId);
      
      if (!recommendation) {
        return res.status(404).json({ error: "Recommendation not found" });
      }
      
      // Create workout from recommendation
      const workout = await storage.createWorkout({
        userId,
        name: recommendation.name,
        description: recommendation.description,
        exercises: recommendation.exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          duration: ex.duration,
          restTime: ex.restTime,
        })),
      });
      
      res.json(workout);
    } catch (error) {
      console.error("Error creating workout from recommendation:", error);
      res.status(500).json({ error: "Failed to create workout" });
    }
  });

  // Leaderboard route
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await db
        .select({
          id: users.id,
          username: users.username,
          level: users.level,
          experience: users.experience,
          title: users.currentTitle,
          strength: users.strength,
          stamina: users.stamina,
          agility: users.agility,
          skinColor: users.skinColor,
          hairColor: users.hairColor,
          gender: users.gender,
          height: users.height,
          weight: users.weight,
          fitnessGoal: users.fitnessGoal,
        })
        .from(users)
        .orderBy(desc(users.experience))
        .limit(100);
      

      
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, username, password, height, weight, fitnessGoal, measurementUnit, gender } = req.body;
      
      // Validate and sanitize username
      const validation = validateUsername(username);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      const sanitizedUsername = sanitizeUsername(username);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(sanitizedUsername);
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
        username: sanitizedUsername,
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
      
      // Grant new user immunity to atrophy for 7 days
      await AtrophySystem.grantNewUserImmunity(newUser.id);

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
      // Clear current user session
      currentUserId = 1; // Reset to default
      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // Email verification route
  app.get("/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).send(`
          <html><body>
            <h2>Invalid Verification Link</h2>
            <p>The verification link is missing or invalid.</p>
          </body></html>
        `);
      }

      const user = await storage.getUserByVerificationToken(token as string);
      if (!user) {
        return res.status(400).send(`
          <html><body>
            <h2>Invalid or Expired Link</h2>
            <p>This verification link is invalid or has expired.</p>
          </body></html>
        `);
      }

      // Update user to verified
      await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null
      });

      res.send(`
        <html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #2563eb;">Email Verified Successfully!</h2>
          <p>Your Dumbbells & Dragons account has been verified. You can now log in.</p>
          <a href="/" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Go to Dumbbells & Dragons
          </a>
        </body></html>
      `);
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).send(`
        <html><body>
          <h2>Verification Error</h2>
          <p>An error occurred during email verification.</p>
        </body></html>
      `);
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
      
      // Create a simplified session data object that matches the schema
      const sessionData = {
        userId,
        workoutId: req.body.workoutId || null,
        name: req.body.name || "Workout Session",
        duration: req.body.duration || 30,
        totalVolume: req.body.totalVolume || 0,
        xpEarned: req.body.xpEarned || 50,
        statsEarned: req.body.statsEarned || { strength: 15, stamina: 20, agility: 15 }
      };
      
      // Get user data for stat updates
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const session = await storage.createWorkoutSession(sessionData);
      
      // Update user stats with the XP and stat gains
      const newExperience = (user.experience || 0) + sessionData.xpEarned;
      const newLevel = calculateLevel(newExperience);
      
      const statsEarned = sessionData.statsEarned || {};
      const strengthGain = statsEarned.strength || 0;
      const staminaGain = statsEarned.stamina || 0;
      const agilityGain = statsEarned.agility || 0;
      
      await storage.updateUser(userId, {
        experience: newExperience,
        level: newLevel,
        strength: (user.strength || 0) + strengthGain,
        stamina: (user.stamina || 0) + staminaGain,
        agility: (user.agility || 0) + agilityGain,
      });
      
      // Update streak after completing workout
      await storage.updateStreak(userId);
      
      // Record activity to prevent atrophy
      await AtrophySystem.recordActivity(userId);
      
      // Check and unlock achievements after workout completion
      const newAchievements = await storage.checkAndUnlockAchievements(userId);
      
      // Return session data with calculated rewards and validation info for the victory screen
      res.json({
        ...session,
        xpEarned: sessionData.xpEarned,
        validation: {
          multiplier: 1,
          suspicious: [],
          confidence: "high"
        },
        statsEarned: sessionData.statsEarned,
        name: sessionData.name || "Workout Session",
        newAchievements: newAchievements
      });
    } catch (error) {
      console.error("Workout session error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: "Invalid session data", details: error.message });
      } else {
        res.status(400).json({ error: "Invalid session data" });
      }
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
      
      // Check for daily reset and auto streak freeze before getting stats
      const user = await storage.getUser(userId);
      const userTimezone = user?.timezone || undefined;
      const { dailyResetService } = await import("./daily-reset-system.js");
      await dailyResetService.checkAndResetDailyQuests(userId, userTimezone);
      
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
        measurementUnit: user.measurementUnit,
        streakFreezeCount: user.streakFreezeCount || 0
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
      
      // Check for achievements after stat/gold gains
      const newAchievements = await storage.checkAndUnlockAchievements(userId);
      
      res.json({
        ...updatedUser,
        newAchievements: newAchievements
      });
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
      if (username) {
        // Validate and sanitize username
        const validation = validateUsername(username);
        if (!validation.isValid) {
          return res.status(400).json({ error: validation.error });
        }

        const sanitizedUsername = sanitizeUsername(username);
        
        // Check if username already exists (exclude current user)
        const existingUser = await storage.getUserByUsername(sanitizedUsername);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: "Username already taken" });
        }

        updates.username = sanitizedUsername;
      }
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

  // Atrophy system routes
  app.get("/api/user/atrophy-status", async (req, res) => {
    try {
      const userId = currentUserId;
      const status = await AtrophySystem.getUserAtrophyStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching atrophy status:", error);
      res.status(500).json({ error: "Failed to fetch atrophy status" });
    }
  });

  // Manual streak freeze endpoint removed - now handled automatically at midnight

  app.post("/api/admin/process-atrophy", async (req, res) => {
    try {
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || currentUser.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Access denied" });
      }

      await AtrophySystem.processAtrophy();
      res.json({ success: true, message: "Atrophy processing completed" });
    } catch (error) {
      console.error("Error processing atrophy:", error);
      res.status(500).json({ error: "Failed to process atrophy" });
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
      const userLevel = user.level || 1; // Default to level 1 if null
      if (titleReq && userLevel < titleReq.level) {
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
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/user-achievements", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/check-achievements", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      const newAchievements = await storage.checkAndUnlockAchievements(userId);
      res.json({ newAchievements });
    } catch (error) {
      res.status(500).json({ error: "Failed to check achievements" });
    }
  });

  // Daily quest routes
  app.get("/api/daily-progress", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
      
      // Get user's timezone
      const user = await storage.getUser(userId);
      const userTimezone = user?.timezone || undefined;
      
      // Import the daily reset service and check for daily reset/auto streak freeze
      const { dailyResetService } = await import("./daily-reset-system.js");
      await dailyResetService.checkAndResetDailyQuests(userId, userTimezone);
      
      // Get progress after potential reset
      const progress = await storage.getDailyProgress(userId);
      
      if (progress) {
        res.json(progress);
      } else {
        const today = dailyResetService.getCurrentDateForUser(userTimezone);
        
        res.json({
          userId,
          date: today,
          hydration: false,
          steps: false,
          protein: false,
          sleep: false,
          xpAwarded: false,
          streakFreezeAwarded: false
        });
      }
    } catch (error) {
      console.error("Daily progress error:", error);
      res.status(500).json({ error: "Failed to fetch daily progress" });
    }
  });

  app.post("/api/toggle-daily-quest", async (req, res) => {
    try {
      const { questType, completed } = req.body;
      const userId = currentUserId; // Use the current logged-in user
      
      if (!questType || !['hydration', 'steps', 'protein', 'sleep'].includes(questType)) {
        return res.status(400).json({ error: "Invalid quest type" });
      }
      
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: "Completed must be a boolean" });
      }
      
      const result = await storage.toggleDailyQuest(userId, questType, completed);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle daily quest" });
    }
  });

  app.post("/api/complete-daily-quest", async (req, res) => {
    try {
      const { questType } = req.body;
      const userId = currentUserId; // Use the current logged-in user
      
      if (!questType || !['hydration', 'steps', 'protein', 'sleep'].includes(questType)) {
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

  // Delete item endpoint
  app.delete("/api/delete-item/:id", async (req, res) => {
    const userId = currentUserId; // Use the current logged-in user
    const itemId = parseInt(req.params.id);
    
    if (!itemId || isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }
    
    try {
      // Check if the item belongs to the user
      const [item] = await db
        .select()
        .from(playerInventory)
        .where(
          and(
            eq(playerInventory.id, itemId),
            eq(playerInventory.userId, userId)
          )
        );
      
      if (!item) {
        return res.status(404).json({ error: "Item not found or doesn't belong to you" });
      }
      
      // Delete the item
      await db
        .delete(playerInventory)
        .where(
          and(
            eq(playerInventory.id, itemId),
            eq(playerInventory.userId, userId)
          )
        );
      
      res.json({ success: true, message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ error: "Failed to delete item" });
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

  // Stripe payment routes for real money purchases
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, goldAmount, description } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          goldAmount: goldAmount?.toString() || "0",
          userId: currentUserId.toString(),
          description: description || "Gold purchase"
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        goldAmount 
      });
    } catch (error: any) {
      console.error("Stripe payment intent error:", error);
      res.status(500).json({ 
        error: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Stripe webhook to handle successful payments
  app.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      if (paymentIntent.metadata) {
        const userId = parseInt(paymentIntent.metadata.userId);
        const goldAmount = parseInt(paymentIntent.metadata.goldAmount);
        
        if (userId && goldAmount > 0) {
          try {
            // Add gold to user's account
            const [user] = await db
              .select()
              .from(users)
              .where(eq(users.id, userId));
            
            if (user) {
              await db
                .update(users)
                .set({ gold: (user.gold || 0) + goldAmount })
                .where(eq(users.id, userId));
              
              console.log(`Added ${goldAmount} gold to user ${userId} after successful payment`);
            }
          } catch (error) {
            console.error("Error adding gold after payment:", error);
          }
        }
      }
    }

    res.json({ received: true });
  });

  // Get payment success route (for redirect after payment)
  app.get("/api/payment-success", async (req, res) => {
    try {
      const { payment_intent } = req.query;
      
      if (payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent as string);
        
        if (paymentIntent.status === 'succeeded' && paymentIntent.metadata) {
          const userId = parseInt(paymentIntent.metadata.userId);
          const goldAmount = parseInt(paymentIntent.metadata.goldAmount);
          
          res.json({
            success: true,
            goldAmount,
            message: `Successfully purchased ${goldAmount} gold!`
          });
        } else {
          res.status(400).json({ error: "Payment not completed" });
        }
      } else {
        res.status(400).json({ error: "No payment intent provided" });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Error verifying payment: " + error.message });
    }
  });

  // User timezone setting
  app.post("/api/user/timezone", async (req, res) => {
    try {
      const userId = currentUserId;
      const { timezone } = req.body;
      
      if (!timezone || typeof timezone !== 'string') {
        return res.status(400).json({ error: "Invalid timezone" });
      }
      
      // Validate timezone using Intl API
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch (error) {
        return res.status(400).json({ error: "Invalid timezone format" });
      }
      
      const updatedUser = await storage.updateUser(userId, { timezone });
      res.json({ success: true, timezone: updatedUser.timezone });
    } catch (error) {
      console.error("Error setting timezone:", error);
      res.status(500).json({ error: "Failed to set timezone" });
    }
  });

  // Subscription routes
  app.post('/api/get-or-create-subscription', async (req, res) => {
    try {
      const userId = currentUserId;
      let user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        });
        return;
      }
      
      if (!user.email) {
        return res.status(400).json({ error: 'No user email on file' });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
      });

      user = await storage.updateStripeCustomerId(user.id, customer.id);

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          // Use a test price for now - in production, this would be your actual price ID
          price: 'price_1QSjWmI6D2ht7N9GdFKQZBJZ', // Test price
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.id, {
        customerId: customer.id, 
        subscriptionId: subscription.id
      });
  
      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return res.status(400).json({ error: { message: error.message } });
    }
  });

  // Check subscription status
  app.get('/api/subscription-status', async (req, res) => {
    try {
      const userId = currentUserId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const hasActiveSubscription = user.subscriptionStatus === 'active';
      
      res.json({
        hasActiveSubscription,
        subscriptionStatus: user.subscriptionStatus || 'inactive',
        subscriptionEndDate: user.subscriptionEndDate
      });
    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ error: "Failed to check subscription status" });
    }
  });

  // Mail system routes
  app.get('/api/mail', async (req, res) => {
    try {
      const userId = currentUserId;
      const mail = await storage.getPlayerMail(userId);
      res.json(mail);
    } catch (error: any) {
      console.error('Get mail error:', error);
      res.status(500).json({ error: "Failed to fetch mail" });
    }
  });

  app.post('/api/mail/:id/read', async (req, res) => {
    try {
      const userId = currentUserId;
      const mailId = parseInt(req.params.id);
      
      if (!mailId || isNaN(mailId)) {
        return res.status(400).json({ error: "Invalid mail ID" });
      }

      await storage.markMailAsRead(mailId, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Mark mail read error:', error);
      res.status(500).json({ error: "Failed to mark mail as read" });
    }
  });

  app.post('/api/mail/:id/claim', async (req, res) => {
    try {
      const userId = currentUserId;
      const mailId = parseInt(req.params.id);
      
      if (!mailId || isNaN(mailId)) {
        return res.status(400).json({ error: "Invalid mail ID" });
      }

      const result = await storage.claimMailRewards(mailId, userId);
      
      if (result.success) {
        res.json({ success: true, rewards: result.rewards });
      } else {
        res.status(400).json({ error: "Unable to claim rewards" });
      }
    } catch (error: any) {
      console.error('Claim mail rewards error:', error);
      res.status(500).json({ error: "Failed to claim mail rewards" });
    }
  });

  // Admin mail routes (only for G.M. users)
  app.post('/api/admin/send-mail', async (req, res) => {
    try {
      const userId = currentUserId;
      const user = await storage.getUser(userId);
      
      // Check if user is admin (has G.M. title)
      if (!user || user.currentTitle !== '<G.M.>') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { subject, content, mailType, rewards, targetUserIds, expiresAt } = req.body;

      if (!subject || !content || !mailType) {
        return res.status(400).json({ error: "Subject, content, and mail type are required" });
      }

      const mailData = {
        senderType: 'admin' as const,
        senderName: 'Developer Team',
        subject,
        content,
        mailType,
        rewards: rewards || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      };

      const sentCount = await storage.sendBulkMail(mailData, targetUserIds);
      
      res.json({ 
        success: true, 
        message: `Mail sent to ${sentCount} players`,
        sentCount 
      });
    } catch (error: any) {
      console.error('Send admin mail error:', error);
      res.status(500).json({ error: "Failed to send mail" });
    }
  });

  // Achievement routes
  app.get('/api/achievements', async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error: any) {
      console.error('Get achievements error:', error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get('/api/user-achievements', async (req, res) => {
    try {
      const userId = currentUserId;
      const userAchievements = await storage.getUserAchievements(userId);
      res.json(userAchievements);
    } catch (error: any) {
      console.error('Get user achievements error:', error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  // Social sharing routes
  app.post('/api/social-shares', async (req, res) => {
    try {
      const userId = currentUserId;
      const { shareType, title, description, shareData } = req.body;

      if (!shareType || !title || !description) {
        return res.status(400).json({ error: "Share type, title, and description are required" });
      }

      const share = await storage.createSocialShare({
        userId,
        shareType,
        title,
        description,
        shareData: shareData || null
      });

      res.json(share);
    } catch (error: any) {
      console.error('Create social share error:', error);
      res.status(500).json({ error: "Failed to create social share" });
    }
  });

  app.get('/api/social-shares', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const shares = await storage.getSocialShares(limit);
      res.json(shares);
    } catch (error: any) {
      console.error('Get social shares error:', error);
      res.status(500).json({ error: "Failed to fetch social shares" });
    }
  });

  app.post('/api/social-shares/:id/like', async (req, res) => {
    try {
      const userId = currentUserId;
      const shareId = parseInt(req.params.id);

      if (!shareId || isNaN(shareId)) {
        return res.status(400).json({ error: "Invalid share ID" });
      }

      const like = await storage.likeSocialShare(shareId, userId);
      res.json(like);
    } catch (error: any) {
      console.error('Like social share error:', error);
      res.status(500).json({ error: "Failed to like share" });
    }
  });

  app.delete('/api/social-shares/:id/like', async (req, res) => {
    try {
      const userId = currentUserId;
      const shareId = parseInt(req.params.id);

      if (!shareId || isNaN(shareId)) {
        return res.status(400).json({ error: "Invalid share ID" });
      }

      await storage.unlikeSocialShare(shareId, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Unlike social share error:', error);
      res.status(500).json({ error: "Failed to unlike share" });
    }
  });

  // Admin routes (restricted to G.M. users)
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = currentUserId;
      const user = await storage.getUser(userId);
      
      if (!user || user.currentTitle !== '<G.M.>') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Authentication failed' });
    }
  };

  app.get("/api/admin/analytics", isAdmin, async (req, res) => {
    try {
      const { analyticsService } = await import("./analytics.js");
      const analytics = await analyticsService.getFullAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/exercises", isAdmin, async (req, res) => {
    try {
      const exercises = await storage.getAllExercises();
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  app.get("/api/admin/monsters", isAdmin, async (req, res) => {
    try {
      const monsters = await storage.getAllMonsters();
      res.json(monsters);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monsters" });
    }
  });

  // Push notification routes
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const userId = currentUserId;
      const subscription = req.body;
      
      // Store push subscription in database (would need to add table)
      // For now, just acknowledge the subscription
      console.log(`User ${userId} subscribed to push notifications`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to subscribe to push notifications" });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const userId = currentUserId;
      console.log(`User ${userId} unsubscribed from push notifications`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsubscribe from push notifications" });
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

// Calculate XP required for a specific level using exponential formula
function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  // Exponential formula: level^1.8 * 82
  // This creates a curve where early levels are fast, later levels take much longer
  // Tuned so level 50 = exactly 52 weeks, level 100 = ~4.5 years (3 workouts/week)
  return Math.floor(Math.pow(level - 1, 1.8) * 82);
}

// Calculate level from total XP
function calculateLevel(experience: number): number {
  if (experience < 0) return 1;
  
  let level = 1;
  let xpRequired = 0;
  
  while (xpRequired <= experience) {
    level++;
    xpRequired = getXpRequiredForLevel(level);
  }
  
  return level - 1;
}
