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
import { applyStreakBonus } from "./streak-bonus";
import { workoutValidator } from "./workout-validation";
import { aiWorkoutEngine } from "./ai-workout-engine";
import { sendEmail, generateLiabilityWaiverEmail, generateAdminWaiverNotification } from "./email-service";
import Stripe from "stripe";

// Simple in-memory session storage (in production, use proper session management)
let currentUserId: number | null = null;

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Workout recommendations route (premium feature) - DISABLED to save API costs
  /*
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
      const userId = currentUserId;
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
      const userId = currentUserId;
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
      const userId = currentUserId;
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
      const userId = currentUserId;
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
      const userId = currentUserId;
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
      const userId = currentUserId;
      const programs = await storage.getAllWorkoutPrograms();
      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      
      // Add purchase status to each program (free programs are always considered "purchased")
      const programsWithStatus = programs.map(program => ({
        ...program,
        isPurchased: purchasedPrograms.includes(program.id.toString()) || program.price === 0,
        priceFormatted: `$${(program.price / 100).toFixed(2)}`
      }));
      
      res.json(programsWithStatus);
    } catch (error) {
      console.error("Error fetching workout programs:", error);
      res.status(500).json({ error: "Failed to fetch workout programs" });
    }
  });

  app.get("/api/workout-programs/:id", async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const program = await storage.getWorkoutProgram(programId);
      
      if (!program) {
        return res.status(404).json({ error: "Workout program not found" });
      }
      
      const userId = currentUserId;
      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const isPurchased = purchasedPrograms.includes(programId.toString()) || program.price === 0;
      
      res.json({
        ...program,
        isPurchased,
        priceFormatted: `$${(program.price / 100).toFixed(2)}`
      });
    } catch (error) {
      console.error("Error fetching workout program:", error);
      res.status(500).json({ error: "Failed to fetch workout program" });
    }
  });

  app.get("/api/workout-programs/:id/workouts", async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const userId = currentUserId;
      
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
      const userId = currentUserId;
      
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
        amount: program.price, // Already in cents
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
      const userId = currentUserId;
      
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
      const userId = currentUserId;
      
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
      const userId = currentUserId;
      
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
      const userId = currentUserId;
      
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
      const userId = currentUserId;
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
      const userId = currentUserId;
      
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
      const userId = currentUserId;
      
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
      const userId = currentUserId;
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
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
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
      const userId = currentUserId;
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
      const userId = currentUserId;
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
      const userId = currentUserId;
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
      const userId = currentUserId;
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

  // Change password endpoint
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Check if user is authenticated
      if (!currentUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }
      
      // Get current user from database
      const user = await storage.getUser(currentUserId);
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
      await storage.updateUser(currentUserId, { password: hashedNewPassword });
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      // Clear current user session
      currentUserId = null; // Clear session
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

  // Update user profile (email, personal info)
  app.patch("/api/user/profile", async (req, res) => {
    try {
      const userId = currentUserId;
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
      const userId = currentUserId; // Use the current logged-in user
      
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

  app.post("/api/user-achievements/:achievementId/mark-viewed", async (req, res) => {
    try {
      const userId = currentUserId; // Use the current logged-in user
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
        health,
        attack,
        defense,
        goldReward,
        imageUrl: imageUrl || null
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
      const adminUserId = currentUserId;
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
      const adminUserId = currentUserId;
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

  // Liability waiver acceptance route
  app.post("/api/accept-liability-waiver", async (req, res) => {
    try {
      const userId = currentUserId;
      const { fullName, email, ipAddress, userAgent } = req.body;

      if (!fullName || !email) {
        return res.status(400).json({ error: "Full name and email are required" });
      }

      // Create liability waiver record
      await storage.createLiabilityWaiver({
        userId,
        fullName,
        email,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        waiverVersion: '1.0'
      });

      // Update user's liability waiver status
      await storage.updateUserLiabilityWaiverStatus(userId, true, ipAddress);

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

  // Add endpoint to recalculate user level with new XP formula
  app.post("/api/recalculate-level", async (req, res) => {
    try {
      const userId = currentUserId;
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
