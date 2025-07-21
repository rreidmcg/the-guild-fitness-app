import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { StatBar } from "@/components/ui/stat-bar";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Wind,
  Coins,
  Plus
} from "lucide-react";

export default function Stats() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: workoutSessions } = useQuery({
    queryKey: ["/api/workout-sessions"],
  });

  const { data: personalRecords } = useQuery({
    queryKey: ["/api/personal-records"],
  });

  const { data: inventory } = useQuery({
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

  const recentSessions = workoutSessions?.slice(0, 3) || [];
  const topRecords = personalRecords?.slice(0, 4) || [];

  // Calculate stats
  const calculateActiveDays = () => {
    if (!workoutSessions || workoutSessions.length === 0) return 0;
    
    // Get unique dates from workout sessions
    const uniqueDates = new Set(
      workoutSessions.map(session => {
        const date = new Date(session.completedAt);
        return date.toDateString(); // This gives us "Mon Oct 09 2023" format
      })
    );
    
    return uniqueDates.size;
  };

  const calculateStreak = () => {
    if (!workoutSessions || workoutSessions.length === 0) return 0;
    
    // Sort sessions by date (newest first)
    const sortedSessions = [...workoutSessions].sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
    
    // Get unique workout dates
    const workoutDates = Array.from(new Set(
      sortedSessions.map(session => {
        const date = new Date(session.completedAt);
        return date.toDateString();
      })
    )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (workoutDates.length === 0) return 0;
    
    // Check if there was a workout today or yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    // If no workout today or yesterday, streak is 0
    if (workoutDates[0] !== todayStr && workoutDates[0] !== yesterdayStr) {
      return 0;
    }
    
    // Count consecutive days
    let streak = 0;
    let currentDate = new Date(workoutDates[0]);
    
    for (const workoutDateStr of workoutDates) {
      const workoutDate = new Date(workoutDateStr);
      
      if (workoutDate.toDateString() === currentDate.toDateString()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const activeDays = calculateActiveDays();
  const streak = calculateStreak();
  const totalVolumeThisMonth = workoutSessions?.reduce((total, session) => total + (session.totalVolume || 0), 0) || 0;
  const currentXP = userStats?.experience || 0;
  const currentLevel = userStats?.level || 1;
  const xpForNextLevel = currentLevel * 1000;
  const xpProgress = (currentXP % 1000) / 1000 * 100;

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
            <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-foreground text-sm">{userStats?.gold || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Character Profile */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            {/* Character Info Above Avatar */}
            <div className="text-center mb-6">
              <div className="mb-2">
                <span className="text-sm text-green-300 font-semibold px-3 py-1 bg-green-900/20 rounded-full border border-green-700">
                  &lt;{getLevelTitle(currentLevel)}&gt;
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-6 text-foreground">{userStats?.username || 'Player'}</h3>
            </div>

            {/* 2D Avatar Display */}
            <div className="flex flex-col items-center mb-6">
              <Avatar2D user={userStats} size="lg" />
              
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
                    <Calendar className="w-4 h-4 text-blue-600 mr-1" />
                    {activeDays} days active
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
                  {userStats?.currentHp || 0} / {userStats?.maxHp || 40}
                </span>
              </div>
              <div className="w-full bg-red-900/40 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-400 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((userStats?.currentHp || 0) / (userStats?.maxHp || 1)) * 100))}%`
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
                    minor_healing: 'Minor',
                    major_healing: 'Major', 
                    full_healing: 'Full'
                  };
                  const quantity = inventory?.find((item: any) => 
                    item.itemName === potionType && item.itemType === 'potion'
                  )?.quantity || 0;
                  
                  return quantity > 0 ? (
                    <Button
                      key={potionType}
                      size="sm"
                      variant="outline"
                      onClick={() => usePotionMutation.mutate(potionType)}
                      disabled={usePotionMutation.isPending}
                      className="text-xs border-red-500 text-red-300 hover:bg-red-900/30"
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      {potionNames[potionType as keyof typeof potionNames]} ({quantity})
                    </Button>
                  ) : null;
                })}
                {(!inventory || inventory.filter((item: any) => item.itemType === 'potion').length === 0) && (
                  <p className="text-xs text-muted-foreground">Visit the shop to buy healing potions</p>
                )}
              </div>
            </div>

            {/* Magic Points Bar */}
            <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-blue-400">Magic Points</span>
                </div>
                <span className="text-sm text-blue-300">
                  {userStats?.currentMp || 0} / {userStats?.maxMp || 20}
                </span>
              </div>
              <div className="w-full bg-blue-900/40 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((userStats?.currentMp || 0) / (userStats?.maxMp || 1)) * 100))}%`
                  }}
                />
              </div>
              <div className="text-xs text-blue-300 mt-2 opacity-80">
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
                  const quantity = inventory?.find((item: any) => 
                    item.itemName === potionType && item.itemType === 'potion'
                  )?.quantity || 0;
                  
                  return quantity > 0 ? (
                    <Button
                      key={potionType}
                      size="sm"
                      variant="outline"
                      onClick={() => usePotionMutation.mutate(potionType)}
                      disabled={usePotionMutation.isPending}
                      className="text-xs border-blue-500 text-blue-300 hover:bg-blue-900/30"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      {potionNames[potionType as keyof typeof potionNames]} ({quantity})
                    </Button>
                  ) : null;
                })}
                {(!inventory || inventory.filter((item: any) => 
                  item.itemType === 'potion' && item.itemName.includes('mana')
                ).length === 0) && (
                  <p className="text-xs text-muted-foreground">Visit the shop to buy mana potions</p>
                )}
              </div>
            </div>

            {/* Character Stats - Numerical Display */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-700">
                <Dumbbell className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-300">{userStats?.strength || 0}</div>
                <div className="text-sm font-semibold text-red-400">Strength</div>
              </div>
              <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-700">
                <Heart className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-300">{userStats?.stamina || 0}</div>
                <div className="text-sm font-semibold text-green-400">Stamina</div>
              </div>
              <div className="text-center p-4 bg-purple-900/20 rounded-lg border border-purple-700">
                <Wind className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-300">{userStats?.agility || 0}</div>
                <div className="text-sm font-semibold text-purple-400">Agility</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-primary">{userStats?.gold || 0}</div>
            <div className="text-xs font-semibold text-muted-foreground">Gold Coins</div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-primary">{currentLevel}</div>
            <p className="text-xs font-semibold text-muted-foreground">Current Level</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-400">{streak}</div>
            <p className="text-xs font-semibold text-muted-foreground">Day Streak</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <ChartLine className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-primary">{currentXP}</div>
            <p className="text-xs font-semibold text-muted-foreground">Total XP</p>
          </div>
        </div>

        {/* Personal Records */}
        <Card className="bg-card border-border">
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
                  <Card key={record.id} className="bg-secondary border-border">
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

        {/* Character Customization & Battle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Character Wardrobe */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Character Wardrobe
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6 mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center justify-center">
                    <Star className="w-5 h-5 mr-2 text-purple-400" />
                    Customize Appearance
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Purchase and equip new clothing items for your character!
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Coins className="w-4 h-4 mr-1 text-yellow-400" />
                      Gold: {userStats?.gold || 0}
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setLocation('/wardrobe')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Open Wardrobe
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Battle Arena */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground flex items-center">
                <Dumbbell className="w-5 h-5 mr-2" />
                Battle Arena
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center justify-center">
                    <Target className="w-5 h-5 mr-2 text-red-400" />
                    Fight Monsters
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Battle creatures to earn gold for purchasing wardrobe items!
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-foreground">
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-1 text-red-400" />
                      HP: {(userStats?.stamina || 10) * 2}
                    </div>
                    <div className="flex items-center">
                      <Dumbbell className="w-4 h-4 mr-1 text-orange-400" />
                      ATK: {Math.max(1, Math.floor((userStats?.strength || 5) / 2))}
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setLocation('/battle')}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Enter Battle Arena
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}