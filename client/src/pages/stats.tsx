import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { StatBar } from "@/components/ui/stat-bar";
import { EnhancedStatBar } from "@/components/ui/enhanced-stat-bar";
import { CurrencyHeader } from "@/components/ui/currency-header";
import { AtrophyWarning } from "@/components/ui/atrophy-warning";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getTitleComponent } from "@/lib/title-rarity";
import { 
  Dumbbell, 
  Trophy, 
  Flame, 
  ChartLine, 
  Star,
  Heart,
  Target,
  Zap,
  TrendingUp,
  Calendar,
  Coins,
  Plus,
  Shield
} from "lucide-react";
import manaIcon from "@assets/icons8-mana-32_1753480226817.png";

export default function Stats() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: workoutSessions, isLoading: workoutSessionsLoading } = useQuery({
    queryKey: ["/api/workout-sessions"],
  });

  const { data: personalRecords, isLoading: personalRecordsLoading } = useQuery({
    queryKey: ["/api/personal-records"],
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const usePotionMutation = useMutation({
    mutationFn: async (potionType: string) => {
      return apiRequest("/api/use-potion", {
        method: "POST",
        body: JSON.stringify({ potionType })
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      
      const isHealing = data.healedAmount !== undefined;
      const isMana = data.restoredAmount !== undefined;
      
      toast({
        title: "Potion Used",
        description: isHealing 
          ? `Healed ${data.healedAmount} HP!`
          : `Restored ${data.restoredAmount} MP!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot Use Potion",
        description: error.message || "You don't have this potion or are already at full capacity",
        variant: "destructive",
      });
    },
  });

  const useStreakFreezeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/use-streak-freeze", {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      if (data.success) {
        toast({
          title: "Streak Freeze Used!",
          description: `Your streak is protected today. Remaining: ${data.remainingFreezes}`,
        });
      } else {
        toast({
          title: "No Streak Freezes",
          description: "You need to complete daily quests to earn streak freezes.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to use streak freeze",
        variant: "destructive",
      });
    },
  });

  const safeUserStats = userStats || {
    level: 1,
    experience: 0,
    strength: 0,
    strengthXp: 0,
    stamina: 0,
    staminaXp: 0,
    agility: 0,
    agilityXp: 0,
    currentHP: 100,
    maxHP: 100,
    currentMP: 100,
    maxMP: 100,
    streak: 0,
    streakFreezes: 0,
    gold: 0,
    currentTitle: null,
    username: 'Player'
  };
  const safeWorkoutSessions = workoutSessions || [];
  const safePersonalRecords = personalRecords || [];
  const safeInventory = inventory as Array<{
    id: number;
    itemType: string;
    itemName: string;
    quantity: number;
  }> || [];

  // Calculate stats
  const currentLevel = safeUserStats.level;
  const currentXP = safeUserStats.experience;
  const xpForNextLevel = currentLevel * 1000;
  const xpProgress = (currentXP % 1000) / 1000 * 100;
  const streak = safeUserStats.streak;
  
  // Get recent session stats
  const recentSessions = safeWorkoutSessions.slice(0, 7); // Last 7 sessions
  const totalBattles = safeWorkoutSessions.length;

  // Calculate title
  const getNextTitle = (level: number) => {
    const titles = [
      "Fitness Novice", "Fitness Apprentice", "Fitness Warrior", "Fitness Veteran", "Fitness Champion", 
      "Fitness Master", "Fitness Grandmaster", "Fitness Legend", "Fitness Mythic", "Fitness Godlike"
    ];
    const titleIndex = Math.min(Math.floor(level / 5), titles.length - 1);
    return titles[titleIndex];
  };

  if (userStatsLoading || workoutSessionsLoading || personalRecordsLoading || inventoryLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <CurrencyHeader />
        <div className="max-w-4xl mx-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your stats...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <CurrencyHeader />
      
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
              {safeUserStats.currentTitle && (
                <div className="mb-2">
                  <span className={getTitleComponent(safeUserStats.currentTitle, "md").className}>
                    {safeUserStats.currentTitle}
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold mb-6 text-foreground">{safeUserStats.username}</h3>
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

            {/* XP Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground">Experience Points</h4>
                <span className="text-sm font-semibold text-muted-foreground">{currentXP} / {xpForNextLevel} XP</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-green-500 to-green-600" style={{ width: `${xpProgress}%` }}></div>
              </div>
              <p className="text-xs font-semibold mt-1 text-muted-foreground">{xpForNextLevel - currentXP} XP to Level {currentLevel + 1}</p>
            </div>

            {/* Health Bar */}
            <div className="mb-6 p-4 bg-red-900/20 rounded-lg border border-red-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span className="font-semibold text-red-400">Health</span>
                </div>
                <span className="text-sm text-red-300">
                  {safeUserStats.currentHP}/{safeUserStats.maxHP} HP
                </span>
              </div>
              <div className="w-full bg-red-900 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-red-600 to-red-500" 
                  style={{ width: `${(safeUserStats.currentHP / safeUserStats.maxHP) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Mana Bar */}
            <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <img src={manaIcon} alt="Mana" className="w-5 h-5" />
                  <span className="font-semibold text-blue-400">Mana</span>
                </div>
                <span className="text-sm text-blue-300">
                  {safeUserStats.currentMP}/{safeUserStats.maxMP} MP
                </span>
              </div>
              <div className="w-full bg-blue-900 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-500" 
                  style={{ width: `${(safeUserStats.currentMP / safeUserStats.maxMP) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Combat Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <EnhancedStatBar
                label="STR"
                statLevel={safeUserStats.strength}
                totalXp={safeUserStats.strengthXp}
                color="red"
                icon={<Dumbbell />}
              />
              <EnhancedStatBar
                label="STA"
                statLevel={safeUserStats.stamina}
                totalXp={safeUserStats.staminaXp}
                color="green"
                icon={<Heart />}
              />
              <EnhancedStatBar
                label="AGI"
                statLevel={safeUserStats.agility}
                totalXp={safeUserStats.agilityXp}
                color="blue"
                icon={<Zap />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Health Potions */}
              {safeInventory.filter(item => item.itemName === "Health Potion").map(item => (
                <div key={item.id} className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🧪</div>
                  <p className="text-sm font-medium text-red-400">{item.itemName}</p>
                  <p className="text-xs text-muted-foreground mb-2">Quantity: {item.quantity}</p>
                  <Button
                    size="sm"
                    onClick={() => usePotionMutation.mutate("health")}
                    disabled={usePotionMutation.isPending || safeUserStats.currentHP >= safeUserStats.maxHP}
                    className="w-full bg-red-600 hover:bg-red-700 text-xs"
                  >
                    Use
                  </Button>
                </div>
              ))}

              {/* Mana Potions */}
              {safeInventory.filter(item => item.itemName === "Mana Potion").map(item => (
                <div key={item.id} className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🧪</div>
                  <p className="text-sm font-medium text-blue-400">{item.itemName}</p>
                  <p className="text-xs text-muted-foreground mb-2">Quantity: {item.quantity}</p>
                  <Button
                    size="sm"
                    onClick={() => usePotionMutation.mutate("mana")}
                    disabled={usePotionMutation.isPending || safeUserStats.currentMP >= safeUserStats.maxMP}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    Use
                  </Button>
                </div>
              ))}

              {/* Streak Freezes */}
              <div className="bg-cyan-900/20 border border-cyan-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🧊</div>
                <p className="text-sm font-medium text-cyan-400">Streak Freeze</p>
                <p className="text-xs text-muted-foreground mb-2">Count: {safeUserStats.streakFreezes}</p>
                <Button
                  size="sm"
                  onClick={() => useStreakFreezeMutation.mutate()}
                  disabled={useStreakFreezeMutation.isPending || safeUserStats.streakFreezes === 0}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-xs"
                >
                  Use
                </Button>
              </div>

              {/* Gold display */}
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🪙</div>
                <p className="text-sm font-medium text-yellow-400">Gold</p>
                <p className="text-lg font-bold text-yellow-300">{safeUserStats.gold}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <ChartLine className="w-5 h-5 text-green-500" />
                Recent Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.slice(0, 5).map((session: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-900/10 rounded-lg border border-green-700">
                      <div>
                        <p className="text-sm font-medium text-foreground">{session.name || "Workout"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">+{session.xpEarned || 0} XP</p>
                        <p className="text-xs text-muted-foreground">{session.duration || 0}min</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent workouts</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Personal Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {safePersonalRecords.length > 0 ? (
                <div className="space-y-3">
                  {safePersonalRecords.slice(0, 5).map((record: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-900/10 rounded-lg border border-yellow-700">
                      <div>
                        <p className="text-sm font-medium text-foreground">{record.exerciseName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.achievedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-yellow-400">{record.value} {record.unit}</p>
                        <p className="text-xs text-muted-foreground">Personal Best</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No records yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}