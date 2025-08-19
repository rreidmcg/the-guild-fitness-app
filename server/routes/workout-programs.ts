import type { Express } from "express";
import { storage } from "../storage";
import { insertProgramWorkoutSchema } from "@shared/schema";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

/**
 * Workout program management and purchase routes
 */
export function registerWorkoutProgramRoutes(app: Express) {
  // Helper function to get current user ID from session
  function getCurrentUserId(req: any): number | null {
    return req.session?.userId || null;
  }

  // Helper function to generate URL-safe slug from name
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  // Get all workout programs
  app.get("/api/workout-programs", async (req, res) => {
    try {
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
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
        difficultyLevel: 'intermediate', // Training programs don't have difficulty property
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
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
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
      const isPurchased = isTrainingProgram || purchasedPrograms.includes(programId.toString()) || (program.price || 0) === 0;
      
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

  // Get program workouts/schedule
  app.get("/api/workout-programs/:id/workouts", async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
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

      // Check if user has access to this program
      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const hasAccess = purchasedPrograms.includes(programId.toString()) || (program.price || 0) === 0;
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
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
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
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
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
      // Retrieve the payment intent from Stripe to verify it was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        const programId = paymentIntent.metadata.programId;
        
        // Add program to user's purchased programs
        await storage.purchaseWorkoutProgram(userId, programId);
        
        res.json({ success: true, programId });
      } else {
        res.status(400).json({ error: "Payment not completed" });
      }
    } catch (error: any) {
      console.error("Error confirming program purchase:", error);
      res.status(500).json({ error: "Failed to confirm purchase" });
    }
  });
}