import { Request, Response, Router } from 'express';
import { performanceOptimizer } from '../performance-optimizer.js';

const router = Router();

// Middleware to check rate limits
const rateLimitMiddleware = (req: Request, res: Response, next: any) => {
  const clientIp = req.ip || (req.connection as any)?.remoteAddress || 'unknown';
  
  if (!performanceOptimizer.checkRateLimit(clientIp)) {
    return res.status(429).json({ 
      error: 'Too many requests. Please try again later.',
      retryAfter: 900 // 15 minutes in seconds
    });
  }
  
  next();
};

// Apply rate limiting to all routes in this router
router.use(rateLimitMiddleware);

// Performance metrics endpoint (admin only)
router.get('/metrics', async (req, res) => {
  try {
    // TODO: Add admin authentication check
    const metrics = performanceOptimizer.getPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Optimized user stats endpoint
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const stats = await performanceOptimizer.getOptimizedUserStats(userId);
    
    if (!stats) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching optimized user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Optimized leaderboard endpoint with pagination
router.get('/leaderboard', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per page
    
    const leaderboard = await performanceOptimizer.getOptimizedLeaderboard(page, limit);
    
    res.json({
      data: leaderboard,
      pagination: {
        page,
        limit,
        hasMore: leaderboard.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching optimized leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Batch workout processing endpoint
router.post('/batch-workout-updates', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Invalid updates array' });
    }

    // Limit batch size to prevent abuse
    if (updates.length > 50) {
      return res.status(400).json({ error: 'Batch size too large. Maximum 50 updates per request.' });
    }

    const results = await performanceOptimizer.processBatchWorkoutUpdates(updates);
    
    res.json({ 
      success: true, 
      processed: results.length,
      message: 'Batch workout updates processed successfully'
    });
  } catch (error) {
    console.error('Error processing batch workout updates:', error);
    res.status(500).json({ error: 'Failed to process batch updates' });
  }
});

// Cache management endpoints (admin only)
router.post('/cache/clear', async (req, res) => {
  try {
    // TODO: Add admin authentication check
    performanceOptimizer.cleanupCache();
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export { router as performanceRoutes };