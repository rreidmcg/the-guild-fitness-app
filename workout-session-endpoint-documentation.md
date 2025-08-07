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

## Frontend Integration & User Journey

### Workout Session Execution Flow

#### 1. Starting a Workout Session
**File:** `client/src/pages/workout-session.tsx`

When a user begins a workout, the frontend:

```typescript
// Initialize workout session state
const [isActive, setIsActive] = useState(false);
const [time, setTime] = useState(0);
const [startTime, setStartTime] = useState<Date | null>(null);
const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
const [exerciseData, setExerciseData] = useState<any[]>([]);
const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});

// Load workout data and convert template to session format
useEffect(() => {
  if (workout && workout.exercises && exercises) {
    const workoutExercises = workout.exercises.map((workoutEx: any) => {
      // Convert sets from number to array for session tracking
      const setsArray = Array.from({ length: workoutEx.sets || 0 }, (_, index) => ({
        id: index,
        reps: workoutEx.reps || 0,
        weight: workoutEx.weight || 0,
        duration: workoutEx.duration || undefined,
        completed: false
      }));
      
      return {
        ...workoutEx,
        sets: setsArray // Replace the number with an array
      };
    });
    setExerciseData(workoutExercises);
  }
}, [workout, exercises]);
```

#### 2. Workout Completion & Session Creation
**File:** `client/src/pages/workout-session.tsx` (lines 174-196)

When the user completes a workout, the frontend sends data to create a session:

```typescript
const completeWorkoutMutation = useMutation({
  mutationFn: async (sessionData: any) => {
    return await apiRequest("/api/workout-sessions", {
      method: "POST",
      body: sessionData,
    });
  },
  onSuccess: (result) => {
    queryClient.invalidateQueries({ queryKey: ["/api/workout-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
    
    // Show victory modal with the session data including new achievements
    setCompletedSession(result);
    setShowVictoryModal(true);
  },
  onError: () => {
    toast({
      title: "Error",
      description: "Failed to complete workout",
      variant: "destructive",
    });
  },
});
```

#### 3. Victory Modal Display
**File:** `client/src/components/ui/workout-victory-modal.tsx`

After successful session creation, the victory modal displays:

```typescript
interface WorkoutVictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutName: string;
  xpGained: number;
  statsGained: {
    strength?: number;
    stamina?: number;
    agility?: number;
  };
  duration: number;
  totalVolume?: number;
  validation?: {
    multiplier: number;
    suspicious: string[];
    confidence: "high" | "medium" | "low";
  };
  newAchievements?: any[];
  streakBonus?: {
    isActive: boolean;
    streakDays: number;
    multiplier: number;
  };
}
```

The modal shows:
- **Victory Header**: "WORKOUT COMPLETE!" with trophy animation
- **XP Gained**: Large display of experience points earned with streak bonuses
- **Stats Progression**: Individual stat XP gains (Strength, Stamina, Agility)
- **Session Metrics**: Duration, volume, and other performance data
- **New Achievements**: Any achievements unlocked during the session
- **Continue Button**: Closes modal and returns to workout overview

### Workout Overview Integration

#### Session History Display
**File:** `client/src/pages/workouts.tsx` (lines 597-628)

The workout overview displays recent sessions with clickable cards:

```typescript
recentSessions.map((session: WorkoutSession) => (
  <Card 
    key={session.id} 
    className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20 hover:border-blue-400/40 transition-colors cursor-pointer"
    onClick={() => navigate(`/workout-session-results/${session.id}`)}
  >
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground mb-1">
            {session.workoutName || "Custom Workout"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {new Date(session.completedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-foreground">
            {session.duration ? `${session.duration} min` : ''}
          </div>
          <div className="text-xs text-muted-foreground">
            {session.totalVolume ? `${session.totalVolume.toLocaleString()} lbs` : ''}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
))
```

#### Weekly Statistics Aggregation
The overview also displays aggregated statistics from recent sessions:

