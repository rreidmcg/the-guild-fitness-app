import { Request, Response, Router } from 'express';
import { storage } from '../storage.js';
// Import getCurrentUserId function from routes.ts for now
// TODO: Extract auth utilities to a shared module
const getCurrentUserId = (req: any) => req.session?.passport?.user;

const router = Router();

// Admin middleware for G.M. users only
const requireAdmin = async (req: Request, res: Response, next: any) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.currentTitle !== '<G.M.>') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Exercise management
router.get("/exercises", requireAdmin, async (req, res) => {
  try {
    const exercises = await storage.getAllExercises();
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exercises" });
  }
});

router.post("/exercises", requireAdmin, async (req, res) => {
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

// Monster management
router.get("/monsters", requireAdmin, async (req, res) => {
  try {
    const monsters = await storage.getAllMonsters();
    res.json(monsters);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch monsters" });
  }
});

router.post("/monsters", requireAdmin, async (req, res) => {
  try {
    const { name, level, tier, health, attack, goldReward } = req.body;
    
    if (!name || !level || !tier || !health || !attack || !goldReward) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const monster = await storage.createMonster({
      name,
      level,
      tier,
      maxHp: health,
      attack,
      goldReward
    });

    res.json(monster);
  } catch (error) {
    console.error("Error creating monster:", error);
    res.status(500).json({ error: "Failed to create monster" });
  }
});

// User management
router.post("/ban-user", requireAdmin, async (req, res) => {
  try {
    const { userId, reason, duration } = req.body;
    const adminUserId = getCurrentUserId(req);
    if (!adminUserId) {
      return res.status(401).json({ error: "Authentication required" });
    }
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

router.post("/unban-user", requireAdmin, async (req, res) => {
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

router.post("/remove-user", requireAdmin, async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const adminUserId = getCurrentUserId(req);
    if (!adminUserId) {
      return res.status(401).json({ error: "Authentication required" });
    }
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

// App request management
router.get("/app-requests", requireAdmin, async (req, res) => {
  try {
    const allRequests = await storage.getAllAppRequests();
    res.json(allRequests);
  } catch (error) {
    console.error("Error fetching all app requests:", error);
    res.status(500).json({ error: "Failed to fetch app requests" });
  }
});

router.patch("/app-requests/:id", requireAdmin, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { status, adminNotes } = req.body;
    const adminUserId = getCurrentUserId(req);
    
    if (!requestId || isNaN(requestId)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const updatedRequest = await storage.updateAppRequestStatus(requestId, status, adminNotes, adminUserId || undefined);
    res.json(updatedRequest);
  } catch (error) {
    console.error("Error updating app request:", error);
    res.status(500).json({ error: "Failed to update request" });
  }
});

// Level recalculation utility
router.post("/recalculate-level/:userId", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: "Valid user ID required" });
    }

    // Import calculate level function (we'll need to ensure this is available)
    // For now, we'll keep a simplified version
    const calculateLevel = (experience: number): number => {
      if (experience <= 0) return 1;
      return Math.floor(Math.sqrt(experience / 50)) + 1;
    };

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

// Avatar management
router.get("/avatars", requireAdmin, async (req, res) => {
  try {
    // This would be implemented when we have avatar storage
    res.json({ message: "Avatar admin functionality not yet implemented" });
  } catch (error) {
    console.error("Avatar admin error:", error);
    res.status(500).json({ error: "Failed to fetch avatars" });
  }
});

export { router as adminRoutes };