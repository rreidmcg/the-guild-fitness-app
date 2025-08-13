import type { Express } from "express";
import { registerAuthRoutes } from "./auth";
import { registerAnalyticsRoutes } from "./analytics";
import { registerWorkoutProgramRoutes } from "./workout-programs";
import { registerProgramWorkoutRoutes } from "./program-workouts";
import { adminRoutes } from "./admin.js";
import { devToolsRoutes } from "./dev-tools.js";
import { subscriptionRoutes } from "./subscriptions.js";
import { performanceRoutes } from "./performance.js";

/**
 * Main router registration - imports and registers all route modules
 * This replaces the monolithic routes.ts file with a modular architecture
 */
export function registerAllRoutes(app: Express) {
  // Register route modules (function-based imports)
  registerAuthRoutes(app);
  registerAnalyticsRoutes(app);
  registerWorkoutProgramRoutes(app);
  registerProgramWorkoutRoutes(app);
  
  // Register router-based route modules
  app.use('/api/admin', adminRoutes);
  app.use('/api/dev', devToolsRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/performance', performanceRoutes);
  
  // TODO: Additional route modules to be created:
  // - registerWorkoutSessionRoutes(app);
  // - registerShopRoutes(app);
  // - registerBattleRoutes(app);
  // - registerUserManagementRoutes(app);
}