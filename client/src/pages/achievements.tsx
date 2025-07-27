import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { AchievementCard } from "@/components/ui/achievement-card";

export default function Achievements() {
  const [, setLocation] = useLocation();

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Fetch achievements
  const { data: achievements } = useQuery({
    queryKey: ["/api/achievements"],
  });

  // Fetch user achievements
  const { data: userAchievements } = useQuery({
    queryKey: ["/api/user-achievements"],
  });

  // Fetch workout sessions for total workout count
  const { data: workoutSessions } = useQuery({
    queryKey: ["/api/workout-sessions"],
  });

  const safeUserStats = (userStats as any) || {};

  // Sort achievements: unlocked first, then by difficulty (requirement)
  const sortedAchievements = achievements ? [...achievements].sort((a: any, b: any) => {
    const aUnlocked = Array.isArray(userAchievements) ? userAchievements.find((ua: any) => ua.achievementId === a.id) : undefined;
    const bUnlocked = Array.isArray(userAchievements) ? userAchievements.find((ua: any) => ua.achievementId === b.id) : undefined;
    
    // Unlocked achievements first
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    
    // Within same unlock status, sort by requirement (easiest first)
    return a.requirement - b.requirement;
  }) : [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/stats')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Stats
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              All Achievements
            </h1>
            <p className="mt-2 text-white/80">
              Track your fitness journey and unlock rewards for your dedication
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Achievement Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {Array.isArray(userAchievements) ? userAchievements.length : 0}
                </div>
                <div className="text-sm text-muted-foreground">Unlocked</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {Array.isArray(achievements) ? achievements.length : 0}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {Array.isArray(achievements) && Array.isArray(userAchievements) 
                    ? Math.round((userAchievements.length / achievements.length) * 100) 
                    : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedAchievements.length > 0 ? sortedAchievements.map((achievement: any) => {
            const userAchievement = Array.isArray(userAchievements) 
              ? userAchievements.find((ua: any) => ua.achievementId === achievement.id)
              : undefined;
            
            return (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                userAchievement={userAchievement}
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
            );
          }) : (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Achievements Yet</h3>
              <p>Complete workouts and level up to unlock achievements!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}