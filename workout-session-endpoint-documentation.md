# Workout Session Endpoint Documentation

## Overview
This document provides the complete implementation details for the workout-session endpoint, specifically how `GET /api/workout-sessions/:sessionId` (e.g., workout-session/3) works in The Guild: Gamified Fitness application.

## Endpoint: GET /api/workout-sessions/:sessionId

### Route Handler Implementation
**File:** `server/routes.ts` (lines 1100-1121)

```typescript
// Get individual workout session with exercise details
app.get("/api/workout-sessions/:sessionId", async (req, res) => {
  try {
    const userId = getCurrentUserId(req); 
    if (!userId) { 
      return res.status(401).json({ error: "Authentication required" }); 
    }
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    const session = await storage.getWorkoutSessionById(sessionId, userId);
    
    if (!session) {
      return res.status(404).json({ error: "Workout session not found" });
    }
    
    res.json(session);
  } catch (error) {
    console.error("Error fetching workout session:", error);
    res.status(500).json({ error: "Failed to fetch workout session" });
  }
});
```

### Storage Implementation
**File:** `server/storage.ts` (lines 419-440)

```typescript
async getWorkoutSessionById(sessionId: number, userId: number): Promise<WorkoutSession | undefined> {
  await this.ensureInitialized();
  
  // Get the workout session
  const [session] = await db.select()
    .from(workoutSessions)
    .where(and(
      eq(workoutSessions.id, sessionId),
      eq(workoutSessions.userId, userId)
    ));
  
  if (!session) {
    return undefined;
  }

  // Get exercises data from the session
  // The exercises are stored in the session data when it's created
  const exercises = (session as any).exercises || [];

  return {
    ...session,
    exercises
  };
}
```

## How the Endpoint Works

### 1. Authentication & Authorization
- **Authentication Check**: Verifies user is logged in using `getCurrentUserId(req)`
- **Authorization**: Only returns sessions that belong to the authenticated user
- **Security**: Uses `and()` clause to ensure `userId` matches session owner

### 2. Parameter Validation
- Converts `sessionId` from string to integer using `parseInt()`
- Validates the conversion with `isNaN()` check
- Returns 400 error for invalid session IDs

### 3. Data Retrieval Process
- Queries `workoutSessions` table with compound WHERE clause
- Filters by both `sessionId` AND `userId` for security
- Extracts exercises data from session JSON field
- Returns complete session object with exercises included

### 4. Error Handling
- **401**: Authentication required (user not logged in)
- **400**: Invalid session ID (not a valid number)
- **404**: Workout session not found (doesn't exist or doesn't belong to user)
- **500**: Server error during database operation

## Response Structure

When calling `/api/workout-sessions/3`, the endpoint returns a JSON object with:

```typescript
{
  id: number;                    // Session ID (3 in this case)
  userId: number;                // User who performed the workout
  workoutId: number | null;      // Original workout template ID (if any)
  name: string;                  // Session name
  duration: number;              // Workout duration in minutes
  totalVolume: number;           // Total weight × reps volume
  xpEarned: number;              // Experience points earned
  statsEarned: {                 // Stat XP breakdown
    strength: number;
    stamina: number;
    agility: number;
  };
  exercises: Array<{             // Detailed exercise data
    exerciseId: number;
    sets: Array<{
      completed: boolean;
      weight: number;
      reps: number;
      rir?: number;              // Reps in Reserve
      rpe?: number;              // Rate of Perceived Exertion
      time?: number;             // For time-based exercises
    }>;
    section: string;             // "Warm Up", "Main Workout", "Cool Down"
    order: number;               // Exercise order within section
  }>;
  completedAt: string;           // ISO timestamp when workout was completed
}
```

## Related Endpoints

### POST /api/workout-sessions
Creates a new workout session with the following process:

**File:** `server/routes.ts` (lines 1123-1252)

#### Key Features:
1. **XP Calculation**: Based on completed sets percentage (50 XP for 100% completion)
2. **Volume Tracking**: Calculates total volume (weight × reps) for completed sets only
3. **Stat Progression**: Updates user's strength, stamina, and agility XP
4. **Streak Bonuses**: Applies streak multipliers to all XP gains
5. **Level Recalculation**: Updates both main level and individual stat levels
6. **Activity Recording**: Prevents atrophy by updating `lastActivityDate`
7. **Achievement Checking**: Unlocks new achievements after workout completion

#### XP and Stat Calculation Logic:
```typescript
// Base XP calculation (50 XP for full completion)
const baseXP = Math.floor(50 * completionPercentage);

// Apply streak bonus to main XP
const mainXpBonus = applyStreakBonus(sessionData.xpEarned, user.currentStreak ?? 0);

// Calculate stat XP gains based on workout type
const baseStatXpGains = calculateStatXpGains(sessionData);

// Apply streak bonus to each stat XP
const strengthXpBonus = applyStreakBonus(baseStatXpGains.strengthXp, user.currentStreak ?? 0);
const staminaXpBonus = applyStreakBonus(baseStatXpGains.staminaXp, user.currentStreak ?? 0);
const agilityXpBonus = applyStreakBonus(baseStatXpGains.agilityXp, user.currentStreak ?? 0);

// Recalculate actual stat levels from XP
const newStrength = calculateStatLevel(newStrengthXp);
const newStamina = calculateStatLevel(newStaminaXp);
const newAgility = calculateStatLevel(newAgilityXp);
```

### GET /api/workout-sessions
Returns all workout sessions for the authenticated user.

**File:** `server/routes.ts` (lines 1090-1098)

```typescript
app.get("/api/workout-sessions", async (req, res) => {
  try {
    const userId = getCurrentUserId(req); 
    if (!userId) { 
      return res.status(401).json({ error: "Authentication required" }); 
    }
    const sessions = await storage.getUserWorkoutSessions(userId);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch workout sessions" });
  }
});
```

## Database Schema

The workout sessions are stored in the `workoutSessions` table with the following structure:

```sql
CREATE TABLE workout_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  workout_id INTEGER REFERENCES workouts(id),
  name VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL,
  total_volume DECIMAL(10,2),
  xp_earned INTEGER NOT NULL,
  stats_earned JSONB,
  exercises JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security Considerations

1. **User Isolation**: All queries include `userId` filter to prevent data leakage
2. **Authentication Required**: All endpoints require valid session
3. **Parameter Validation**: Session IDs are validated before database queries
4. **Error Handling**: Generic error messages prevent information disclosure

## Performance Notes

- Uses indexed queries on `id` and `user_id` columns
- Exercises stored as JSONB for efficient retrieval
- Single query retrieves complete session data
- No N+1 query problems with current implementation

## Integration Points

The workout session endpoint integrates with:

1. **Streak System**: Updates user streaks after workout completion
2. **Atrophy System**: Records activity to prevent stat degradation
3. **Achievement System**: Checks for newly unlocked achievements
4. **Level Progression**: Updates both main level and individual stats
5. **Statistics Tracking**: Maintains personal records and performance metrics

---

*Generated on August 7, 2025*
*The Guild: Gamified Fitness Application*