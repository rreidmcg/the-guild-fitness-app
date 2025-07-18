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
          endurance: user.endurance + (statsEarned.endurance || 0),
          flexibility: user.flexibility + (statsEarned.flexibility || 0),
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
    endurance: Math.floor(Math.random() * 2) + 1,
    flexibility: Math.floor(Math.random() * 1) + 1,
  };
  
  return { xpEarned, statsEarned };
}

function calculateLevel(experience: number): number {
  // Simple level calculation: every 1000 XP = 1 level
  return Math.floor(experience / 1000) + 1;
}
