import type { Express } from "express";
import { registerAuthRoutes } from "./auth";
import { registerAnalyticsRoutes } from "./analytics";
import { registerWorkoutProgramRoutes } from "./workout-programs";
import { registerProgramWorkoutRoutes } from "./program-workouts";

/**
 * Main router registration - imports and registers all route modules
 * This replaces the monolithic routes.ts file with a modular architecture
 */
export function registerAllRoutes(app: Express) {
  // Register route modules
  registerAuthRoutes(app);
  registerAnalyticsRoutes(app);
  registerWorkoutProgramRoutes(app);
  registerProgramWorkoutRoutes(app);
  
  // TODO: Additional route modules to be created:
  // - registerWorkoutSessionRoutes(app);
  // - registerShopRoutes(app);
  // - registerBattleRoutes(app);
  // - registerUserManagementRoutes(app);
  // - registerAdminRoutes(app);
}