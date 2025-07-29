import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { StatBar } from "@/components/ui/stat-bar";
import { WardrobeModal } from "@/components/ui/wardrobe-modal";

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
  Sparkle,
  Heart,
  Target,
  Zap,
  TrendingUp,
  Calendar,
  Coins,
  Plus,
  // Shield removed - now using Snowflake in currency header

  Shirt
} from "lucide-react";
import { CompactAchievementCard } from "@/components/ui/compact-achievement-card";

export default function Stats() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [showWardrobe, setShowWardrobe] = useState(false);
  
  // Calculator functions removed - no longer needed for wardrobe system
  
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

  // Achievement queries
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/achievements"],
  });

  const { data: userAchievements, isLoading: userAchievementsLoading } = useQuery({
    queryKey: ["/api/user-achievements"],
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

  const clearWardrobeNotificationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/user/clear-wardrobe-notification", {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
    },
    onError: (error: any) => {
      console.error("Failed to clear wardrobe notification:", error);
    }
  });

  // Streak freeze mutation removed - now handled automatically at midnight

  const recentSessions = Array.isArray(workoutSessions) ? workoutSessions.slice(0, 3) : [];
  const topRecords = Array.isArray(personalRecords) ? personalRecords.slice(0, 4) : [];

  // Safely cast userStats and provide fallbacks
  const safeUserStats = (userStats as any) || {};
  
  // Calculate stats
  const calculateTotalBattles = () => {
    // For now, we'll use the user's battle count from stats
    // This will be updated when we have battle history
    return safeUserStats.battlesWon || 0;
  };

  // Use streak from user stats instead of calculating
  const streak = safeUserStats.currentStreak || 0;

  const totalBattles = calculateTotalBattles();
  const totalVolumeThisMonth = Array.isArray(workoutSessions) ? workoutSessions.reduce((total: number, session: any) => total + (session.totalVolume || 0), 0) : 0;
  // Import proper level calculation from game mechanics
  const currentXP = safeUserStats.experience || 0;
  const currentLevel = safeUserStats.level || 1;
  
  // Use the EXACT same formula as backend: level^1.8 * 16
  const getXpRequiredForLevel = (level: number): number => {
    if (level <= 1) return 0;
    return Math.floor(Math.pow(level, 1.8) * 16);
  };
  
  const xpForCurrentLevel = getXpRequiredForLevel(currentLevel);
  const xpForNextLevel = getXpRequiredForLevel(currentLevel + 1);
  
  // Progress bar should match the displayed ratio: currentXP / xpForNextLevel
  // This makes the visual progress match what the user expects
  const xpProgress = xpForNextLevel > 0 ? (currentXP / xpForNextLevel) * 100 : 0;

  // Calculate level title
  const getLevelTitle = (level: number) => {
    if (level === 1) return "Fitness Novice";
    const titles = [
      "Fitness Novice", "Fitness Apprentice", "Fitness Warrior", "Fitness Veteran", "Fitness Champion", 
      "Fitness Master", "Fitness Grandmaster", "Fitness Legend", "Fitness Mythic", "Fitness Godlike"
    ];
    const titleIndex = Math.min(Math.floor(level / 5), titles.length - 1);
    return titles[titleIndex];
  };

  if (userStatsLoading || workoutSessionsLoading || personalRecordsLoading || inventoryLoading || achievementsLoading || userAchievementsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
        <div className="max-w-4xl mx-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Loading your stats...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative pb-20">
      
      {/* Main Content with higher z-index */}
      <div className="relative" style={{ zIndex: 10 }}>
      {/* Header */}
      <div className="bg-slate-800/90 border-b border-slate-600 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-glow-blue">Character Stats</h1>
              <p className="mt-0.5 text-sm text-bright-blue">Your fitness progression journey</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Calculator button hidden per user request */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Atrophy Warning */}
        {userStats && <AtrophyWarning />}
        {/* Character Profile */}
        <Card className="bg-slate-800/90 border-slate-600 relative">
          {/* Wardrobe Button in Corner */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              size="sm"
              onClick={() => setShowWardrobe(true)}
              className="bg-purple-600 text-white hover:bg-purple-700 p-2 relative"
              title="Open Wardrobe"
            >
              <Shirt className="w-4 h-4" />
              {safeUserStats.hasUnseenWardrobeChanges && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse"></div>
              )}
            </Button>
          </div>
          
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

              <div className={`border-4 rounded-lg p-1 ${
                // Avatar border based on avatar rarity/skin selection
                (safeUserStats?.hasLegendaryHunterSkin || safeUserStats?.currentTitle === "The First Flame"
                  ? "border-yellow-500 shadow-lg shadow-yellow-500/50" // Legendary rarity (Founders Pack)
                  : safeUserStats?.gender === "gm_avatar"
                    ? "border-red-500 shadow-lg shadow-red-500/50" // G.M. avatar rarity
                    : "border-gray-500") // Common/default rarity
              }`}>
                <Avatar2D user={safeUserStats} size="lg" />
              </div>
              
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
                <span className="text-sm text-red-600 font-semibold">
                  {safeUserStats.currentHp || 0} / {safeUserStats.maxHp || 40}
                </span>
              </div>
              <div className="w-full bg-red-900/40 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-400 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((safeUserStats.currentHp || 0) / (safeUserStats.maxHp || 1)) * 100))}%`
                  }}
                />
              </div>
              <div className="text-xs text-red-500 mt-2">
                Regenerates 1% of max HP per minute when not in combat
              </div>
              
              {/* Healing Potions */}
              <div className="mt-3 flex space-x-2">
                {['minor_healing', 'major_healing', 'full_healing'].map((potionType) => {
                  const potionNames = {
                    minor_healing: 'Minor',
                    major_healing: 'Major', 
                    full_healing: 'Full'
                  };
                  const quantity = Array.isArray(inventory) ? (inventory.find((item: any) => 
                    item.itemName === potionType && item.itemType === 'potion'
                  )?.quantity || 0) : 0;
                  
                  return quantity > 0 ? (
                    <Button
                      key={potionType}
                      size="sm"
                      onClick={() => usePotionMutation.mutate(potionType)}
                      disabled={usePotionMutation.isPending}
                      className={`text-xs ${potionType === 'minor_healing' 
                        ? 'bg-red-600 text-white hover:bg-red-700 border-red-600' 
                        : 'border-red-500 text-red-600 hover:bg-red-50'} transition-colors`}
                      variant={potionType === 'minor_healing' ? 'default' : 'outline'}
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      {potionNames[potionType as keyof typeof potionNames]} ({quantity})
                    </Button>
                  ) : null;
                })}
                {(!Array.isArray(inventory) || inventory.filter((item: any) => item.itemType === 'potion').length === 0) && (
                  <p className="text-xs text-muted-foreground">Visit the shop to buy healing potions</p>
                )}
              </div>
            </div>

            {/* Magic Points Bar */}
            <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Sparkle className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-blue-400">Magic Points</span>
                </div>
                <span className="text-sm text-blue-600 font-semibold">
                  {safeUserStats.currentMp || 0} / {safeUserStats.maxMp || 20}
                </span>
              </div>
              <div className="w-full bg-blue-900/40 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((safeUserStats.currentMp || 0) / (safeUserStats.maxMp || 1)) * 100))}%`
                  }}
                />
              </div>
              <div className="text-xs text-blue-500 mt-2">
                Regenerates 4% per minute when not in combat
              </div>
              
              {/* Mana Potions */}
              <div className="mt-3 flex space-x-2">
                {['minor_mana', 'major_mana', 'full_mana'].map((potionType) => {
                  const potionNames = {
                    minor_mana: 'Minor',
                    major_mana: 'Major',
                    full_mana: 'Full'
                  };
                  const quantity = Array.isArray(inventory) ? (inventory.find((item: any) => 
                    item.itemName === potionType && item.itemType === 'potion'
                  )?.quantity || 0) : 0;
                  
                  return quantity > 0 ? (
                    <Button
                      key={potionType}
                      size="sm"
                      variant="outline"
                      onClick={() => usePotionMutation.mutate(potionType)}
                      disabled={usePotionMutation.isPending}
                      className="text-xs border-blue-500 text-blue-300 hover:bg-blue-900/30"
                    >
                      <Sparkle className="w-3 h-3 mr-1" />
                      {potionNames[potionType as keyof typeof potionNames]} ({quantity})
                    </Button>
                  ) : null;
                })}
                {(!Array.isArray(inventory) || inventory.filter((item: any) => 
                  item.itemType === 'potion' && item.itemName.includes('mana')
                ).length === 0) && (
                  <p className="text-xs text-muted-foreground">Visit the shop to buy mana potions</p>
                )}
              </div>
            </div>

            {/* Character Stats - Simple Display */}
            <div className="grid grid-cols-3 gap-4">
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

        {/* Quick Stats Overview - Hidden since info is now in currency header */}

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
        <Card className="bg-slate-800/90 border-slate-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-foreground">Personal Records</CardTitle>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {topRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No personal records yet. Complete workouts to set PRs!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topRecords.map((record) => (
                  <Card key={record.id} className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <h3 className="font-semibold text-foreground">Exercise #{record.exerciseId}</h3>
                      </div>
                      <div className="text-2xl font-bold text-primary">{record.value}</div>
                      <p className="text-sm text-muted-foreground">{record.recordType}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {record.achievedAt ? new Date(record.achievedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


      </div>

      {/* Wardrobe Modal */}
      <WardrobeModal 
        isOpen={showWardrobe}
        onClose={() => {
          setShowWardrobe(false);
          // Clear the notification when wardrobe is viewed
          if (safeUserStats.hasUnseenWardrobeChanges) {
            clearWardrobeNotificationMutation.mutate();
          }
        }}
        user={safeUserStats}
      />
      </div>
    </div>
  );
}