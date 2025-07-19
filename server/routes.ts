import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkoutSchema, insertWorkoutSessionSchema, insertExercisePerformanceSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const userId = 1; // TODO: Get from session/auth
      const workouts = await storage.getUserWorkouts(userId);
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });

  app.post("/api/workouts", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
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
      const userId = 1; // TODO: Get from session/auth
      const sessions = await storage.getUserWorkoutSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout sessions" });
    }
  });

  app.post("/api/workout-sessions", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const sessionData = insertWorkoutSessionSchema.parse({ ...req.body, userId });
      
      // Calculate XP and stat gains
      const { xpEarned, statsEarned } = calculateRewards(sessionData);
      sessionData.xpEarned = xpEarned;
      sessionData.statsEarned = statsEarned;
      
      const session = await storage.createWorkoutSession(sessionData);
      
      // Update user stats
      const user = await storage.getUser(userId);
      if (user) {
        const newExperience = user.experience + xpEarned;
        const newLevel = calculateLevel(newExperience);
        
        await storage.updateUser(userId, {
          experience: newExperience,
          level: newLevel,
          strength: user.strength + (statsEarned.strength || 0),
          stamina: user.stamina + (statsEarned.stamina || 0),
          agility: user.agility + (statsEarned.agility || 0),
        });
      }
      
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
      const userId = 1; // TODO: Get from session/auth
      const records = await storage.getUserPersonalRecords(userId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personal records" });
    }
  });

  // Wardrobe routes
  app.get("/api/wardrobe/items", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const items = await storage.getWardrobeItemsWithOwnership(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wardrobe items" });
    }
  });

  app.post("/api/wardrobe/purchase", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const { itemId } = req.body;
      const result = await storage.purchaseWardrobeItem(userId, itemId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to purchase item" });
    }
  });

  app.post("/api/wardrobe/equip", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const { itemId, category } = req.body;
      await storage.equipWardrobeItem(userId, itemId, category);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to equip item" });
    }
  });

  app.post("/api/wardrobe/unequip", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const { category } = req.body;
      await storage.unequipWardrobeItem(userId, category);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to unequip item" });
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

  // User stats route
  app.get("/api/user/stats", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const user = await storage.getUser(userId);
      if (!user) {
        // Create default user if none exists
        const defaultUser = await storage.createUser({ username: "player", password: "password" });
        return res.json(defaultUser);
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  // Update user stats (for battle rewards and workouts)
  app.patch("/api/user/stats", async (req, res) => {
    try {
      const { experienceGain, strengthGain, staminaGain, agilityGain, goldGain } = req.body;
      const userId = 1; // TODO: Get from session/auth
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const newXP = user.experience + (experienceGain || 0);
      const newLevel = calculateLevel(newXP);
      const newGold = (user.gold || 0) + (goldGain || 0);
      
      const updatedUser = await storage.updateUser(userId, {
        experience: newXP,
        level: newLevel,
        strength: user.strength + (strengthGain || 0),
        stamina: user.stamina + (staminaGain || 0),
        agility: user.agility + (agilityGain || 0),
        gold: newGold,
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
      const userId = 1; // TODO: Get from session/auth
      
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
      const { username, skinColor, hairColor } = req.body;
      const userId = 1; // TODO: Get from session/auth
      
      const updates: any = {};
      if (username) updates.username = username;
      if (skinColor) updates.skinColor = skinColor;
      if (hairColor) updates.hairColor = hairColor;
      
      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user profile" });
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
