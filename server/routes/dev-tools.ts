import { Request, Response, Router } from 'express';
import { storage } from '../storage.js';
// Import auth utilities - TODO: Extract to shared module
const requireAuth = (req: any): number => {
  const userId = req.session?.passport?.user;
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
};
import { devAssistant } from '../dev-assistant.js';

const router = Router();

// Dev tools middleware - only allow G.M. users
const requireDevAccess = async (req: Request, res: Response, next: any) => {
  try {
    const userId = requireAuth(req);
    const user = await storage.getUser(userId);
    
    // Only allow admin users (G.M. title)
    if (!user || user.currentTitle !== "<G.M.>") {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Dev access authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// Code review endpoint
router.post("/review-code", requireDevAccess, async (req, res) => {
  try {
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

// Test suggestions endpoint
router.post("/suggest-tests", requireDevAccess, async (req, res) => {
  try {
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

// Performance optimization suggestions
router.post("/suggest-optimizations", requireDevAccess, async (req, res) => {
  try {
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

// Error debugging
router.post("/debug-error", requireDevAccess, async (req, res) => {
  try {
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

// Architecture review
router.post("/review-architecture", requireDevAccess, async (req, res) => {
  try {
    const review = await devAssistant.reviewArchitecture();
    res.json(review);
  } catch (error) {
    console.error("Architecture review error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Architecture review failed" });
  }
});

// Refactoring suggestions
router.post("/suggest-refactoring", requireDevAccess, async (req, res) => {
  try {
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

export { router as devToolsRoutes };