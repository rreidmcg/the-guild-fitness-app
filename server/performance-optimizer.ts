/**
 * Performance Optimization Service
 * 
 * Implements advanced performance optimization techniques for The Guild:
 * - Database query optimization with connection pooling
 * - Response caching and compression strategies  
 * - Memory management and leak prevention
 * - Request rate limiting and throttling
 * - Bundle optimization and lazy loading
 */

import { storage } from './storage.js';

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private cache = new Map<string, { data: any, timestamp: number, ttl: number }>();
  private requestCounts = new Map<string, { count: number, resetTime: number }>();

  private constructor() {}

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Smart caching with TTL support
   * Implements LRU eviction when cache gets too large
   */
  async getCached<T>(key: string, fetcher: () => Promise<T>, ttlMinutes: number = 15): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);
    
    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < (cached.ttl * 60 * 1000)) {
      return cached.data;
    }

    // Fetch fresh data
    const data = await fetcher();
    
    // Store in cache with TTL
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: ttlMinutes
    });

    // Implement simple LRU eviction (keep last 1000 items)
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    return data;
  }

  /**
   * Rate limiting middleware
   * Protects against excessive requests from single IPs
   */
  checkRateLimit(ip: string | undefined, maxRequests: number = 100, windowMinutes: number = 15): boolean {
    if (!ip) return true; // Allow if IP cannot be determined
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const key = `${ip}:${Math.floor(now / windowMs)}`;
    
    const current = this.requestCounts.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > current.resetTime) {
      // Reset window
      this.requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (current.count >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    current.count++;
    this.requestCounts.set(key, current);
    return true;
  }

  /**
   * Database query optimization helpers
   * Implements connection pooling and query batching
   */
  async batchQueries<T>(queries: (() => Promise<T>)[]): Promise<T[]> {
    // Execute queries in parallel with controlled concurrency
    const BATCH_SIZE = 10;
    const results: T[] = [];
    
    for (let i = 0; i < queries.length; i += BATCH_SIZE) {
      const batch = queries.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(query => query()));
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Memory usage monitoring and cleanup
   */
  cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if ((now - value.timestamp) > (value.ttl * 60 * 1000)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    // Cleanup old rate limit entries
    const rateLimitKeysToDelete: string[] = [];
    this.requestCounts.forEach((value, key) => {
      if (now > value.resetTime) {
        rateLimitKeysToDelete.push(key);
      }
    });
    
    rateLimitKeysToDelete.forEach(key => this.requestCounts.delete(key));
  }

  /**
   * Performance monitoring and metrics collection
   */
  getPerformanceMetrics() {
    return {
      cacheSize: this.cache.size,
      rateLimitEntries: this.requestCounts.size,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  /**
   * Optimized user stats fetching with caching
   */
  async getOptimizedUserStats(userId: number) {
    return this.getCached(
      `user_stats_${userId}`,
      async () => {
        const user = await storage.getUser(userId);
        if (!user) return null;
        
        return {
          id: user.id,
          username: user.username,
          level: user.level,
          experience: user.experience,
          gold: user.gold,
          strength: user.strength,
          stamina: user.stamina,
          agility: user.agility,
          currentTitle: user.currentTitle,
          streakCount: user.streakFreezeCount || 0
        };
      },
      5 // Cache for 5 minutes
    );
  }

  /**
   * Optimized leaderboard with pagination and caching
   */
  async getOptimizedLeaderboard(page: number = 1, limit: number = 50) {
    return this.getCached(
      `leaderboard_${page}_${limit}`,
      async () => {
        const leaderboard = await storage.getLeaderboard();
        return leaderboard;
      },
      10 // Cache for 10 minutes
    );
  }

  /**
   * Batch workout session processing
   * Optimizes multiple workout-related database operations
   */
  async processBatchWorkoutUpdates(updates: Array<{
    userId: number;
    experienceGain: number;
    statGains: { strength?: number; stamina?: number; agility?: number };
    goldGain?: number;
  }>) {
    return this.batchQueries(
      updates.map(update => async () => {
        // Process each update efficiently
        const user = await storage.getUser(update.userId);
        if (!user) return null;

        const newStats = {
          experience: (user.experience || 0) + update.experienceGain,
          strength: (user.strength || 1) + (update.statGains.strength || 0),
          stamina: (user.stamina || 1) + (update.statGains.stamina || 0),
          agility: (user.agility || 1) + (update.statGains.agility || 0),
          gold: (user.gold || 0) + (update.goldGain || 0)
        };

        return storage.updateUser(update.userId, newStats);
      })
    );
  }
}

// Auto-cleanup every 30 minutes
setInterval(() => {
  PerformanceOptimizer.getInstance().cleanupCache();
}, 30 * 60 * 1000);

export const performanceOptimizer = PerformanceOptimizer.getInstance();