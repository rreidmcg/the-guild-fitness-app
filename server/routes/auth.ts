import type { Express } from "express";
import { storage } from "../storage";
import { authUtils } from "../auth";
import { validateUsername, sanitizeUsername } from "../username-validation";
import { sendEmail, generateLiabilityWaiverEmail, generateAdminWaiverNotification } from "../email-service";

/**
 * Authentication and user management routes
 */
export function registerAuthRoutes(app: Express) {
  // Helper function to get current user ID from session
  function getCurrentUserId(req: any): number | null {
    return req.session?.userId || null;
  }

  // Helper function to require authentication
  function requireAuth(req: any): number {
    const userId = getCurrentUserId(req);
    if (!userId) {
      throw new Error('Authentication required');
    }
    return userId;
  }

  // Demo system and magic link authentication routes will be moved here
  
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
  <h1>The Fit Guild - RPG Fitness Demo</h1>
  <div class="card">
    <h2>Welcome to the Demo!</h2>
    <p>This is a read-only demonstration of The Fit Guild's core features.</p>
  </div>
</body>
</html>`);
  });

  // Viewer JSON API endpoint
  app.get("/api/viewer.json", (req, res) => {
    res.json({
      title: "The Fit Guild",
      description: "RPG-style fitness tracking application",
      features: [
        "Character progression with RPG stats",
        "Workout tracking and XP system", 
        "Battle mechanics with monsters",
        "Dungeon progression system",
        "Equipment and achievement unlocks"
      ],
      demo: true
    });
  });

  // Additional auth routes will be added here...
}