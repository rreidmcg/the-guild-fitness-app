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
  Plus,
  Settings,
  Shield
} from "lucide-react";

export default function Stats() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // API Queries
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: workoutSessions } = useQuery({
    queryKey: ["/api/workout-sessions"],
  });

  const { data: topRecords } = useQuery({
    queryKey: ["/api/personal-records"],
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
  });

  // Mutations
  const usePotionMutation = useMutation({
    mutationFn: (type: string) => 
      apiRequest(`/api/inventory/use-potion`, {
        method: "POST",
        body: JSON.stringify({ type }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Potion Used!",
        description: "Your HP or MP has been restored.",
      });
    },
  });

  const useStreakFreezeMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/user/use-streak-freeze`, {
        method: "POST",
      }),
    onSuccess: (data: any) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
        toast({
          title: "Streak Freeze Used!",
          description: `Remaining streak freezes: ${data.remainingFreezes}`,
        });
      }
    },
  });

  // Data processing
  const recentSessions = workoutSessions?.slice(0, 5) || [];
  const monthlyVolumeData = workoutSessions?.slice(0, 30).map((session: any) => ({
    date: new Date(session.completedAt).getDate(),
    volume: session.totalVolume || 0
  })) || [];

  const calculateTotalBattles = () => {
    return userStats?.battlesWon || 0;
  };

  // Use streak from user stats instead of calculating
  const streak = userStats?.currentStreak || 0;

  const totalBattles = calculateTotalBattles();
  const totalVolumeThisMonth = workoutSessions?.reduce((total: number, session: any) => total + (session.totalVolume || 0), 0) || 0;
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
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-foreground text-sm">{userStats?.gold || 0}</span>
              </div>
              <Button 
                onClick={() => setLocation('/settings')}
                size="sm"
                variant="outline"
                className="p-2"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Character Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-32 h-32">
                  <Avatar2D 
                    strength={userStats?.strength || 0} 
                    stamina={userStats?.stamina || 0} 
                    agility={userStats?.agility || 0} 
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{getLevelTitle(currentLevel)}</h3>
                  <p className="text-sm text-muted-foreground">
                    Level {currentLevel} • {userStats?.experience || 0} XP
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Stats */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg text-foreground mb-4">Core Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-red-500" />
                      Strength
                    </span>
                    <span className="font-bold text-red-500">{userStats?.strength || 0}</span>
                  </div>
                  <StatBar value={userStats?.strength || 0} maxValue={100} color="red" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Heart className="w-4 h-4 text-green-500" />
                      Stamina
                    </span>
                    <span className="font-bold text-green-500">{userStats?.stamina || 0}</span>
                  </div>
                  <StatBar value={userStats?.stamina || 0} maxValue={100} color="green" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      Agility
                    </span>
                    <span className="font-bold text-blue-500">{userStats?.agility || 0}</span>
                  </div>
                  <StatBar value={userStats?.agility || 0} maxValue={100} color="blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health & Magic */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg text-foreground mb-4">Resources</h3>
              <div className="space-y-4">
                {/* HP Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      HP
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-500">
                        {userStats?.currentHP || 0}/{(10 + (userStats?.stamina || 0) * 3)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => usePotionMutation.mutate('health')}
                        disabled={usePotionMutation.isPending || !inventory?.find((item: any) => item.itemName === 'Health Potion')?.quantity}
                      >
                        Potion ({inventory?.find((item: any) => item.itemName === 'Health Potion')?.quantity || 0})
                      </Button>
                    </div>
                  </div>
                  <StatBar 
                    value={userStats?.currentHP || 0} 
                    maxValue={10 + (userStats?.stamina || 0) * 3} 
                    color="red" 
                  />
                </div>

                {/* MP Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      MP
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-500">
                        {userStats?.currentMP || 0}/{((userStats?.stamina || 0) * 2) + (userStats?.agility || 0)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => usePotionMutation.mutate('mana')}
                        disabled={usePotionMutation.isPending || !inventory?.find((item: any) => item.itemName === 'Mana Potion')?.quantity}
                      >
                        Potion ({inventory?.find((item: any) => item.itemName === 'Mana Potion')?.quantity || 0})
                      </Button>
                    </div>
                  </div>
                  <StatBar 
                    value={userStats?.currentMP || 0} 
                    maxValue={((userStats?.stamina || 0) * 2) + (userStats?.agility || 0)} 
                    color="blue" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Experience Progress */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>Experience Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Level {currentLevel}</span>
                  <span className="text-sm font-bold text-foreground">{currentXP} / {xpForNextLevel} XP</span>
                </div>
                <StatBar value={xpProgress} maxValue={100} color="yellow" />
                <p className="text-xs text-muted-foreground mt-1">
                  {xpForNextLevel - currentXP} XP needed for Level {currentLevel + 1}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Streak & Freezes */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span>Workout Streak</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">{streak}</div>
                <p className="text-sm text-muted-foreground">Day streak</p>
                {userStats?.streakFreezes > 0 && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => useStreakFreezeMutation.mutate()}
                      disabled={useStreakFreezeMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Use Streak Freeze ({userStats?.streakFreezes || 0})
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{totalBattles}</div>
              <p className="text-sm text-muted-foreground">Battles Won</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <Dumbbell className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{Math.round(totalVolumeThisMonth)}</div>
              <p className="text-sm text-muted-foreground">Volume This Month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{topRecords?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Personal Records</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Personal Records */}
        {topRecords && topRecords.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>Recent Personal Records</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topRecords.slice(0, 5).map((record: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">{record.exerciseName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.achievedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">{record.weight}kg</div>
                      <div className="text-sm text-muted-foreground">{record.reps} reps</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}