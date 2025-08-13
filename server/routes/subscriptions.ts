import { Request, Response, Router } from 'express';
import { storage } from '../storage.js';
// Import getCurrentUserId function - TODO: Extract to shared module  
const getCurrentUserId = (req: any) => req.session?.passport?.user;
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

// Create subscription
router.post("/create", async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user already has an active subscription
    if (user.subscriptionStatus === 'active') {
      return res.status(400).json({ error: 'User already has an active subscription' });
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
router.get("/status", async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
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

export { router as subscriptionRoutes };