```typescript
// Total Sessions This Week
{recentSessions.length}

// Total Time This Week
{recentSessions.reduce((total: number, session: WorkoutSession) => 
  total + (session.duration || 0), 0)} minutes

// Total Volume This Week  
{recentSessions.reduce((total: number, session: WorkoutSession) => 
  total + (session.totalVolume || 0), 0).toLocaleString()} lbs
```

### Detailed Session Results Page

#### Session Data Retrieval
**File:** `client/src/pages/workout-session-results.tsx` (lines 27-29)

When a user clicks on a session in the overview, they navigate to the detailed results:

```typescript
const { data: session, isLoading } = useQuery<WorkoutSession & { exercises: any[] }>({
  queryKey: ["/api/workout-sessions", sessionId],
});
```

This calls the `GET /api/workout-sessions/:sessionId` endpoint we documented above.

#### Session Results Display
The results page shows:

1. **Session Header**: Workout name and completion timestamp
2. **Metrics Cards**: Duration, volume, XP earned, completion percentage
3. **Exercise Breakdown**: Detailed view of each exercise performed
4. **Set-by-Set Analysis**: Individual set data with weights, reps, RPE
5. **Performance Insights**: Completion rates, volume analysis, effort tracking

### Complete User Flow

```
1. User starts workout session
   └── workout-session.tsx initializes session state
   
2. User performs exercises  
   └── Frontend tracks sets, reps, weights, completion
   
3. User completes workout
   └── completeWorkoutMutation calls POST /api/workout-sessions
   
4. Server processes session
   └── Calculates XP, updates stats, applies bonuses
   └── Returns session data with rewards
   
5. Victory modal displays
   └── Shows XP gained, stat progression, achievements
   
6. User returns to workout overview  
   └── workouts.tsx displays session in history
   └── Session card shows summary (duration, volume, date)
   
7. User clicks on session card
   └── Navigates to /workout-session-results/:id
   └── Calls GET /api/workout-sessions/:sessionId
   
8. Detailed results display
   └── workout-session-results.tsx shows full session analysis
   └── Exercise-by-exercise breakdown with metrics
```

### Data Flow Between Components

```
POST /api/workout-sessions (Session Creation)
├── Input: Exercise data, sets, reps, weights, duration
├── Processing: XP calculation, stat updates, streak bonuses
└── Output: Session object with rewards and validation

GET /api/workout-sessions/:sessionId (Session Retrieval)  
├── Input: Session ID, authenticated user
├── Processing: Database query with user authorization
└── Output: Complete session data with exercises

Frontend State Management:
├── workout-session.tsx: Active session tracking
├── workout-victory-modal.tsx: Completion celebration
├── workouts.tsx: Session history overview
└── workout-session-results.tsx: Detailed session analysis
```

### Query Key Management

The application uses TanStack Query with consistent cache management:

```typescript
// Session creation invalidates these queries
queryClient.invalidateQueries({ queryKey: ["/api/workout-sessions"] });
queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });

// Session retrieval uses specific session ID
queryKey: ["/api/workout-sessions", sessionId]

// Overview page fetches all sessions  
queryKey: ["/api/workout-sessions"]
```

This ensures data consistency across all workout-related components and automatic updates when sessions are created or modified.

## Integration Points

The workout session endpoint integrates with:

1. **Streak System**: Updates user streaks after workout completion
2. **Atrophy System**: Records activity to prevent stat degradation
3. **Achievement System**: Checks for newly unlocked achievements
4. **Level Progression**: Updates both main level and individual stats
5. **Statistics Tracking**: Maintains personal records and performance metrics
6. **User Interface**: Powers workout overview, completion screens, and detailed results
7. **Cache Management**: Maintains data consistency across multiple components
8. **Navigation Flow**: Seamless transitions between workout execution and results viewing

---

*Generated on August 7, 2025*
*The Guild: Gamified Fitness Application*