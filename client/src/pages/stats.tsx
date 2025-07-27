import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { AtrophyWarning } from "@/components/ui/atrophy-warning";
import {
  Dumbbell,
  Heart,
  Zap,
  Star,
  Flame,
  Target,
  Trophy,
  TrendingUp
} from "lucide-react";
import { CompactAchievementCard } from "@/components/ui/compact-achievement-card";
import { CompactWorkoutCard } from "@/components/ui/compact-workout-card";

export default function Stats() {
  const [, setLocation] = useLocation();

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch workout sessions
  const { data: workoutSessions, isLoading: workoutSessionsLoading } = useQuery({
    queryKey: ["/api/workout-sessions"],
  });

  // Fetch achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/achievements"],
  });

  // Fetch user achievements
  const { data: userAchievements, isLoading: userAchievementsLoading } = useQuery({
    queryKey: ["/api/user-achievements"],
  });

  // Fetch personal records
  const { data: personalRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ["/api/personal-records"],
  });

  const isLoading = userLoading || workoutSessionsLoading || achievementsLoading || userAchievementsLoading || recordsLoading;

  // Safe user stats with defaults
  const safeUserStats = user || {
    username: 'Player',
    level: 1,
    experience: 0,
    strength: 0,
    stamina: 0,
    agility: 0,
    strengthXp: 0,
    staminaXp: 0,
    agilityXp: 0,
    currentStreak: 0,
    hp: 0,
    maxHp: 0,
    mp: 0,
    maxMp: 0,
    gold: 0,
    currentTitle: null
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Calculate derived stats
  const currentLevel = safeUserStats.level || 1;
  const currentExp = safeUserStats.experience || 0;
  const nextLevelExp = Math.floor(Math.pow(currentLevel, 1.8) * 16);
  const prevLevelExp = currentLevel > 1 ? Math.floor(Math.pow(currentLevel - 1, 1.8) * 16) : 0;
  const currentLevelProgress = currentExp - prevLevelExp;
  const expToNextLevel = nextLevelExp - prevLevelExp;
  const progressPercentage = Math.min((currentLevelProgress / expToNextLevel) * 100, 100);
  
  const streak = safeUserStats.currentStreak || 0;
  const totalBattles = Array.isArray(workoutSessions) ? workoutSessions.filter(session => 
    session.completed && session.sessionType === 'workout'
  ).length : 0;

  // Helper function to get level from XP
  const getLevelFromXp = (xp: number): number => {
    if (xp === 0) return 1;
    let level = 1;
    while (Math.pow(level, 2.5) * 50 <= xp) {
      level++;
    }
    return level;
  };

  // Helper function to get XP needed for next level
  const getXpForLevel = (level: number): number => {
    return Math.floor(Math.pow(level, 2.5) * 50);
  };

  // Helper function to get current progress for a stat
  const getStatProgress = (xp: number) => {
    const currentLevel = getLevelFromXp(xp);
    const currentLevelXp = getXpForLevel(currentLevel - 1);
    const nextLevelXp = getXpForLevel(currentLevel);
    const progress = xp - currentLevelXp;
    const total = nextLevelXp - currentLevelXp;
    return {
      level: currentLevel,
      progress,
      total,
      percentage: total > 0 ? (progress / total) * 100 : 0
    };
  };

  // Helper function to get title component with proper styling
  const getTitleComponent = (title: string | null, size: "sm" | "md" | "lg" = "md") => {
    if (!title) return { displayTitle: null, className: "" };

    const sizeClasses = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base"
    };

    // G.M. title (red/relic)
    if (title === "<G.M.>") {
      return {
        displayTitle: title,
        className: `${sizeClasses[size]} font-bold text-red-400`
      };
    }

    // Other titles with their rarity colors
    const titleColors: { [key: string]: string } = {
      "Recruit": "text-white",
      "Fitness Novice": "text-white",
      "Fitness Apprentice": "text-green-400",
      "Iron Novice": "text-green-400",
      "Fitness Warrior": "text-blue-400",
      "Iron Warrior": "text-blue-400",
      "Fitness Veteran": "text-blue-400",
      "Fitness Champion": "text-purple-400",
      "Iron Champion": "text-purple-400",
      "Fitness Master": "text-purple-400",
      "Fitness Grandmaster": "text-yellow-400",
      "Iron Grandmaster": "text-yellow-400",
      "Fitness Legend": "text-yellow-400",
      "Fitness Mythic": "text-orange-400",
      "Iron Mythic": "text-orange-400",
      "Fitness Godlike": "text-orange-400"
    };

    const colorClass = titleColors[title] || "text-white";
    
    return {
      displayTitle: title,
      className: `${sizeClasses[size]} font-bold ${colorClass}`
    };
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Character Stats</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">Your fitness progression journey</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Atrophy Warning */}
        <AtrophyWarning />

        {/* Character Profile */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            {/* Character Info Above Avatar */}
            <div className="text-center mb-6">
              {(() => {
                const titleComponent = getTitleComponent(safeUserStats.currentTitle, "md");
                return titleComponent.displayTitle ? (
                  <div className="mb-2">
                    <span className={titleComponent.className}>
                      {titleComponent.displayTitle}
                    </span>
                  </div>
                ) : null;
              })()}
              <h3 className="text-2xl font-bold mb-6 text-foreground">{safeUserStats.username || 'Player'}</h3>
            </div>

            {/* 2D Avatar Display */}
            <div className="flex flex-col items-center mb-6">
              <Avatar2D user={safeUserStats} size="lg" />
              
              {/* Character Stats Below Avatar */}
              <div className="text-center mt-6">
                <div className="flex items-center justify-center space-x-6 text-sm font-semibold text-foreground">
                  <span className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-600 mr-1" />
                    Level {currentLevel}
                  </span>
                  <span className="flex items-center">
                    <Flame className="w-4 h-4 text-orange-600 mr-1" />
                    {streak} day streak
                  </span>
                  <span className="flex items-center">
                    <Target className="w-4 h-4 text-red-600 mr-1" />
                    {totalBattles} battles won
                  </span>
                </div>
              </div>
            </div>

            {/* Character Level Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">Level {currentLevel}</span>
                <span className="text-xs text-muted-foreground">
                  {currentExp.toLocaleString()} / {nextLevelExp.toLocaleString()} XP
                </span>
              </div>
              <Progress 
                value={progressPercentage} 
                className="h-3 bg-secondary"
              />
            </div>

            {/* Individual Stat Progress Bars */}
            <div className="space-y-4">
              {/* Strength */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-foreground">
                      Strength Level {getStatProgress(safeUserStats.strengthXp || 0).level}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {getStatProgress(safeUserStats.strengthXp || 0).progress} / {getStatProgress(safeUserStats.strengthXp || 0).total} XP
                  </span>
                </div>
                <Progress 
                  value={getStatProgress(safeUserStats.strengthXp || 0).percentage} 
                  className="h-2 bg-secondary"
                />
              </div>

              {/* Stamina */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-foreground">
                      Stamina Level {getStatProgress(safeUserStats.staminaXp || 0).level}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {getStatProgress(safeUserStats.staminaXp || 0).progress} / {getStatProgress(safeUserStats.staminaXp || 0).total} XP
                  </span>
                </div>
                <Progress 
                  value={getStatProgress(safeUserStats.staminaXp || 0).percentage} 
                  className="h-2 bg-secondary"
                />
              </div>

              {/* Agility */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-foreground">
                      Agility Level {getStatProgress(safeUserStats.agilityXp || 0).level}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {getStatProgress(safeUserStats.agilityXp || 0).progress} / {getStatProgress(safeUserStats.agilityXp || 0).total} XP
                  </span>
                </div>
                <Progress 
                  value={getStatProgress(safeUserStats.agilityXp || 0).percentage} 
                  className="h-2 bg-secondary"
                />
              </div>
            </div>

            {/* Stat Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="text-red-400 mb-3">
                    <Dumbbell className="w-8 h-8" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Strength</h4>
                  <div className="text-3xl font-bold text-red-400">{safeUserStats.strength || 0}</div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="text-yellow-400 mb-3">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Stamina</h4>
                  <div className="text-3xl font-bold text-yellow-400">{safeUserStats.stamina || 0}</div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="text-green-400 mb-3">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Agility</h4>
                  <div className="text-3xl font-bold text-green-400">{safeUserStats.agility || 0}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Workouts Section - Compact */}
        {workoutSessions && Array.isArray(workoutSessions) && (
          <CompactWorkoutCard workoutSessions={workoutSessions} />
        )}

        {/* Achievements Section - Compact */}
        {achievements && Array.isArray(achievements) && Array.isArray(userAchievements) && (
          <CompactAchievementCard
            achievements={achievements}
            userAchievements={userAchievements}
            userStats={{
              level: safeUserStats.level || 1,
              strength: safeUserStats.strength || 0,
              stamina: safeUserStats.stamina || 0,
              agility: safeUserStats.agility || 0,
              currentStreak: safeUserStats.currentStreak || 0,
              totalWorkouts: Array.isArray(workoutSessions) ? workoutSessions.length : 0,
              gold: safeUserStats.gold || 0
            }}
          />
        )}

        {/* Personal Records */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-foreground">Personal Records</CardTitle>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {personalRecords && personalRecords.length > 0 ? (
              <div className="space-y-3">
                {personalRecords.slice(0, 5).map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="font-medium text-foreground">{record.exerciseName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.achievedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{record.value} {record.unit}</p>
                      <Badge variant="secondary" className="text-xs">
                        {record.recordType}
                      </Badge>
                    </div>
                  </div>
                ))}
                {personalRecords.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    +{personalRecords.length - 5} more records
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No personal records yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete workouts to start building your legacy!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}