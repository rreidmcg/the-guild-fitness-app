import { Suspense, lazy, ComponentType } from 'react';
import { LoadingState } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';

/**
 * Advanced Route Lazy Loader
 * 
 * Provides intelligent code splitting with:
 * - Optimized loading states with contextual tips
 * - Error boundaries for robust fallback handling
 * - Performance monitoring and preloading hints
 * - Mobile-optimized loading animations
 */

interface LazyLoadOptions {
  /** Loading tip to show while component loads */
  loadingTip?: string;
  /** Preload this component on hover/focus */
  enablePreload?: boolean;
  /** Critical route - higher priority loading */
  isCritical?: boolean;
}

/**
 * Creates a lazy-loaded component wrapper with advanced loading strategies
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): ComponentType {
  const LazyComponent = lazy(importFn);
  
  const WrappedComponent = (props: any) => {
    return (
      <ErrorBoundary 
        fallback={(error) => (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-red-400">Failed to load page</h3>
              <p className="text-gray-400">Please refresh the page to try again</p>
            </div>
          </div>
        )}
      >
        <Suspense 
          fallback={
            <LoadingState 
              message={options.loadingTip || "Loading page..."}
              className="min-h-screen" 
            />
          }
        >
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };

  // Add display name for debugging
  WrappedComponent.displayName = `LazyLoaded(Component)`;
  
  return WrappedComponent;
}

/**
 * Route group definitions for intelligent bundling
 * Groups related routes to optimize bundle splitting
 */
export const RouteGroups = {
  // Core user experience routes (high priority)
  CORE: ['stats', 'workouts', 'battle', 'shop', 'leaderboard'],
  
  // Workout management routes
  WORKOUT_MANAGEMENT: ['workout-builder', 'workout-overview', 'workout-session', 'workout-session-results'],
  
  // Program management routes  
  PROGRAM_MANAGEMENT: ['workout-programs', 'program-builder', 'program-overview', 'program-day', 'program-workout'],
  
  // Admin and development routes (low priority)
  ADMIN: ['admin', 'analytics', 'dev-tools', 'demo-admin'],
  
  // E-commerce and premium routes
  COMMERCE: ['checkout', 'payment-success', 'subscribe', 'gem-shop', 'premium'],
  
  // Social and community features
  SOCIAL: ['social', 'mail', 'achievements', 'profile'],
  
  // Authentication routes (critical)
  AUTH: ['login', 'signup', 'reset-password'],
  
  // Miscellaneous routes
  MISC: ['settings', 'inventory', 'wardrobe', 'ai-workouts', 'workout-recommendations']
} as const;

/**
 * Preload strategy for critical user paths
 * Intelligently preloads components based on user behavior patterns
 */
export class RoutePreloader {
  private static preloadedComponents = new Set<string>();
  
  /**
   * Preload a component on demand (e.g., on hover, user intent)
   */
  static async preloadRoute(importFn: () => Promise<any>, routeName: string) {
    if (this.preloadedComponents.has(routeName)) {
      return; // Already preloaded
    }
    
    try {
      await importFn();
      this.preloadedComponents.add(routeName);
      console.log(`Preloaded route: ${routeName}`);
    } catch (error) {
      console.warn(`Failed to preload route ${routeName}:`, error);
    }
  }
  
  /**
   * Preload critical user journey paths
   * Called after initial app load to warm up likely next routes
   */
  static preloadCriticalPaths() {
    // Common user journeys - preload after initial load
    setTimeout(() => {
      // Stats -> Workouts -> Battle (common flow)
      this.preloadRoute(() => import('@/pages/workouts'), 'workouts');
      this.preloadRoute(() => import('@/pages/battle'), 'battle');
      
      // Quick access routes
      this.preloadRoute(() => import('@/pages/shop'), 'shop');
      this.preloadRoute(() => import('@/pages/leaderboard'), 'leaderboard');
    }, 2000); // Delay to avoid impacting initial load
  }
}

/**
 * Performance monitoring for lazy loaded routes
 */
export class RoutePerformanceMonitor {
  private static loadTimes = new Map<string, number>();
  
  static recordLoadTime(routeName: string, loadTime: number) {
    this.loadTimes.set(routeName, loadTime);
    
    // Log slow loading routes
    if (loadTime > 1000) {
      console.warn(`Slow route load detected: ${routeName} took ${loadTime}ms`);
    }
  }
  
  static getAverageLoadTime(): number {
    const times: number[] = [];
    this.loadTimes.forEach(time => times.push(time));
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
  
  static getPerformanceReport() {
    return {
      routeCount: this.loadTimes.size,
      averageLoadTime: this.getAverageLoadTime(),
      slowestRoute: this.getSlowestRoute(),
      loadTimes: Object.fromEntries(this.loadTimes)
    };
  }
  
  private static getSlowestRoute() {
    let slowest = { route: '', time: 0 };
    for (const [route, time] of this.loadTimes) {
      if (time > slowest.time) {
        slowest = { route, time };
      }
    }
    return slowest;
  }
}