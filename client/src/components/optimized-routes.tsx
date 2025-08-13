/**
 * Optimized Route Definitions
 * 
 * Implements intelligent code splitting and lazy loading for all routes
 * with performance monitoring and critical path optimization
 */

import { createLazyComponent, RoutePreloader } from './route-lazy-loader';
import type { ComponentType } from 'react';

// Core routes (highest priority - loaded first)
export const Stats = createLazyComponent(
  () => import('@/pages/stats'),
  { loadingTip: "Loading your character stats...", isCritical: true }
);

export const Workouts = createLazyComponent(
  () => import('@/pages/workouts'),
  { loadingTip: "Preparing your workout arsenal...", isCritical: true }
);

export const Battle = createLazyComponent(
  () => import('@/pages/battle'),
  { loadingTip: "Entering the battle arena...", isCritical: true }
);

export const Shop = createLazyComponent(
  () => import('@/pages/shop'),
  { loadingTip: "Opening the item shop...", isCritical: true }
);

export const Leaderboard = createLazyComponent(
  () => import('@/pages/leaderboard'),
  { loadingTip: "Loading the hall of fame...", isCritical: true }
);

// Authentication routes (critical for user onboarding)
export const LoginPage = createLazyComponent(
  () => import('@/pages/login'),
  { loadingTip: "Preparing login portal...", isCritical: true }
);

export const SignupPage = createLazyComponent(
  () => import('@/pages/signup'),
  { loadingTip: "Setting up character creation...", isCritical: true }
);

export const ResetPasswordPage = createLazyComponent(
  () => import('@/pages/reset-password'),
  { loadingTip: "Loading password recovery...", isCritical: true }
);

// Workout management routes
export const WorkoutBuilder = createLazyComponent(
  () => import('@/pages/workout-builder'),
  { loadingTip: "Loading workout creation tools..." }
);

export const WorkoutOverview = createLazyComponent(
  () => import('@/pages/workout-overview'),
  { loadingTip: "Preparing workout details..." }
);

export const WorkoutSession = createLazyComponent(
  () => import('@/pages/workout-session'),
  { loadingTip: "Starting workout session..." }
);

export const WorkoutSessionResults = createLazyComponent(
  () => import('@/pages/workout-session-results'),
  { loadingTip: "Calculating your gains..." }
);

export const WorkoutRecommendationsPage = createLazyComponent(
  () => import('@/pages/workout-recommendations'),
  { loadingTip: "Generating AI workout recommendations..." }
);

// Program management routes
export const WorkoutPrograms = createLazyComponent(
  () => import('@/pages/workout-programs'),
  { loadingTip: "Loading training programs..." }
);

export const ProgramBuilder = createLazyComponent(
  () => import('@/pages/ProgramBuilder'),
  { loadingTip: "Loading program builder..." }
);

export const ProgramOverview = createLazyComponent(
  () => import('@/pages/ProgramOverview'),
  { loadingTip: "Loading program details..." }
);

export const ProgramDay = createLazyComponent(
  () => import('@/pages/program-day'),
  { loadingTip: "Loading daily program..." }
);

export const ProgramWorkout = createLazyComponent(
  () => import('@/pages/program-workout'),
  { loadingTip: "Loading program workout..." }
);

export const ProgramWorkoutBuilder = createLazyComponent(
  () => import('@/pages/program-workout-builder'),
  { loadingTip: "Loading workout builder..." }
);

// Battle and adventure routes
export const PvEDungeons = createLazyComponent(
  () => import('@/pages/pve-dungeons'),
  { loadingTip: "Loading dungeon expeditions..." }
);

export const DungeonBattle = createLazyComponent(
  () => import('@/pages/dungeon-battle'),
  { loadingTip: "Entering dungeon battle..." }
);

// Character customization routes
export const Wardrobe = createLazyComponent(
  () => import('@/pages/wardrobe'),
  { loadingTip: "Opening your wardrobe..." }
);

export const Profile = createLazyComponent(
  () => import('@/pages/profile'),
  { loadingTip: "Loading character profile..." }
);

export const Inventory = createLazyComponent(
  () => import('@/pages/inventory'),
  { loadingTip: "Checking your inventory..." }
);

// E-commerce and premium routes
export const GemShop = createLazyComponent(
  () => import('@/pages/gem-shop'),
  { loadingTip: "Loading premium gem shop..." }
);

export const Checkout = createLazyComponent(
  () => import('@/pages/checkout'),
  { loadingTip: "Processing your purchase..." }
);

export const PaymentSuccess = createLazyComponent(
  () => import('@/pages/payment-success'),
  { loadingTip: "Confirming your payment..." }
);

export const Subscribe = createLazyComponent(
  () => import('@/pages/subscribe'),
  { loadingTip: "Loading subscription options..." }
);

export const Premium = createLazyComponent(
  () => import('@/pages/premium'),
  { loadingTip: "Loading premium features..." }
);

// Social and community routes
export const Social = createLazyComponent(
  () => import('@/pages/social'),
  { loadingTip: "Connecting to the guild..." }
);

export const MailPage = createLazyComponent(
  () => import('@/pages/mail'),
  { loadingTip: "Checking your messages..." }
);

export const Achievements = createLazyComponent(
  () => import('@/pages/achievements'),
  { loadingTip: "Loading your achievements..." }
);

// Settings and configuration
export const Settings = createLazyComponent(
  () => import('@/pages/settings'),
  { loadingTip: "Loading settings panel..." }
);

// AI and advanced features
export const AIWorkouts = createLazyComponent(
  () => import('@/pages/ai-workouts'),
  { loadingTip: "Initializing AI workout engine..." }
);

// Admin and development routes (lowest priority)
export const AdminPage = createLazyComponent(
  () => import('@/pages/admin'),
  { loadingTip: "Loading admin dashboard..." }
);

export const Analytics = createLazyComponent(
  () => import('@/pages/analytics'),
  { loadingTip: "Loading analytics dashboard..." }
);

export const DevToolsPage = createLazyComponent(
  () => import('@/pages/dev-tools'),
  { loadingTip: "Loading development tools..." }
);

export const DemoAdmin = createLazyComponent(
  () => import('@/pages/demo-admin'),
  { loadingTip: "Loading demo administration..." }
);

// Utility routes
export const NotFound = createLazyComponent(
  () => import('@/pages/not-found'),
  { loadingTip: "Loading page..." }
);

/**
 * Initialize route preloading strategies
 * Called after the app loads to warm up critical user paths
 */
export function initializeRouteOptimizations() {
  // Start preloading critical paths
  RoutePreloader.preloadCriticalPaths();
  
  // Monitor performance in development
  if (import.meta.env.DEV) {
    // Set up performance monitoring
    const originalLog = console.log;
    console.log = (...args) => {
      if (args[0]?.includes?.('Preloaded route:')) {
        originalLog('🚀 Route optimization:', ...args);
      } else {
        originalLog(...args);
      }
    };
  }
}