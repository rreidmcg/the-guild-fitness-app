import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar2D } from "@/components/ui/avatar-2d";
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
          : isMana 
            ? `Restored ${data.restoredAmount} MP!`
            : "Potion consumed!",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to use potion",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const handleUsePotion = (potionType: string) => {
    usePotionMutation.mutate(potionType);
  };

  // Create safe stats object with defaults
  const safeUserStats = {
    level: 1,
    experiencePoints: 0,
    gold: 0,
    strength: 1,
    stamina: 1,
    agility: 1,
    strengthXp: 0,
    staminaXp: 0,
    agilityXp: 0,
    currentHp: 40,
    maxHp: 40,
    currentMp: 3,
    maxMp: 3,
    currentTitle: "",
    username: "",
    createdAt: "",
    ...userStats
  };

  const safeWorkoutSessions = workoutSessions || [];
  const safePersonalRecords = personalRecords || [];
  const safeInventory = inventory || [];

  // Stats calculations
  const currentLevel = safeUserStats.level;
  const currentXP = safeUserStats.experiencePoints;
  const xpForThisLevel = (currentLevel - 1) ** 2 * 100;
  const xpForNextLevel = currentLevel ** 2 * 100;
  const xpProgress = ((currentXP - xpForThisLevel) / (xpForNextLevel - xpForThisLevel)) * 100;

  // Calculate streak and stats
  const streak = safeWorkoutSessions.filter((session: any) => {
    const sessionDate = new Date(session.completedAt);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;

  const totalBattles = safeWorkoutSessions.filter((session: any) => session.battleWon).length;

  // Stat levels
  const strengthLevel = Math.floor(Math.sqrt(safeUserStats.strengthXp / 100)) + 1;
  const staminaLevel = Math.floor(Math.sqrt(safeUserStats.staminaXp / 100)) + 1;
  const agilityLevel = Math.floor(Math.sqrt(safeUserStats.agilityXp / 100)) + 1;

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
            <div className="flex items-center space-x-3">
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
              <div className="text-xs text-red-300 mt-2 opacity-80">
                Regenerates 1% of max HP per minute when not in combat
              </div>
              
              {/* Healing Potions */}
              <div className="mt-3 flex space-x-2">
                {['minor_healing', 'major_healing', 'full_healing'].map((potionType) => {
                  const potionNames = {
                    minor_healing: 'Minor Healing',
                    major_healing: 'Major Healing',
                    full_healing: 'Full Healing'
                  };
                  
                  const potionCount = safeInventory.find((item: any) => item.itemId === potionType)?.quantity || 0;
                  
                  return (
                    <div key={potionType} className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={potionCount === 0 || usePotionMutation.isPending}
                        onClick={() => handleUsePotion(potionType)}
                        className="bg-red-800/20 border-red-600 hover:bg-red-700/30 text-red-300"
                      >
                        {potionNames[potionType as keyof typeof potionNames]}
                      </Button>
                      <div className="text-xs text-red-400 mt-1">x{potionCount}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mana Bar */}
            <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-blue-400">Mana</span>
                </div>
                <span className="text-sm text-blue-300">
                  {safeUserStats.currentMp || 0} / {safeUserStats.maxMp || 3}
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
              <div className="text-xs text-blue-300 mt-2 opacity-80">
                Regenerates at {Math.max(0.5, Math.floor((safeUserStats.agility || 1) / 2))}% of max MP per minute
              </div>
              
              {/* Mana Potions */}
              <div className="mt-3 flex space-x-2">
                {['minor_mana', 'major_mana', 'full_mana'].map((potionType) => {
                  const potionNames = {
                    minor_mana: 'Minor Mana',
                    major_mana: 'Major Mana',
                    full_mana: 'Full Mana'
                  };
                  
                  const potionCount = safeInventory.find((item: any) => item.itemId === potionType)?.quantity || 0;
                  
                  return (
                    <div key={potionType} className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={potionCount === 0 || usePotionMutation.isPending}
                        onClick={() => handleUsePotion(potionType)}
                        className="bg-blue-800/20 border-blue-600 hover:bg-blue-700/30 text-blue-300"
                      >
                        {potionNames[potionType as keyof typeof potionNames]}
                      </Button>
                      <div className="text-xs text-blue-400 mt-1">x{potionCount}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combat Stats */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-blue-500" />
              Combat Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Strength */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Dumbbell className="w-4 h-4 text-red-400" />
                    <span className="font-semibold text-red-400">Strength</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">Lv. {strengthLevel}</span>
                </div>
                <EnhancedStatBar 
                  value={safeUserStats.strengthXp} 
                  level={strengthLevel}
                  type="strength"
                />
                <div className="text-xs text-muted-foreground">
                  Base Damage: {3 + Math.floor((safeUserStats.strength || 1) / 2)} per attack
                </div>
              </div>

              {/* Stamina */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-green-400" />
                    <span className="font-semibold text-green-400">Stamina</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">Lv. {staminaLevel}</span>
                </div>
                <EnhancedStatBar 
                  value={safeUserStats.staminaXp} 
                  level={staminaLevel}
                  type="stamina"
                />
                <div className="text-xs text-muted-foreground">
                  Max HP: {10 + (safeUserStats.stamina || 1) * 3} | Max MP Boost: {(safeUserStats.stamina || 1) * 2}
                </div>
              </div>

              {/* Agility */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold text-yellow-400">Agility</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">Lv. {agilityLevel}</span>
                </div>
                <EnhancedStatBar 
                  value={safeUserStats.agilityXp} 
                  level={agilityLevel}
                  type="agility"
                />
                <div className="text-xs text-muted-foreground">
                  Evasion: {Math.min(90, (safeUserStats.agility || 1) * 5)}% | MP Regen: {Math.max(0.5, Math.floor((safeUserStats.agility || 1) / 2))}%/min
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Records */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Personal Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {safePersonalRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {safePersonalRecords.map((record: any) => (
                  <Card key={record.id} className="bg-secondary border-border">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-foreground mb-1">{record.exerciseName}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Best: {record.weight}kg × {record.reps} reps</p>
                        <p className="text-xs">
                          {new Date(record.achievedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No personal records yet</p>
                <p className="text-sm text-muted-foreground mt-1">Complete workouts to set your first records!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}