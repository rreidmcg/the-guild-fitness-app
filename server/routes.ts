import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { insertWorkoutSchema, insertWorkoutSessionSchema, insertExercisePerformanceSchema, insertProgramWorkoutSchema, users, playerInventory, insertCustomAvatarSchema } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { authUtils } from "./auth";
import { validateUsername, sanitizeUsername } from "./username-validation";
import { AtrophySystem } from "./atrophy-system";
import { calculateStatXpGains, calculateStatLevel } from "./stat-progression";
import { applyStreakBonus } from "./streak-bonus";
import { workoutValidator } from "./workout-validation";
import { aiWorkoutEngine } from "./ai-workout-engine";
import { sendEmail, generateLiabilityWaiverEmail, generateAdminWaiverNotification } from "./email-service";
import { devAssistant } from "./dev-assistant";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import Stripe from "stripe";

// Extend the Request type to include session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Helper function to get current user ID from session
function getCurrentUserId(req: any): number | null {
  return req.session?.userId || null;
}

// Helper function to get current user ID with authentication check
function requireAuth(req: any): number {
  const userId = getCurrentUserId(req);
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}

// Helper function to generate URL-safe slug from name (server-side)
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Simple read-only viewer page 
  app.get("/api/viewer", (req, res) => {
    res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>The Fit Guild - Viewer Demo</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #0b0b0b; color: #f2f2f2; }
    h1 { color: #e63946; }
    .card { background: #151515; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>The Fit Guild - Read-Only Demo</h1>
  <div class="card">
    <p>This is a simple demo viewer for The Fit Guild fitness application.</p>
    <p>Features include RPG-style character progression, workout tracking, and gamification elements.</p>
  </div>
</body>
</html>`);
  });

  app.get("/api/viewer.json", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.json({
      "account": {
        "username": "demo_viewer",
        "level": 12,
        "xp": 4560,
        "xpToNext": 5000,
        "streak": 5
      },
      "workouts": [
        { "name": "Full-body Strength", "minutes": 48, "xp": 120 },
        { "name": "Zone 2 Run", "minutes": 32, "xp": 80 },
        { "name": "HIIT Circuit", "minutes": 22, "xp": 90 }
      ],
      "dungeon": {
        "name": "Goblin Mines",
        "floor": 3,
        "floors": 5,
        "titles": ["Goblin Slayer", "Orc Breaker"],
        "potions": ["Health x2", "Stamina x1"]
      },
      "leaderboard": [
        { "name": "PlayerOne", "xp": 12450 },
        { "name": "FitnessFury", "xp": 11980 },
        { "name": "demo_viewer", "xp": 4560 },
        { "name": "LevelGrinder", "xp": 3200 },
        { "name": "QuestQueen", "xp": 2880 }
      ],
      "shop": [
        { "name": "Founder Bundle", "status": "Unlocked ✅" },
        { "name": "Dragon Slayer Armor", "price": 2000 },
        { "name": "XP Boost Potion", "price": 500 }
      ]
    });
  });
  
  // Demo access routes
  app.get("/demo/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Import DemoService here to avoid circular dependencies
      const { DemoService } = await import("./demo-service.js");
      const result = await DemoService.validateMagicLink(token);
      
      if (!result.valid) {
        if (result.expired) {
          return res.status(410).send(`
            <html>
              <head><title>Demo Link Expired</title></head>
              <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1>Demo Link Expired</h1>
                <p>This demo link has expired. Please request a new one.</p>
              </body>
            </html>
          `);
        }
        return res.status(404).send(`
          <html>
            <head><title>Invalid Demo Link</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
              <h1>Invalid Demo Link</h1>
              <p>This demo link is not valid or has already been used.</p>
            </body>
          </html>
        `);
      }
      
      // Log in the demo user
      req.session.userId = result.userId;
      
      // Redirect to main app
      return res.redirect('/');
      
    } catch (error) {
      console.error('Demo access error:', error);
      return res.status(500).send(`
        <html>
          <head><title>Demo Error</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>Demo Access Error</h1>
            <p>There was an error accessing the demo. Please try again.</p>
          </body>
        </html>
      `);
    }
  });
  

  
  // Admin route to generate magic links
  app.post("/api/admin/generate-magic-link", async (req, res) => {
    try {
      const userId = requireAuth(req);
      
      // For demo purposes, allow any authenticated user to generate links
      console.log("Generating magic link for user:", userId);
      
      const { description } = req.body;
      
      // Import DemoService here to avoid circular dependencies
      const { DemoService } = await import("./demo-service.js");
      const result = await DemoService.generateMagicLink(description || "Demo Access");
      
      return res.json({
        success: true,
        magicLink: result.url,
        token: result.token,
        expiresIn: "24 hours"
      });
      
    } catch (error) {
      console.error('Generate magic link error:', error);
      return res.status(500).json({ error: "Failed to generate magic link" });
    }
  });
  // Workout recommendations route (premium feature) - DISABLED to save API costs
  /*
  app.get("/api/workout-recommendations", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Check if user has active subscription
      const user = await storage.getUser(userId);
      if (!user || user.subscriptionStatus !== 'active') {
        return res.status(403).json({ 
          error: "Premium subscription required",
          message: "AI workout recommendations are a premium feature. Subscribe to unlock personalized training plans!" 
        });
      }
      
      const recommendations = await aiWorkoutEngine.generateRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating workout recommendations:", error);
      res.status(500).json({ error: "Failed to generate workout recommendations" });
    }
  });
  */

  // Create workout from recommendation - DISABLED to save API costs
  /*
  app.post("/api/workout-recommendations/:id/create", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const recommendationId = req.params.id;
      
      // Get the recommendation
      const recommendations = await aiWorkoutEngine.generateRecommendations(userId);
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
  */

  // Analytics routes - Admin only
  app.get("/api/analytics/users", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const user = await storage.getUser(userId);
      
      // Check if user has G.M. title (admin access)
      if (!user || user.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { analyticsService } = await import("./analytics-service");
      const metrics = await analyticsService.getUserMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching user metrics:", error);
      res.status(500).json({ error: "Failed to fetch user metrics" });
    }
  });

  app.get("/api/analytics/retention", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const user = await storage.getUser(userId);
      
      if (!user || user.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { analyticsService } = await import("./analytics-service");
      const metrics = await analyticsService.getRetentionMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching retention metrics:", error);
      res.status(500).json({ error: "Failed to fetch retention metrics" });
    }
  });

  app.get("/api/analytics/engagement", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const user = await storage.getUser(userId);
      
      if (!user || user.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { analyticsService } = await import("./analytics-service");
      const metrics = await analyticsService.getEngagementMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching engagement metrics:", error);
      res.status(500).json({ error: "Failed to fetch engagement metrics" });
    }
  });

  app.get("/api/analytics/revenue", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const user = await storage.getUser(userId);
      
      if (!user || user.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { analyticsService } = await import("./analytics-service");
      const metrics = await analyticsService.getRevenueMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching revenue metrics:", error);
      res.status(500).json({ error: "Failed to fetch revenue metrics" });
    }
  });

  // Workout Program routes
  app.get("/api/workout-programs", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      
      const programs = await storage.getAllWorkoutPrograms();
      const trainingPrograms = await storage.getAllTrainingPrograms();
      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      
      // Convert training programs to workout program format for consistency
      const formattedTrainingPrograms = trainingPrograms.map((tp: any) => ({
        id: tp.id,
        name: tp.name,
        description: tp.description,
        price: 0, // Training programs are free for now
        priceFormatted: "Free",
        durationWeeks: tp.durationWeeks || 4,
        difficultyLevel: tp.difficulty || 'intermediate',
        targetAudience: tp.goal || 'General fitness enthusiasts',
        estimatedDuration: 45,
        workoutsPerWeek: tp.daysPerWeek || 3,
        features: [
          `${tp.durationWeeks || 4} weeks of structured training`,
          `${tp.daysPerWeek || 3} workouts per week`,
          'Progress tracking',
          'Coach notes included'
        ],
        isPurchased: true // Always consider training programs as purchased for now
      }));
      
      // Add purchase status to each traditional program
      const programsWithStatus = programs.map(program => ({
        ...program,
        isPurchased: purchasedPrograms.includes(program.id.toString()) || (program.price || 0) === 0,
        priceFormatted: `$${((program.price || 0) / 100).toFixed(2)}`
      }));
      
      // Combine both types of programs
      const allPrograms = [...programsWithStatus, ...formattedTrainingPrograms];
      
      res.json(allPrograms);
    } catch (error) {
      console.error("Error fetching workout programs:", error);
      res.status(500).json({ error: "Failed to fetch workout programs" });
    }
  });

  // Get individual program details (supports both ID and slug)
  app.get("/api/workout-programs/:id", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      
      const param = req.params.id;
      
      let program;
      let programId: number | string;
      let isTrainingProgram = false;
      
      // Check if param is a number (ID) or a string (slug/training program ID)
      const numericId = parseInt(param);
      if (!isNaN(numericId)) {
        // It's a numeric ID - check traditional programs first
        programId = numericId;
        program = await storage.getWorkoutProgram(programId);
      } else {
        // It's a string - could be a slug or training program ID
        // First try as training program ID
        const trainingProgram = await storage.getTrainingProgram(param);
        if (trainingProgram) {
          program = {
            id: trainingProgram.id,
            name: trainingProgram.name,
            description: trainingProgram.description,
            price: 0,
            durationWeeks: trainingProgram.durationWeeks || 4,
            difficultyLevel: 'intermediate', // Training programs don't have difficulty property
            targetAudience: trainingProgram.goal || 'General fitness enthusiasts',
            estimatedDuration: 45,
            workoutsPerWeek: trainingProgram.daysPerWeek || 3,
            features: [
              `${trainingProgram.durationWeeks || 4} weeks of structured training`,
              `${trainingProgram.daysPerWeek || 3} workouts per week`,
              'Progress tracking',
              'Coach notes included'
            ]
          };
          programId = param;
          isTrainingProgram = true;
        } else {
          // Try as slug for traditional programs
          const allPrograms = await storage.getAllWorkoutPrograms();
          program = allPrograms.find(p => generateSlug(p.name) === param);
          programId = program?.id || 0;
        }
      }
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const isPurchased = isTrainingProgram || purchasedPrograms.includes(programId.toString()) || program.price === 0;
      
      res.json({
        ...program,
        isPurchased,
        priceFormatted: isTrainingProgram ? "Free" : `$${((program.price || 0) / 100).toFixed(2)}`,
        isTrainingProgram
      });
    } catch (error) {
      console.error("Error fetching program details:", error);
      res.status(500).json({ error: "Failed to fetch program details" });
    }
  });

  app.get("/api/workout-programs/:id/workouts", async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      
      // Check if it's a training program first
      const trainingProgram = await storage.getTrainingProgram(req.params.id);
      if (trainingProgram) {
        // Return the training program calendar directly
        res.json(trainingProgram.calendar || []);
        return;
      }
      
      // Get program details first to check if it's free
      const program = await storage.getWorkoutProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Check if user has purchased this program OR if it's a free program
      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const isPurchased = purchasedPrograms.includes(programId.toString());
      const isFreeProgram = program.price === 0;
      
      if (!isPurchased && !isFreeProgram) {
        return res.status(403).json({ error: "Program not purchased" });
      }
      
      const workouts = await storage.getProgramWorkouts(programId);
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching program workouts:", error);
      res.status(500).json({ error: "Failed to fetch program workouts" });
    }
  });

  // Purchase workout program
  app.post("/api/purchase-program/:id", async (req, res) => {
    try {
      const programId = req.params.id;
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      
      // Check if already purchased
      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      if (purchasedPrograms.includes(programId)) {
        return res.status(400).json({ error: "Program already purchased" });
      }
      
      // Get program details for price
      const program = await storage.getWorkoutProgram(parseInt(programId));
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Create Stripe payment intent for one-time purchase
      const paymentIntent = await stripe.paymentIntents.create({
        amount: program.price || 0, // Already in cents
        currency: "usd",
        metadata: {
          userId: userId.toString(),
          programId: programId,
          programName: program.name,
          type: "workout_program"
        }
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        programName: program.name,
        price: program.price
      });
    } catch (error: any) {
      console.error("Error creating program payment:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Confirm program purchase after successful payment
  app.post("/api/confirm-program-purchase", async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Retrieve the payment intent from Stripe to verify it was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        const programId = paymentIntent.metadata.programId;
        
        // Add program to user's purchased programs
        await storage.purchaseWorkoutProgram(userId, programId);
        
        res.json({ 
          success: true, 
          programId: programId,
          message: "Program purchased successfully!" 
        });
      } else {
        res.status(400).json({ error: "Payment not completed" });
      }
    } catch (error: any) {
      console.error("Error confirming program purchase:", error);
      res.status(500).json({ error: "Failed to confirm purchase" });
    }
  });

  // Program Workout Management Routes
  
  // Get a specific program workout by ID
  app.get("/api/program-workouts/:workoutId", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      
      const workout = await storage.getProgramWorkout(workoutId);
      if (!workout) {
        return res.status(404).json({ error: "Program workout not found" });
      }

      // Get program to verify access (null safety check)
      if (!workout.programId) {
        return res.status(400).json({ error: "Workout has no associated program" });
      }
      const program = await storage.getWorkoutProgram(workout.programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      // Check if user has access to this program
      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const hasAccess = purchasedPrograms.includes(workout.programId.toString()) || (program.price || 0) === 0;
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(workout);
    } catch (error) {
      console.error("Error fetching program workout:", error);
      res.status(500).json({ error: "Failed to fetch program workout" });
    }
  });

  // Create a new program workout
  app.post("/api/workout-programs/:programId/workouts", async (req, res) => {
    try {
      const programId = parseInt(req.params.programId);
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      
      const validationResult = insertProgramWorkoutSchema.safeParse({
        ...req.body,
        programId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid workout data", details: validationResult.error });
      }
      
      // Verify program exists and user has access
      const program = await storage.getWorkoutProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      // Check if user owns this program or it's free
      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const hasAccess = purchasedPrograms.includes(programId.toString()) || program.price === 0;
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const workout = await storage.createProgramWorkout(validationResult.data);
      res.status(201).json(workout);
    } catch (error) {
      console.error("Error creating program workout:", error);
      res.status(500).json({ error: "Failed to create program workout" });
    }
  });

  // Update a program workout
  app.put("/api/program-workouts/:workoutId", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      
      // Get existing workout to verify ownership
      const existingWorkout = await storage.getProgramWorkout(workoutId);
      if (!existingWorkout) {
        return res.status(404).json({ error: "Program workout not found" });
      }

      // Verify program access (null safety check)
      if (!existingWorkout.programId) {
        return res.status(400).json({ error: "Workout has no associated program" });
      }
      const program = await storage.getWorkoutProgram(existingWorkout.programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const hasAccess = purchasedPrograms.includes(existingWorkout.programId.toString()) || (program.price || 0) === 0;
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updatedWorkout = await storage.updateProgramWorkout(workoutId, req.body);
      res.json(updatedWorkout);
    } catch (error) {
      console.error("Error updating program workout:", error);
      res.status(500).json({ error: "Failed to update program workout" });
    }
  });

  // Delete a program workout
  app.delete("/api/program-workouts/:workoutId", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      
      // Get existing workout to verify ownership
      const existingWorkout = await storage.getProgramWorkout(workoutId);
      if (!existingWorkout) {
        return res.status(404).json({ error: "Program workout not found" });
      }

      // Verify program access (null safety check)
      if (!existingWorkout.programId) {
        return res.status(400).json({ error: "Workout has no associated program" });
      }
      const program = await storage.getWorkoutProgram(existingWorkout.programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const hasAccess = purchasedPrograms.includes(existingWorkout.programId.toString()) || (program.price || 0) === 0;
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteProgramWorkout(workoutId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting program workout:", error);
      res.status(500).json({ error: "Failed to delete program workout" });
    }
  });

  // Copy/duplicate a program workout
  app.post("/api/program-workouts/:workoutId/copy", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      const { weekNumber, dayNumber, name } = req.body;
      
      // Get source workout
      const sourceWorkout = await storage.getProgramWorkout(workoutId);
      if (!sourceWorkout) {
        return res.status(404).json({ error: "Source workout not found" });
      }

      // Verify program access (null safety check)
      if (!sourceWorkout.programId) {
        return res.status(400).json({ error: "Source workout has no associated program" });
      }
      const program = await storage.getWorkoutProgram(sourceWorkout.programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const hasAccess = purchasedPrograms.includes(sourceWorkout.programId.toString()) || (program.price || 0) === 0;
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Create copy with new position and name
      const copiedWorkout = await storage.createProgramWorkout({
        programId: sourceWorkout.programId,
        weekNumber: weekNumber || sourceWorkout.weekNumber,
        dayNumber: dayNumber || sourceWorkout.dayNumber,
        name: name || `${sourceWorkout.name} (Copy)`,
        description: sourceWorkout.description,
        exercises: sourceWorkout.exercises,
        notes: sourceWorkout.notes,
        estimatedDuration: sourceWorkout.estimatedDuration,
      });
      
      res.status(201).json(copiedWorkout);
    } catch (error) {
      console.error("Error copying program workout:", error);
      res.status(500).json({ error: "Failed to copy program workout" });
    }
  });

  // Shop routes
  app.get("/api/shop", async (req, res) => {
    try {
      const items = await storage.getAllShopItems();
      
      // Format items for display
      const formattedItems = items.map(item => ({
        ...item,
        priceFormatted: item.currency === 'usd' 
          ? `$${(item.price / 100).toFixed(2)}`
          : `${item.price} 💎`
      }));
      
      res.json(formattedItems);
    } catch (error) {
      console.error("Error fetching shop items:", error);
      res.status(500).json({ error: "Failed to fetch shop items" });
    }
  });

  // Purchase gem pack with real money
  app.post("/api/purchase-gems/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      const items = await storage.getAllShopItems();
      const item = items.find(i => i.id === itemId);
      
      if (!item || item.currency !== 'usd' || item.itemType !== 'gems') {
        return res.status(404).json({ error: "Gem pack not found" });
      }
      
      // Create Stripe payment intent for gem purchase
      const paymentIntent = await stripe.paymentIntents.create({
        amount: item.price, // Already in cents
        currency: "usd",
        metadata: {
          userId: userId.toString(),
          itemId: itemId.toString(),
          gemAmount: item.gemAmount?.toString() || "0",
          type: "gem_purchase"
        }
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        itemName: item.name,
        price: item.price,
        gemAmount: item.gemAmount
      });
    } catch (error: any) {
      console.error("Error creating gem purchase:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Confirm gem purchase after successful payment
  app.post("/api/confirm-gem-purchase", async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Retrieve the payment intent from Stripe to verify it was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        const gemAmount = parseInt(paymentIntent.metadata.gemAmount || "0");
        
        // Add gems to user account
        await storage.addGems(userId, gemAmount);
        
        res.json({ 
          success: true, 
          gemAmount: gemAmount,
          message: `${gemAmount} gems added to your account!` 
        });
      } else {
        res.status(400).json({ error: "Payment not completed" });
      }
    } catch (error: any) {
      console.error("Error confirming gem purchase:", error);
      res.status(500).json({ error: "Failed to confirm purchase" });
    }
  });

  // Purchase item with gems
  app.post("/api/purchase-with-gems/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      const result = await storage.purchaseShopItem(userId, itemId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Error purchasing with gems:", error);
      res.status(500).json({ error: "Failed to purchase item" });
    }
  });

  // Founders pack routes
  app.get("/api/founders-pack/status", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const claimCount = await storage.getFoundersPackClaimCount();
      const canClaim = await storage.canUserClaimFoundersPack(userId);
      
      res.json({
        claimsRemaining: Math.max(0, 100 - claimCount),
        totalClaims: claimCount,
        canClaim,
        isAvailable: claimCount < 100
      });
    } catch (error: any) {
      console.error("Error checking founders pack status:", error);
      res.status(500).json({ error: "Failed to check status" });
    }
  });

  // Purchase founders pack
  app.post("/api/purchase-founders-pack", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Check if user can claim
      const canClaim = await storage.canUserClaimFoundersPack(userId);
      if (!canClaim) {
        return res.status(400).json({ error: "Founders Pack no longer available or already claimed" });
      }
      
      // Create Stripe payment intent for founders pack
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 2997, // $29.97 in cents
        currency: "usd",
        metadata: {
          userId: userId.toString(),
          type: "founders_pack"
        }
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        itemName: "Founders Pack",
        price: 2997
      });
    } catch (error: any) {
      console.error("Error creating founders pack purchase:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Confirm founders pack purchase
  app.post("/api/confirm-founders-pack", async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      
      // Retrieve the payment intent from Stripe to verify it was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Claim the founders pack
        const result = await storage.claimFoundersPack(userId, paymentIntentId);
        
        if (result.success) {
          res.json({ 
            success: true, 
            message: result.message,
            claimNumber: result.claimNumber
          });
        } else {
          res.status(400).json({ error: result.message });
        }
      } else {
        res.status(400).json({ error: "Payment not completed" });
      }
    } catch (error: any) {
      console.error("Error confirming founders pack purchase:", error);
      res.status(500).json({ error: "Failed to confirm purchase" });
    }
  });

  app.post("/api/create-subscription", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user already has active subscription
      if (user.subscriptionStatus === 'active') {
        return res.status(400).json({ 
          error: "Already subscribed",
          message: "You already have an active premium subscription!" 
        });
      }

      let customerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || `${user.username}@fitness.app`,
          name: user.username,
          metadata: { userId: userId.toString() }
        });
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      // Create 3-month subscription with installment plan
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ 
          price_data: {
            currency: 'usd',
            product: 'prod_premium_ai_fitness', // Using a simple product ID
            unit_amount: 999, // $9.99/month
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
          quantity: 1,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          plan_type: 'premium_quarterly',
          minimum_commitment: '3_months',
          userId: userId.toString(),
        },
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
      });

      // Store subscription in database
      await storage.updateUser(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'pending',
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        planDetails: {
          name: 'Premium AI Fitness Coach',
          duration: '3 months minimum',
          price: '$29.97 total',
          installments: '$9.99/month for 3 months',
          moneyBackGuarantee: true,
          features: [
            'Personalized AI workout recommendations',
            'Adaptive training plans based on your feedback',
            'Equipment-specific exercise suggestions',
            'Progress tracking and volume adjustments',
            'Priority customer support',
          ]
        }
      });
    } catch (error: any) {
      console.error("Subscription creation error:", error);
      res.status(500).json({ 
        error: "Failed to create subscription",
        message: error.message 
      });
    }
  });

  // Cancel subscription with money-back guarantee
  app.post("/api/cancel-subscription", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const { reason } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.status(400).json({ error: "No active subscription found" });
      }

      // Cancel at Stripe
      const canceledSubscription = await stripe.subscriptions.cancel(user.stripeSubscriptionId, {
        prorate: true, // Provide refund for unused time
      });

      // Update user subscription status
      await storage.updateUser(userId, {
        subscriptionStatus: 'canceled',
        subscriptionEndDate: new Date(canceledSubscription.canceled_at! * 1000),
      });

      // Create subscription history record
      // await storage.createSubscriptionHistory({
      //   userId,
      //   stripeSubscriptionId: user.stripeSubscriptionId,
      //   status: 'canceled',
      //   canceledAt: new Date(),
      //   cancelationReason: reason || 'User requested cancellation',
      // });

      res.json({
        success: true,
        message: "Subscription canceled successfully. Refund will be processed within 5-7 business days.",
        refundPolicy: "Full refund guaranteed for cancellations within 30 days of purchase."
      });
    } catch (error: any) {
      console.error("Subscription cancellation error:", error);
      res.status(500).json({ 
        error: "Failed to cancel subscription",
        message: error.message 
      });
    }
  });

  // Workout preferences management
  app.get("/api/workout-preferences", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const preferences = await storage.getUserWorkoutPreferences(userId);
      res.json(preferences || {
        equipmentAccess: 'home_gym',
        workoutsPerWeek: 3,
        sessionDuration: 45,
        fitnessLevel: 'beginner',
        injuriesLimitations: [],
        preferredMuscleGroups: [],
        avoidedExercises: [],
        trainingStyle: 'balanced'
      });
    } catch (error) {
      console.error("Error fetching workout preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.post("/api/workout-preferences", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const preferences = await storage.updateUserWorkoutPreferences(userId, req.body);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating workout preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Workout feedback for AI learning
  app.post("/api/workout-feedback", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const feedback = await storage.createWorkoutFeedback({
        userId,
        ...req.body
      });
      res.json(feedback);
    } catch (error) {
      console.error("Error submitting workout feedback:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // Leaderboard route
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, username, password, height, weight, fitnessGoal, measurementUnit, gender, avatarGender } = req.body;
      
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
        gender: avatarGender || gender,
        experience: 0,
        level: 1,
        // strength, stamina, agility will use database defaults (1 each)
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

      // Send welcome email to player mail system
      await storage.sendWelcomeEmail(newUser.id);

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
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Compare hashed passwords securely
      const passwordValid = await authUtils.comparePassword(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Email verification is no longer required for login
      // Users can log in immediately after account creation
      // Email verification is only required for password reset functionality

      // Set the user ID in session for proper authentication
      req.session.userId = user.id;

      res.json({ 
        user: { ...user, password: undefined }, // Don't send password back
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    try {
      // Clear the session
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // Change password endpoint
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Check if user is authenticated
      if (!getCurrentUserId(req)) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }
      
      // Get current user from database
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify current password
      const passwordValid = await authUtils.comparePassword(currentPassword, user.password);
      if (!passwordValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Check that new password is different
      const samePassword = await authUtils.comparePassword(newPassword, user.password);
      if (samePassword) {
        return res.status(400).json({ error: "New password must be different from current password" });
      }
      
      // Hash new password
      const hashedNewPassword = await authUtils.hashPassword(newPassword);
      
      // Update password in database
      await storage.updateUser(userId, { password: hashedNewPassword });
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      // Clear the session
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // Password reset routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Check if email is verified - required for password reset
      if (!user.emailVerified) {
        return res.status(403).json({ 
          error: "Email address must be verified before you can reset your password. Please check your email for the verification link.",
          emailVerificationRequired: true
        });
      }
      
      // Generate password reset token
      const resetToken = authUtils.generateVerificationToken();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      // Update user with reset token and expiry
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry
      });
      
      // Send password reset email
      const emailSent = await authUtils.sendPasswordResetEmail(email, user.username, resetToken);
      
      if (!emailSent) {
        console.error("Failed to send password reset email for:", email);
        return res.status(500).json({ error: "Failed to send reset email. Please try again later." });
      }
      
      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      
      // Find user by reset token
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      
      // Check if token has expired
      const now = new Date();
      if (!user.passwordResetExpiry || now > user.passwordResetExpiry) {
        return res.status(400).json({ error: "Reset token has expired" });
      }
      
      // Hash the new password
      const hashedPassword = await authUtils.hashPassword(newPassword);
      
      // Update user password and clear reset token
      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null
      });
      
      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
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
          <p>Your The Guild: Gamified Fitness account has been verified. You can now log in.</p>
          <a href="/" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Go to The Guild
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

  // Password reset page route
  app.get("/reset-password", (req, res) => {
    // This will be handled by the frontend router
    // The Vite dev server will serve the frontend app which will handle this route
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });

  // Admin routes - only accessible to users with <G.M.> title
  app.get("/api/admin/users", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Access denied" });
      }

      const allUsers = await storage.getAllUsers();
      console.log('Admin users fetch: Total users from DB:', allUsers.length);
      console.log('Admin users fetch: User list includes:', allUsers.map(u => `${u.username}(ID:${u.id})`).join(', '));
      
      // Sort users by ID for consistent ordering
      const sortedUsers = allUsers.sort((a, b) => a.id - b.id);
      res.json(sortedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/system-stats", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const currentUser = await storage.getUser(userId);
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      const workouts = await storage.getUserWorkouts(userId);
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });

  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const param = req.params.id;
      
      let workout;
      
      // Check if param is a number (ID) or a string (slug)
      const workoutId = parseInt(param);
      if (!isNaN(workoutId)) {
        // It's an ID
        workout = await storage.getWorkout(workoutId);
      } else {
        // It's a slug - need to find by name
        const userWorkouts = await storage.getUserWorkouts(userId);
        workout = userWorkouts.find(w => generateSlug(w.name) === param);
      }
      
      if (!workout || workout.userId !== userId) {
        return res.status(404).json({ error: "Workout not found" });
      }
      
      res.json(workout);
    } catch (error) {
      console.error("Error fetching workout:", error);
      res.status(500).json({ error: "Failed to fetch workout" });
    }
  });

  app.post("/api/workouts", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      const sessions = await storage.getUserWorkoutSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout sessions" });
    }
  });

  // Get individual workout session with exercise details
  app.get("/api/workout-sessions/:sessionId", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const sessionId = parseInt(req.params.sessionId);
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }
      
      const session = await storage.getWorkoutSessionById(sessionId, userId);
      
      if (!session) {
        return res.status(404).json({ error: "Workout session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching workout session:", error);
      res.status(500).json({ error: "Failed to fetch workout session" });
    }
  });

  app.post("/api/workout-sessions", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
      // Calculate XP based on actual completed sets
      const exercises = req.body.exercises || [];
      
      // Count total completed sets across all exercises
      let totalCompletedSets = 0;
      let totalPossibleSets = 0;
      let totalVolume = 0;
      
      exercises.forEach((exercise: any) => {
        if (exercise.sets && Array.isArray(exercise.sets)) {
          exercise.sets.forEach((set: any) => {
            totalPossibleSets++;
            if (set.completed) {
              totalCompletedSets++;
              // Calculate volume for completed sets only
              const weight = set.weight || 0;
              const reps = set.reps || 0;
              totalVolume += weight * reps;
            }
          });
        }
      });
      
      // Calculate completion percentage
      const completionPercentage = totalPossibleSets > 0 ? totalCompletedSets / totalPossibleSets : 0;
      
      // Base XP calculation (50 XP for full completion)
      const baseXP = Math.floor(50 * completionPercentage);
      
      // Create a simplified session data object that matches the schema
      const sessionData = {
        userId,
        workoutId: req.body.workoutId || null,
        name: req.body.name || "Workout Session",
        duration: req.body.duration || 30,
        totalVolume: totalVolume,
        xpEarned: baseXP,
        statsEarned: req.body.statsEarned || { strength: 15, stamina: 20, agility: 15 },
        exercises: exercises
      };
      
      // Get user data for stat updates
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const session = await storage.createWorkoutSession(sessionData);
      
      // Update user stats with the XP and stat gains using proper progression system
      // Apply streak bonus to main XP and stat XP
      const mainXpBonus = applyStreakBonus(sessionData.xpEarned, user.currentStreak ?? 0);
      const newExperience = (user.experience || 0) + mainXpBonus.finalXp;
      const newLevel = calculateLevel(newExperience);
      
      // Calculate XP gains for each stat based on workout
      const baseStatXpGains = calculateStatXpGains(sessionData);
      
      // Apply streak bonus to stat XP gains
      const strengthXpBonus = applyStreakBonus(baseStatXpGains.strengthXp, user.currentStreak ?? 0);
      const staminaXpBonus = applyStreakBonus(baseStatXpGains.staminaXp, user.currentStreak ?? 0);
      const agilityXpBonus = applyStreakBonus(baseStatXpGains.agilityXp, user.currentStreak ?? 0);
      
      const statXpGains = {
        strengthXp: strengthXpBonus.finalXp,
        staminaXp: staminaXpBonus.finalXp,
        agilityXp: agilityXpBonus.finalXp
      };
      
      // Update stat XP and recalculate actual stat levels
      const newStrengthXp = (user.strengthXp || 0) + statXpGains.strengthXp;
      const newStaminaXp = (user.staminaXp || 0) + statXpGains.staminaXp;
      const newAgilityXp = (user.agilityXp || 0) + statXpGains.agilityXp;
      
      // Calculate new stat levels from XP using diminishing returns
      const newStrength = calculateStatLevel(newStrengthXp);
      const newStamina = calculateStatLevel(newStaminaXp);
      const newAgility = calculateStatLevel(newAgilityXp);
      
      await storage.updateUser(userId, {
        experience: newExperience,
        level: newLevel,
        // Update both XP and calculated stat levels
        strengthXp: newStrengthXp,
        staminaXp: newStaminaXp,
        agilityXp: newAgilityXp,
        strength: newStrength,
        stamina: newStamina,
        agility: newAgility,
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
        xpEarned: mainXpBonus.finalXp,
        validation: {
          multiplier: 1,
          suspicious: [],
          confidence: "high"
        },
        statsEarned: {
          strength: statXpGains.strengthXp,
          stamina: statXpGains.staminaXp,
          agility: statXpGains.agilityXp
        },
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      const records = await storage.getUserPersonalRecords(userId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personal records" });
    }
  });

  // User exercise preferences routes
  app.get("/api/exercise-preferences", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const preferences = await storage.getUserExercisePreferences(userId);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercise preferences" });
    }
  });

  app.get("/api/exercise-preferences/:exerciseId", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const exerciseId = parseInt(req.params.exerciseId);
      const preference = await storage.getUserExercisePreference(userId, exerciseId);
      res.json(preference || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercise preference" });
    }
  });

  app.post("/api/exercise-preferences", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      console.log('Saving exercise preference - userId:', userId, 'body:', req.body);
      const preference = await storage.upsertUserExercisePreference({
        userId,
        ...req.body
      });
      console.log('Exercise preference saved successfully:', preference);
      res.json(preference);
    } catch (error) {
      console.error('Error saving exercise preference:', error);
      res.status(500).json({ error: "Failed to save exercise preference" });
    }
  });

  // Wardrobe routes
  app.get("/api/wardrobe/items", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      const items = await storage.getWardrobeItemsWithOwnership(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wardrobe items" });
    }
  });

  app.post("/api/wardrobe/purchase", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      const { itemId } = req.body;
      const result = await storage.purchaseWardrobeItem(userId, itemId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message || "Failed to purchase item" });
    }
  });

  app.post("/api/wardrobe/equip", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      const { itemId, category } = req.body;
      await storage.equipWardrobeItem(userId, itemId, category);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message || "Failed to equip item" });
    }
  });

  app.post("/api/wardrobe/unequip", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
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
      const userId = getCurrentUserId(req);
      
      // Check if user is authenticated
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
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
          // Fix legacy data: ensure current HP/MP doesn't exceed new max values
          // This handles cases where stats were reduced (like after stat squish)
          currentHp = Math.min(userWithStats.currentHp, maxHp);
          currentMp = Math.min(userWithStats.currentMp || maxMp, maxMp);
          
          // If values were capped, update database with corrected values
          const needsHpUpdate = userWithStats.currentHp > maxHp;
          const needsMpUpdate = (userWithStats.currentMp || 0) > maxMp;
          
          if (needsHpUpdate || needsMpUpdate) {
            console.log(`Fixing legacy HP/MP data: HP ${userWithStats.currentHp} -> ${currentHp}, MP ${userWithStats.currentMp} -> ${currentMp}`);
            const updateData: any = {};
            if (needsHpUpdate) updateData.currentHp = currentHp;
            if (needsMpUpdate) updateData.currentMp = currentMp;
            
            await db.update(users)
              .set(updateData)
              .where(eq(users.id, userId));
          }
          
          const currentTime = Date.now();
          
          // Apply HP regeneration if not at max HP and out of combat (1% per minute when outside dungeons)
          let hpChanged = false;
          if (currentHp < maxHp && userWithStats.lastBattleTime) {
            const timeSinceBattle = currentTime - userWithStats.lastBattleTime;
            const minutesSinceBattle = Math.floor(timeSinceBattle / (60 * 1000));
            
            console.log(`HP Regen Debug: currentHp=${currentHp}, maxHp=${maxHp}, timeSinceBattle=${timeSinceBattle}ms, minutes=${minutesSinceBattle}`);
            
            if (minutesSinceBattle > 0) {
              const hpRegenRate = 0.01; // 1% per minute
              const hpToRegenerate = Math.max(1, Math.floor(maxHp * hpRegenRate * minutesSinceBattle)); // Minimum 1 HP per minute
              const newHp = Math.min(maxHp, currentHp + hpToRegenerate);
              
              if (newHp > currentHp) {
                currentHp = newHp;
                hpChanged = true;
                console.log(`HP regeneration: +${hpToRegenerate} HP over ${minutesSinceBattle} minutes (${currentHp}/${maxHp})`);
              }
            }
          } else if (currentHp < maxHp) {
            console.log(`HP Regen Blocked: lastBattleTime=${userWithStats.lastBattleTime}, currentHp=${currentHp}, maxHp=${maxHp}`);
          }
          
          // Apply MP regeneration if not at max MP and out of combat
          const lastMpUpdateTime = userWithStats.lastMpUpdateAt ? new Date(userWithStats.lastMpUpdateAt).getTime() : currentTime;
          const mpMinutesElapsed = Math.floor((currentTime - lastMpUpdateTime) / (1000 * 60));
          
          let mpChanged = false;
          if (currentMp < maxMp && mpMinutesElapsed > 0) {
            // MP Regen = (Agility ÷ 2)% of Max MP per minute, minimum 1% regen
            const mpRegenRate = Math.max(0.01, ((user.agility || 0) / 2) / 100);
            const mpRegenAmount = Math.max(1, Math.floor(maxMp * mpRegenRate)) * mpMinutesElapsed;
            currentMp = Math.min(maxMp, currentMp + mpRegenAmount);
            mpChanged = mpRegenAmount > 0;
            if (mpChanged) {
              console.log(`MP regeneration: +${mpRegenAmount} MP over ${mpMinutesElapsed} minutes (${currentMp}/${maxMp})`);
            }
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

  // Update user profile (email, personal info)
  app.patch("/api/user/profile", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const { username, email, height, weight, fitnessGoal, measurementUnit, skinColor, hairColor, gender } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Validate username if provided
      if (username !== undefined) {
        const { validateUsername } = await import('./username-validation');
        const validation = validateUsername(username);
        if (!validation.isValid) {
          return res.status(400).json({ error: validation.error });
        }

        // Check if username is already taken by another user
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }

      // Validate email if provided
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: "Invalid email format" });
        }

        // Check if email is already taken by another user
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: "Email already in use by another account" });
        }
      }

      const updates: any = {};
      if (username !== undefined) updates.username = username;
      if (email !== undefined) updates.email = email;
      if (height !== undefined) updates.height = height;
      if (weight !== undefined) updates.weight = weight;
      if (fitnessGoal !== undefined) updates.fitnessGoal = fitnessGoal;
      if (measurementUnit !== undefined) updates.measurementUnit = measurementUnit;
      if (skinColor !== undefined) updates.skinColor = skinColor;
      if (hairColor !== undefined) updates.hairColor = hairColor;
      if (gender !== undefined) updates.gender = gender;

      // Check if there are any updates to make
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
      }

      const updatedUser = await storage.updateUser(userId, updates);
      
      res.json({ 
        success: true, 
        message: "Profile updated successfully",
        user: {
          username: updatedUser.username,
          email: updatedUser.email,
          height: updatedUser.height,
          weight: updatedUser.weight,
          fitnessGoal: updatedUser.fitnessGoal,
          measurementUnit: updatedUser.measurementUnit,
          skinColor: updatedUser.skinColor,
          hairColor: updatedUser.hairColor,
          gender: updatedUser.gender
        }
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Update user stats (for battle rewards and workouts)
  app.patch("/api/user/stats", async (req, res) => {
    try {
      const { experienceGain, strengthGain, staminaGain, agilityGain, goldGain, battleWon } = req.body;
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
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
      
      // Record activity to prevent atrophy if it was a battle win
      if (battleWon) {
        await AtrophySystem.recordActivity(userId);
      }
      
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const currentUser = await storage.getUser(userId);
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: "Valid title is required" });
      }
      
      // Get user to check level and current title
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Define title requirements based on dungeon boss progression system
      const titleRequirements = [
        { title: "Recruit", level: 1 },
        { title: "Goblin Slayer", level: 10 },
        { title: "Orc Crusher", level: 20 },
        { title: "Dragon Vanquisher", level: 30 },
        { title: "Demon Hunter", level: 40 }, // In Development
        { title: "Titan Slayer", level: 50 }, // In Development
        { title: "God Killer", level: 60 }, // In Development
        { title: "The First Flame", level: 1 }, // Special Founders Pack title
      ];

      // Check if title is available for user's level
      const titleReq = titleRequirements.find(req => req.title === title);
      const userLevel = user.level || 1; // Default to level 1 if null
      if (titleReq && userLevel < titleReq.level) {
        return res.status(403).json({ 
          error: `You need to reach level ${titleReq.level} to unlock the "${title}" title` 
        });
      }

      // Only allow <G.M.> title for Zero and Rob (prevent regular users from getting admin access)
      const username = user.username.toLowerCase();
      const isAuthorized = username === "zero" || username === "rob";
      
      if (title === "<G.M.>" && !isAuthorized) {
        return res.status(403).json({ error: "G.M. title is restricted to admin users" });
      }

      // Handle "No Title" option (set to null)
      const titleToSet = title === "No Title" ? null : title;
      
      // Special handling for exclusive titles - Zero has access to ALL titles
      if (title === "The First Flame" && user.currentTitle !== "The First Flame" && username !== "zero") {
        return res.status(403).json({ error: "This title is exclusive to Founders Pack members" });
      }
      
      // Validate title exists in our requirements or is the special admin title or is "No Title"
      const validTitles = titleRequirements.map(req => req.title).concat(["<G.M.>", "No Title"]);
      if (!validTitles.includes(title)) {
        return res.status(400).json({ error: "Invalid title selected" });
      }
      
      const updatedUser = await storage.updateUser(userId, { currentTitle: titleToSet });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user title" });
    }
  });

  app.patch("/api/user/update-avatar", async (req, res) => {
    try {
      const { gender } = req.body;
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
      if (!gender || typeof gender !== 'string') {
        return res.status(400).json({ error: "Valid gender is required" });
      }
      
      // Validate gender value - allow gm_avatar for Zero and Rob
      const validGenders = ['male', 'female', 'legendary_hunter', 'gm_avatar'];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({ error: "Invalid gender value" });
      }
      
      // Restrict gm_avatar to Zero and Rob only
      if (gender === 'gm_avatar') {
        const user = await storage.getUser(userId);
        const username = user?.username?.toLowerCase();
        if (username !== "zero" && username !== "rob") {
          return res.status(403).json({ error: "G.M. avatar is restricted to admin users" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, { gender });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user avatar" });
    }
  });

  // Shop routes
  app.get("/api/shop/items", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
      const result = await storage.purchaseShopItem(userId, itemId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Purchase failed" });
    }
  });

  // Wardrobe routes
  app.get("/api/wardrobe/items", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      const items = await storage.getWardrobeItemsWithOwnership(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wardrobe items" });
    }
  });

  app.post("/api/wardrobe/purchase", async (req, res) => {
    try {
      const { itemId } = req.body;
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
      const result = await storage.purchaseWardrobeItem(userId, itemId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Purchase failed" });
    }
  });

  app.post("/api/wardrobe/equip", async (req, res) => {
    try {
      const { itemId, category } = req.body;
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
      await storage.equipWardrobeItem(userId, itemId, category);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Equip failed" });
    }
  });

  app.post("/api/wardrobe/unequip", async (req, res) => {
    try {
      const { category } = req.body;
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/check-achievements", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      const newAchievements = await storage.checkAndUnlockAchievements(userId);
      res.json({ newAchievements });
    } catch (error) {
      res.status(500).json({ error: "Failed to check achievements" });
    }
  });

  app.post("/api/user-achievements/:achievementId/mark-viewed", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      const achievementId = parseInt(req.params.achievementId);
      
      if (isNaN(achievementId)) {
        return res.status(400).json({ error: "Invalid achievement ID" });
      }
      
      const result = await storage.markAchievementAsViewed(userId, achievementId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark achievement as viewed" });
    }
  });

  // Daily quest routes
  app.get("/api/daily-progress", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
      if (!questType || !['hydration', 'steps', 'protein', 'sleep'].includes(questType)) {
        return res.status(400).json({ error: "Invalid quest type" });
      }
      
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: "Completed must be a boolean" });
      }
      
      console.log(`Toggling daily quest for user ${userId}: ${questType} = ${completed}`);
      const result = await storage.toggleDailyQuest(userId, questType, completed);
      console.log(`Daily quest toggle result:`, result);
      res.json(result);
    } catch (error) {
      console.error("Daily quest toggle error:", error);
      res.status(500).json({ error: "Failed to toggle daily quest", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/complete-daily-quest", async (req, res) => {
    try {
      const { questType } = req.body;
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      
      if (!questType || !['hydration', 'steps', 'protein', 'sleep'].includes(questType)) {
        return res.status(400).json({ error: "Invalid quest type" });
      }
      
      console.log(`Completing daily quest for user ${userId}: ${questType}`);
      const result = await storage.completeDailyQuest(userId, questType);
      console.log(`Daily quest completion result:`, result);
      res.json(result);
    } catch (error) {
      console.error("Daily quest completion error:", error);
      res.status(500).json({ error: "Failed to complete daily quest", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/use-streak-freeze", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
      const result = await storage.useStreakFreeze(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to use streak freeze" });
    }
  });

  // Fitness Goal Progress endpoints
  app.get("/api/fitness-goals", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
      const goals = await storage.getUserFitnessGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching fitness goals:", error);
      res.status(500).json({ error: "Failed to fetch fitness goals" });
    }
  });

  app.post("/api/fitness-goals", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
      const { goalType, targetValue, unit, targetDate } = req.body;
      
      if (!goalType || !targetValue || !unit) {
        return res.status(400).json({ error: "Goal type, target value, and unit are required" });
      }
      
      const validGoalTypes = ["lose_weight", "gain_muscle", "improve_endurance", "general_fitness"];
      if (!validGoalTypes.includes(goalType)) {
        return res.status(400).json({ error: "Invalid goal type" });
      }
      
      const goalData = {
        userId,
        goalType,
        targetValue: parseInt(targetValue),
        unit,
        startDate: new Date().toISOString().split('T')[0],
        targetDate: targetDate || null,
        currentValue: 0,
        isActive: true,
      };
      
      const newGoal = await storage.createFitnessGoal(goalData);
      res.json(newGoal);
    } catch (error) {
      console.error("Error creating fitness goal:", error);
      res.status(500).json({ error: "Failed to create fitness goal" });
    }
  });

  app.put("/api/fitness-goals/:goalId", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
      const goalId = parseInt(req.params.goalId);
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }
      
      const updates = req.body;
      const updatedGoal = await storage.updateFitnessGoal(goalId, updates);
      res.json(updatedGoal);
    } catch (error) {
      console.error("Error updating fitness goal:", error);
      res.status(500).json({ error: "Failed to update fitness goal" });
    }
  });

  app.post("/api/fitness-goals/update-progress", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
      const { goalType, currentValue } = req.body;
      
      if (!goalType || currentValue === undefined) {
        return res.status(400).json({ error: "Goal type and current value are required" });
      }
      
      const updatedGoal = await storage.updateGoalProgress(userId, goalType, parseInt(currentValue));
      
      if (!updatedGoal) {
        return res.status(404).json({ error: "Active goal not found for this goal type" });
      }
      
      // Check for milestone achievements
      const milestoneResults = await storage.checkGoalMilestones(userId, updatedGoal.id);
      
      res.json({
        goal: updatedGoal,
        milestones: milestoneResults
      });
    } catch (error) {
      console.error("Error updating goal progress:", error);
      res.status(500).json({ error: "Failed to update goal progress" });
    }
  });

  app.get("/api/fitness-goals/analytics", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
      const analytics = await storage.getFitnessGoalAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching fitness goal analytics:", error);
      res.status(500).json({ error: "Failed to fetch fitness goal analytics" });
    }
  });

  // Inventory endpoints
  app.get("/api/inventory", async (req, res) => {
    const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
    
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
    const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
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
    const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
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
          return res.status(400).json({ error: "Full Health. Cannot use potion" });
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
          return res.status(400).json({ error: "Full Mana. Cannot use potion" });
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
    const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); } // Use the current logged-in user
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
          userId: getCurrentUserId(req)?.toString() || "",
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      let user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
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
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return res.status(400).json({ error: { message: error.message } });
    }
  });

  // Check subscription status
  app.get('/api/subscription-status', async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const mail = await storage.getPlayerMail(userId);
      res.json(mail);
    } catch (error: any) {
      console.error('Get mail error:', error);
      res.status(500).json({ error: "Failed to fetch mail" });
    }
  });

  app.post('/api/mail/:id/read', async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
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
      res.status(500).json({ error: error.message || "Failed to send mail" });
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
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

  // App request/feedback routes
  app.post("/api/app-requests", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const { category, title, description, priority, currentPage } = req.body;
      
      if (!category || !title || !description) {
        return res.status(400).json({ error: "Category, title, and description are required" });
      }

      // Get device information from request headers
      const deviceInfo = req.headers['user-agent'] || 'Unknown device';

      const appRequest = await storage.createAppRequest({
        userId,
        category,
        title,
        description,
        priority: priority || 'medium',
        currentPage: currentPage || null,
        deviceInfo,
        status: 'submitted'
      });

      res.json({ 
        success: true, 
        message: "Request submitted successfully! Thanks for your feedback.",
        request: appRequest 
      });
    } catch (error) {
      console.error("Error creating app request:", error);
      res.status(500).json({ error: "Failed to submit request" });
    }
  });

  app.get("/api/app-requests", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const userRequests = await storage.getUserAppRequests(userId);
      res.json(userRequests);
    } catch (error) {
      console.error("Error fetching user app requests:", error);
      res.status(500).json({ error: "Failed to fetch your requests" });
    }
  });

  // Complete onboarding
  app.post("/api/user/complete-onboarding", async (req, res) => {
    try {
      const userId = requireAuth(req);
      await storage.updateUser(userId, { hasCompletedOnboarding: true });
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  // Check onboarding status
  app.get("/api/user/onboarding-status", async (req, res) => {
    try {
      const userId = requireAuth(req);
      const user = await storage.getUser(userId);
      res.json({ hasCompletedOnboarding: user?.hasCompletedOnboarding || false });
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      res.status(500).json({ error: "Failed to check onboarding status" });
    }
  });

  // Update HP persistence for battle system
  app.post("/api/user/update-hp", async (req, res) => {
    try {
      const userId = requireAuth(req);
      const { currentHp, maxHp } = req.body;
      
      if (typeof currentHp !== 'number' || typeof maxHp !== 'number') {
        return res.status(400).json({ error: "Valid currentHp and maxHp required" });
      }
      
      // Ensure currentHp doesn't exceed maxHp and isn't negative
      const validCurrentHp = Math.max(0, Math.min(currentHp, maxHp));
      
      await db.update(users)
        .set({ 
          currentHp: validCurrentHp,
          lastBattleTime: Date.now() // Track when user left battle for HP regen
        })
        .where(eq(users.id, userId));
      
      res.json({ success: true, currentHp: validCurrentHp });
    } catch (error) {
      console.error("Error updating HP:", error);
      res.status(500).json({ error: "Failed to update HP" });
    }
  });

  // Admin routes (restricted to G.M. users)
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
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

  // Admin app request management
  app.get("/api/admin/app-requests", isAdmin, async (req, res) => {
    try {
      const allRequests = await storage.getAllAppRequests();
      res.json(allRequests);
    } catch (error) {
      console.error("Error fetching all app requests:", error);
      res.status(500).json({ error: "Failed to fetch app requests" });
    }
  });

  app.patch("/api/admin/app-requests/:id", isAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      const adminUserId = getCurrentUserId(req);
      
      if (!requestId || isNaN(requestId)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }

      const updatedRequest = await storage.updateAppRequestStatus(requestId, status, adminNotes, adminUserId || undefined);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating app request:", error);
      res.status(500).json({ error: "Failed to update request" });
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

  // Create new exercise
  app.post("/api/admin/exercises", isAdmin, async (req, res) => {
    try {
      const { name, category, muscleGroups, description, statTypes } = req.body;
      
      if (!name || !category || !muscleGroups || !statTypes) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const exercise = await storage.createExercise({
        name,
        category,
        muscleGroups,
        description,
        statTypes
      });

      res.json(exercise);
    } catch (error) {
      console.error("Error creating exercise:", error);
      res.status(500).json({ error: "Failed to create exercise" });
    }
  });

  // Create new monster
  app.post("/api/admin/monsters", isAdmin, async (req, res) => {
    try {
      const { name, level, tier, health, attack, defense, goldReward, imageUrl } = req.body;
      
      if (!name || !level || !tier || !health || !attack || typeof defense === 'undefined' || !goldReward) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const monster = await storage.createMonster({
        name,
        level,
        tier,
        maxHp: health,
        attack,
        goldReward
      });

      res.json(monster);
    } catch (error) {
      console.error("Error creating monster:", error);
      res.status(500).json({ error: "Failed to create monster" });
    }
  });

  // User management routes
  app.post("/api/admin/ban-user", isAdmin, async (req, res) => {
    try {
      const { userId, reason, duration } = req.body;
      const adminUserId = getCurrentUserId(req);
      if (!adminUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const adminUser = await storage.getUser(adminUserId);
      
      if (!userId || !reason) {
        return res.status(400).json({ error: "User ID and reason are required" });
      }

      // Calculate ban expiry if duration is provided (in days)
      let bannedUntil = null;
      if (duration && parseInt(duration) > 0) {
        bannedUntil = new Date();
        bannedUntil.setDate(bannedUntil.getDate() + parseInt(duration));
      }

      const banData = {
        isBanned: true,
        banReason: reason,
        bannedAt: new Date(),
        bannedUntil,
        bannedBy: adminUser?.username || 'Admin'
      };

      await storage.updateUser(userId, banData);
      res.json({ success: true, message: "User banned successfully" });
    } catch (error: any) {
      console.error("Error banning user:", error);
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  app.post("/api/admin/unban-user", isAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const unbanData = {
        isBanned: false,
        banReason: null,
        bannedAt: null,
        bannedUntil: null,
        bannedBy: null
      };

      await storage.updateUser(userId, unbanData);
      res.json({ success: true, message: "User unbanned successfully" });
    } catch (error: any) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ error: "Failed to unban user" });
    }
  });

  app.post("/api/admin/remove-user", isAdmin, async (req, res) => {
    try {
      const { userId, reason } = req.body;
      const adminUserId = getCurrentUserId(req);
      if (!adminUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const adminUser = await storage.getUser(adminUserId);
      
      if (!userId || !reason) {
        return res.status(400).json({ error: "User ID and reason are required" });
      }

      const removeData = {
        isDeleted: true,
        deletedAt: new Date(),
        deleteReason: reason,
        deletedBy: adminUser?.username || 'Admin'
      };

      await storage.updateUser(userId, removeData);
      res.json({ success: true, message: "User removed successfully" });
    } catch (error: any) {
      console.error("Error removing user:", error);
      res.status(500).json({ error: "Failed to remove user" });
    }
  });

  // Liability waiver acceptance route (no auth required - part of signup process)
  app.post("/api/accept-liability-waiver", async (req, res) => {
    try {
      const { fullName, email, ipAddress, userAgent } = req.body;

      if (!fullName || !email) {
        return res.status(400).json({ error: "Full name and email are required" });
      }

      // Find user by email for liability waiver tracking
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create liability waiver record
      await storage.createLiabilityWaiver({
        userId: user.id,
        fullName,
        email,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        waiverVersion: '1.0'
      });

      // Update user's liability waiver status
      await storage.updateUserLiabilityWaiverStatus(user.id, true, ipAddress);

      // Send confirmation email to user
      try {
        const userEmailHtml = generateLiabilityWaiverEmail(fullName, email);
        await sendEmail({
          to: email,
          subject: "Liability Waiver Confirmation - The Guild: Gamified Fitness",
          html: userEmailHtml
        });

        // Send notification to admin
        const adminEmailHtml = generateAdminWaiverNotification(fullName, email, ipAddress || 'unknown', userAgent || 'unknown');
        await sendEmail({
          to: "guildmasterreid@gmail.com",
          subject: "New Liability Waiver Signed - The Guild: Gamified Fitness",
          html: adminEmailHtml
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't fail the waiver acceptance if email fails
      }

      res.json({ success: true, message: "Liability waiver accepted successfully" });
    } catch (error) {
      console.error("Liability waiver acceptance error:", error);
      res.status(500).json({ error: "Failed to process liability waiver" });
    }
  });

  // Cleanup incomplete signup (when liability waiver is declined)
  app.post("/api/auth/cleanup-incomplete-signup", async (req, res) => {
    try {
      const { email, username } = req.body;

      if (!email || !username) {
        return res.status(400).json({ error: "Email and username are required" });
      }

      // Find and delete the user account that was created but waiver was declined
      const user = await storage.getUserByEmail(email);
      if (user && user.username === username) {
        // Only delete if liability waiver was not accepted
        if (!user.liabilityWaiverAccepted) {
          await storage.deleteUser(user.id);
          console.log(`Cleaned up incomplete signup for user: ${username} (${email})`);
        }
      }

      res.json({ success: true, message: "Cleanup completed" });
    } catch (error) {
      console.error("Cleanup incomplete signup error:", error);
      res.status(500).json({ error: "Failed to cleanup incomplete signup" });
    }
  });

  // Check username availability (no auth required - for signup form)
  app.get("/api/check-username/:username", async (req, res) => {
    try {
      const { username } = req.params;
      
      if (!username || username.length < 2 || username.length > 20) {
        return res.json({ available: false, error: "Username must be 2-20 characters" });
      }

      // Validate username format
      const validation = validateUsername(username);
      if (!validation.isValid) {
        return res.json({ available: false, error: validation.error });
      }

      // Check if username exists
      const existingUser = await storage.getUserByUsername(username);
      const available = !existingUser;

      console.log(`Username check: ${username}, found user:`, existingUser ? 'YES' : 'NO', `available: ${available}`);
      res.json({ available, username });
    } catch (error) {
      console.error("Username check error:", error);
      res.status(500).json({ available: false, error: "Failed to check username" });
    }
  });

  // Helper function to check battle access
  function hasBattleAccess(user: any): boolean {
    return user?.username === 'Zero' || user?.currentTitle === '<G.M.>';
  }

  // Battle system routes
  app.post("/api/battle/attack", async (req, res) => {
    try {
      const userId = requireAuth(req);
      const { monster, playerHp, playerMp, damageMultiplier = 1.0 } = req.body;
      
      // Check battle access
      const user = await storage.getUser(userId);
      if (!user || !hasBattleAccess(user)) {
        return res.status(403).json({ error: "You Do Not Have Access To This Feature" });
      }
      
      if (!monster) {
        return res.status(400).json({ error: "Monster data is required" });
      }

      // Calculate player stats with equipment bonuses (rebalanced for proper scaling)
      const playerAttack = Math.floor((user.strength || 1) * 1.2) + Math.floor((user.agility || 1) * 0.5);
      const playerDefense = Math.floor((user.stamina || 1) * 0.8) + Math.floor((user.strength || 1) * 0.3);
      
      // Calculate monster defense (lighter defense for balanced combat)
      const monsterDefense = Math.floor(monster.level * 0.5) + 1;
      
      // Calculate damage dealt by player to monster (balanced for 3-hit kills at equal level)
      const baseDamage = Math.max(2, playerAttack - monsterDefense);
      const damageVariance = Math.floor(Math.random() * Math.max(1, Math.floor(baseDamage * 0.5)));
      const rawDamage = baseDamage + damageVariance;
      
      // Apply combo damage multiplier
      const playerDamage = Math.floor(rawDamage * damageMultiplier);
      
      // Apply damage to monster
      const newMonsterHp = Math.max(0, monster.currentHp - playerDamage);
      
      // Initialize battle log with combo information
      const battleLog = [];
      if (damageMultiplier > 1.0) {
        const comboBonus = Math.floor((damageMultiplier - 1.0) * 100);
        battleLog.push(`COMBO HIT! You deal ${playerDamage} damage to ${monster.name}! (+${comboBonus}% combo bonus)`);
      } else {
        battleLog.push(`You deal ${playerDamage} damage to ${monster.name}!`);
      }
      
      // Check if monster is defeated
      let battleResult = 'ongoing';
      let goldEarned = 0;
      
      if (newMonsterHp <= 0) {
        battleResult = 'victory';
        goldEarned = monster.goldReward || 25;
        
        battleLog.push(`${monster.name} is defeated!`);
        battleLog.push(`You gained ${goldEarned} gold!`);
        
        // Update user stats (only gold and battles won, no XP from battles)
        const newGold = (user.gold || 0) + goldEarned;
        const newBattlesWon = (user.battlesWon || 0) + 1;
        
        await storage.updateUser(userId, {
          gold: newGold,
          battlesWon: newBattlesWon
        });
        
        // Record activity to prevent atrophy
        await AtrophySystem.recordActivity(userId);
        
        return res.json({
          playerHp: playerHp,
          playerMp: playerMp,
          monster: { ...monster, currentHp: 0 },
          battleLog,
          battleResult,
          goldEarned
        });
      }
      
      // Monster counter-attack if still alive (rebalanced)
      const monsterBaseDamage = Math.max(1, Math.floor(monster.attack * 0.9) - Math.floor(playerDefense * 0.8));
      const monsterDamageVariance = Math.floor(Math.random() * Math.max(1, Math.floor(monsterBaseDamage * 0.3)));
      const actualMonsterDamage = monsterBaseDamage + monsterDamageVariance;
      
      const newPlayerHp = Math.max(0, playerHp - actualMonsterDamage);
      
      battleLog.push(`${monster.name} attacks for ${actualMonsterDamage} damage!`);
      
      if (newPlayerHp <= 0) {
        battleResult = 'defeat';
        battleLog.push("You have been defeated!");
      }
      
      // Update player HP in database
      await storage.updateUser(userId, { currentHp: newPlayerHp });
      
      res.json({
        playerHp: newPlayerHp,
        playerMp: playerMp,
        monster: { ...monster, currentHp: newMonsterHp },
        battleLog,
        battleResult,
        goldEarned: 0
      });
      
    } catch (error) {
      console.error("Battle attack error:", error);
      res.status(500).json({ error: "Battle attack failed" });
    }
  });

  // Push notification routes
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
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
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      console.log(`User ${userId} unsubscribed from push notifications`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsubscribe from push notifications" });
    }
  });

  // Add endpoint to recalculate user level with new XP formula
  app.post("/api/recalculate-level", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); if (!userId) { return res.status(401).json({ error: "Authentication required" }); }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Recalculate level based on current XP using new formula
      const newLevel = calculateLevel(user.experience || 0);
      
      // Update user's level in database
      await storage.updateUser(userId, { level: newLevel });
      
      res.json({ 
        message: "Level recalculated successfully",
        oldLevel: user.level,
        newLevel: newLevel,
        experience: user.experience 
      });
    } catch (error) {
      console.error("Level recalculation error:", error);
      res.status(500).json({ error: "Failed to recalculate level" });
    }
  });

  // Development Assistant API Routes
  // POST /api/dev/review-code - Review code for bugs and improvements
  app.post("/api/dev/review-code", async (req, res) => {
    try {
      const userId = requireAuth(req);
      const user = await storage.getUser(userId);
      
      // Only allow admin users (G.M. title)
      if (!user || user.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { filePath, code } = req.body;
      if (!filePath) {
        return res.status(400).json({ error: "File path is required" });
      }

      const review = await devAssistant.reviewCode(filePath, code);
      res.json(review);
    } catch (error) {
      console.error("Code review error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Code review failed" });
    }
  });

  // POST /api/dev/suggest-tests - Generate test suggestions
  app.post("/api/dev/suggest-tests", async (req, res) => {
    try {
      const userId = requireAuth(req);
      const user = await storage.getUser(userId);
      
      if (!user || user.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { filePath, code } = req.body;
      if (!filePath) {
        return res.status(400).json({ error: "File path is required" });
      }

      const suggestions = await devAssistant.suggestTests(filePath, code);
      res.json(suggestions);
    } catch (error) {
      console.error("Test suggestion error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Test suggestion failed" });
    }
  });

  // POST /api/dev/suggest-optimizations - Get performance optimization suggestions
  app.post("/api/dev/suggest-optimizations", async (req, res) => {
    try {
      const userId = requireAuth(req);
      const user = await storage.getUser(userId);
      
      if (!user || user.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { filePath, code } = req.body;
      if (!filePath) {
        return res.status(400).json({ error: "File path is required" });
      }

      const optimizations = await devAssistant.suggestOptimizations(filePath, code);
      res.json(optimizations);
    } catch (error) {
      console.error("Optimization suggestion error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Optimization suggestion failed" });
    }
  });

  // POST /api/dev/debug-error - Analyze and debug errors
  app.post("/api/dev/debug-error", async (req, res) => {
    try {
      const userId = requireAuth(req);
      const user = await storage.getUser(userId);
      
      if (!user || user.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { errorMessage, stackTrace, context } = req.body;
      if (!errorMessage) {
        return res.status(400).json({ error: "Error message is required" });
      }

      const analysis = await devAssistant.debugError(errorMessage, stackTrace, context);
      res.json(analysis);
    } catch (error) {
      console.error("Debug analysis error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Debug analysis failed" });
    }
  });

  // POST /api/dev/review-architecture - Review overall codebase architecture
  app.post("/api/dev/review-architecture", async (req, res) => {
    try {
      const userId = requireAuth(req);
      const user = await storage.getUser(userId);
      
      if (!user || user.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const review = await devAssistant.reviewArchitecture();
      res.json(review);
    } catch (error) {
      console.error("Architecture review error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Architecture review failed" });
    }
  });

  // POST /api/dev/suggest-refactoring - Get refactoring suggestions
  app.post("/api/dev/suggest-refactoring", async (req, res) => {
    try {
      const userId = requireAuth(req);
      const user = await storage.getUser(userId);
      
      if (!user || user.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { filePath, code } = req.body;
      if (!filePath) {
        return res.status(400).json({ error: "File path is required" });
      }

      const suggestions = await devAssistant.suggestRefactoring(filePath, code);
      res.json(suggestions);
    } catch (error) {
      console.error("Refactoring suggestion error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Refactoring suggestion failed" });
    }
  });

  // Custom Avatar Admin routes
  app.get("/api/admin/avatars", async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const avatars = await storage.getAllCustomAvatars();
      res.json(avatars);
    } catch (error) {
      console.error("Error fetching custom avatars:", error);
      res.status(500).json({ error: "Failed to fetch avatars" });
    }
  });

  app.post("/api/admin/avatars", async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const avatarData = insertCustomAvatarSchema.parse(req.body);
      const objectStorageService = new ObjectStorageService();
      
      // Normalize the image URL from upload URL to storage path
      const normalizedImageUrl = objectStorageService.normalizeAvatarPath(avatarData.imageUrl);
      
      const avatar = await storage.createCustomAvatar({
        ...avatarData,
        imageUrl: normalizedImageUrl,
        createdBy: userId,
      });

      res.status(201).json(avatar);
    } catch (error: any) {
      console.error("Error creating custom avatar:", error);
      res.status(500).json({ error: error.message || "Failed to create avatar" });
    }
  });

  app.put("/api/admin/avatars/:id", async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const avatarId = parseInt(req.params.id);
      if (!avatarId || isNaN(avatarId)) {
        return res.status(400).json({ error: "Invalid avatar ID" });
      }

      const updateData = req.body;
      
      // If imageUrl is being updated, normalize it
      if (updateData.imageUrl) {
        const objectStorageService = new ObjectStorageService();
        updateData.imageUrl = objectStorageService.normalizeAvatarPath(updateData.imageUrl);
      }

      const updatedAvatar = await storage.updateCustomAvatar(avatarId, updateData);
      res.json(updatedAvatar);
    } catch (error: any) {
      console.error("Error updating custom avatar:", error);
      res.status(500).json({ error: error.message || "Failed to update avatar" });
    }
  });

  app.put("/api/admin/avatars/:id/toggle", async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const avatarId = parseInt(req.params.id);
      if (!avatarId || isNaN(avatarId)) {
        return res.status(400).json({ error: "Invalid avatar ID" });
      }

      const { isActive } = req.body;
      const updatedAvatar = await storage.updateCustomAvatar(avatarId, { isActive });
      res.json(updatedAvatar);
    } catch (error: any) {
      console.error("Error toggling avatar status:", error);
      res.status(500).json({ error: error.message || "Failed to toggle avatar status" });
    }
  });

  app.delete("/api/admin/avatars/:id", async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const avatarId = parseInt(req.params.id);
      if (!avatarId || isNaN(avatarId)) {
        return res.status(400).json({ error: "Invalid avatar ID" });
      }

      await storage.deleteCustomAvatar(avatarId);
      res.json({ success: true, message: "Avatar deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting custom avatar:", error);
      res.status(500).json({ error: error.message || "Failed to delete avatar" });
    }
  });

  app.post("/api/admin/avatars/upload-url", async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.currentTitle !== "<G.M.>") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getAvatarUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting avatar upload URL:", error);
      res.status(500).json({ error: error.message || "Failed to get upload URL" });
    }
  });

  // Avatar serving route for users
  app.get("/avatars/:avatarPath(*)", async (req, res) => {
    try {
      const avatarPath = `/avatars/${req.params.avatarPath}`;
      const objectStorageService = new ObjectStorageService();
      
      const avatarFile = await objectStorageService.getAvatarFile(avatarPath);
      await objectStorageService.downloadObject(avatarFile, res);
    } catch (error) {
      console.error("Error serving avatar:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Avatar not found" });
      }
      return res.status(500).json({ error: "Failed to serve avatar" });
    }
  });

  // Public asset serving route
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    try {
      const filePath = req.params.filePath;
      const objectStorageService = new ObjectStorageService();
      
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Training Program Builder Routes
  
  // Get all training programs
  app.get("/api/training-programs", async (req, res) => {
    try {
      const programs = await storage.getAllTrainingPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching training programs:", error);
      res.status(500).json({ error: "Failed to fetch training programs" });
    }
  });

  // Get single training program
  app.get("/api/training-programs/:id", async (req, res) => {
    try {
      const program = await storage.getTrainingProgram(req.params.id);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      res.json(program);
    } catch (error) {
      console.error("Error fetching training program:", error);
      res.status(500).json({ error: "Failed to fetch training program" });
    }
  });

  // Create new training program
  app.post("/api/training-programs", async (req, res) => {
    try {
      const userId = requireAuth(req);
      
      const programData = {
        ...req.body,
        id: `prog_${Date.now()}`,
        createdBy: userId
      };
      
      const program = await storage.createTrainingProgram(programData);
      res.json(program);
    } catch (error) {
      console.error("Error creating training program:", error);
      res.status(500).json({ error: "Failed to create training program" });
    }
  });

  // Update training program
  app.put("/api/training-programs/:id", async (req, res) => {
    try {
      const userId = requireAuth(req);
      
      const program = await storage.updateTrainingProgram(req.params.id, req.body);
      res.json(program);
    } catch (error) {
      console.error("Error updating training program:", error);
      res.status(500).json({ error: "Failed to update training program" });
    }
  });

  // Delete training program
  app.delete("/api/training-programs/:id", async (req, res) => {
    try {
      const userId = requireAuth(req);
      
      await storage.deleteTrainingProgram(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting training program:", error);
      res.status(500).json({ error: "Failed to delete training program" });
    }
  });

  // Publish training program
  app.post("/api/training-programs/:id/publish", async (req, res) => {
    try {
      const userId = requireAuth(req);
      
      const program = await storage.publishTrainingProgram(req.params.id);
      res.json(program);
    } catch (error) {
      console.error("Error publishing training program:", error);
      res.status(500).json({ error: "Failed to publish training program" });
    }
  });

  // Archive training program
  app.post("/api/training-programs/:id/archive", async (req, res) => {
    try {
      const userId = requireAuth(req);
      
      const program = await storage.archiveTrainingProgram(req.params.id);
      res.json(program);
    } catch (error) {
      console.error("Error archiving training program:", error);
      res.status(500).json({ error: "Failed to archive training program" });
    }
  });

  // Duplicate training program
  app.post("/api/training-programs/:id/duplicate", async (req, res) => {
    try {
      const userId = requireAuth(req);
      const { name } = req.body;
      
      const program = await storage.duplicateTrainingProgram(req.params.id, name);
      res.json(program);
    } catch (error) {
      console.error("Error duplicating training program:", error);
      res.status(500).json({ error: "Failed to duplicate training program" });
    }
  });

  // Program Completion Routes
  
  // Get user's program completion
  app.get("/api/program-completions/:programId", async (req, res) => {
    try {
      const userId = requireAuth(req);
      
      const completion = await storage.getUserProgramCompletion(userId, req.params.programId);
      res.json(completion || null);
    } catch (error) {
      console.error("Error fetching program completion:", error);
      res.status(500).json({ error: "Failed to fetch program completion" });
    }
  });

  // Start a program
  app.post("/api/program-completions/:programId/start", async (req, res) => {
    try {
      const userId = requireAuth(req);
      
      const completion = await storage.startProgram(userId, req.params.programId);
      res.json(completion);
    } catch (error) {
      console.error("Error starting program:", error);
      res.status(500).json({ error: "Failed to start program" });
    }
  });

  // Update program progress
  app.post("/api/program-completions/:programId/progress", async (req, res) => {
    try {
      const userId = requireAuth(req);
      const { weekIndex, dayIndex, status, workoutMetricsId } = req.body;
      
      const completion = await storage.updateProgramProgress(
        userId,
        req.params.programId,
        weekIndex,
        dayIndex,
        status,
        workoutMetricsId
      );
      res.json(completion);
    } catch (error) {
      console.error("Error updating program progress:", error);
      res.status(500).json({ error: "Failed to update program progress" });
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
  // Exponential formula with stat squish: level^1.8 * 16 (reduced from 82)
  // This creates a curve where early levels are fast, later levels take much longer
  // Same progression timeline with 80% smaller numbers
  return Math.floor(Math.pow(level - 1, 1.8) * 16);
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

export { calculateLevel };
