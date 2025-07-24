import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/ui/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "@/components/ui/avatar-display";
import { StatBar } from "@/components/ui/stat-bar";
import { WorkoutCard } from "@/components/ui/workout-card";
import { useLocation } from "wouter";
import { 
  Dumbbell, 
  Plus, 
  Trophy, 
  Flame, 
  Weight, 
  ChartLine, 
  Play, 
  Star,
  Heart,
  Target,
  Zap
} from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: workoutSessions } = useQuery({
    queryKey: ["/api/workout-sessions"],
  });

  const { data: personalRecords } = useQuery({
    queryKey: ["/api/personal-records"],
  });

  const recentSessions = workoutSessions?.slice(0, 3) || [];
  const topRecords = personalRecords?.slice(0, 4) || [];

  // Calculate active days
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

  const activeDays = calculateActiveDays();

  // Calculate streak (simplified)
  const streak = 7; // TODO: Calculate actual streak
  const totalVolumeThisMonth = 45280; // TODO: Calculate actual volume

  // Calculate XP progress
  const currentXP = userStats?.experience || 0;
  const currentLevel = userStats?.level || 1;
  const xpForNextLevel = currentLevel * 1000;
  const xpProgress = (currentXP % 1000) / 1000 * 100;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* XP Progress */}
          <Card className="bg-card border-border card-glow transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Experience</h3>
                <ChartLine className="w-4 h-4 text-game-success" />
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-foreground">{currentXP}</span>
                  <span className="text-sm text-muted-foreground">/ {xpForNextLevel} XP</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="xp-bar h-2 rounded-full" style={{ width: `${xpProgress}%` }}></div>
                </div>
                <p className="text-xs text-muted-foreground">{xpForNextLevel - currentXP} XP to Level {currentLevel + 1}</p>
              </div>
            </CardContent>
          </Card>

          {/* Current Level */}
          <Card className="bg-card border-border card-glow transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Current Level</h3>
                <Trophy className="w-4 h-4 text-game-warning" />
              </div>
              <div className="space-y-2">
                <span className="text-4xl font-bold text-foreground">{currentLevel}</span>
                <p className="text-xs text-muted-foreground">Warrior Rank</p>
              </div>
            </CardContent>
          </Card>

          {/* Workout Streak */}
          <Card className="bg-card border-border card-glow transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Streak</h3>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div className="space-y-2">
                <span className="text-4xl font-bold text-orange-400">{streak}</span>
                <p className="text-xs text-muted-foreground">Days in a row</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Volume */}
          <Card className="bg-card border-border card-glow transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Total Volume</h3>
                <Weight className="w-4 h-4 text-game-primary" />
              </div>
              <div className="space-y-2">
                <span className="text-2xl font-bold text-foreground">{totalVolumeThisMonth.toLocaleString()}</span>
                <p className="text-xs text-muted-foreground">lbs lifted this month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Workouts & Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Workouts */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-foreground">Recent Workouts</CardTitle>
                  <Button 
                    onClick={() => setLocation("/workouts")}
                    className="bg-game-primary hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    View Workouts
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No workouts yet. Start your fitness journey!</p>
                  </div>
                ) : (
                  recentSessions.map((session) => (
                    <WorkoutCard key={session.id} session={session} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Personal Records */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-foreground">Personal Records</CardTitle>
                  <Button variant="ghost" className="text-game-primary hover:text-blue-400">
                    <ChartLine className="w-4 h-4 mr-2" />
                    View All
                  </Button>
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
                      <Card key={record.id} className="bg-muted border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <Trophy className="w-4 h-4 text-game-warning" />
                            <h3 className="font-semibold text-foreground">Exercise #{record.exerciseId}</h3>
                          </div>
                          <div className="text-2xl font-bold text-game-primary">{record.value}</div>
                          <p className="text-sm text-muted-foreground">{record.recordType}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Character Profile */}
          <div className="space-y-8">
            {/* 3D Avatar Card */}
            <Card className="bg-game-slate border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Your Avatar</CardTitle>
              </CardHeader>
              <CardContent>
                <AvatarDisplay />
                
                {/* Character Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Fitness Warrior</h3>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
                    <span><Star className="w-3 h-3 text-game-warning mr-1 inline" />Level {currentLevel}</span>
                    <span><Target className="w-3 h-3 mr-1 inline" />{activeDays} days active</span>
                  </div>
                </div>

                {/* Character Stats */}
                <div className="space-y-4">
                  <StatBar 
                    icon={<Dumbbell className="w-4 h-4 text-red-400" />}
                    name="Strength"
                    value={userStats?.strength || 0}
                    color="from-red-500 to-red-400"
                  />
                  <StatBar 
                    icon={<Heart className="w-4 h-4 text-green-400" />}
                    name="Stamina"
                    value={userStats?.stamina || 0}
                    color="from-green-500 to-green-400"
                  />
                  <StatBar 
                    icon={<Zap className="w-4 h-4 text-purple-400" />}
                    name="Flexibility"
                    value={userStats?.flexibility || 0}
                    color="from-purple-500 to-purple-400"
                  />
                  <StatBar 
                    icon={<Target className="w-4 h-4 text-blue-400" />}
                    name="Endurance"
                    value={userStats?.endurance || 0}
                    color="from-blue-500 to-blue-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-game-slate border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-game-primary hover:bg-blue-600"
                  onClick={() => setLocation("/workout-builder")}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Quick Workout
                </Button>
                <Button 
                  className="w-full bg-game-secondary hover:bg-purple-600"
                  onClick={() => setLocation("/workout-builder")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Workout
                </Button>
                <Button 
                  variant="secondary"
                  className="w-full bg-gray-700 hover:bg-gray-600"
                >
                  <ChartLine className="w-4 h-4 mr-2" />
                  View Progress
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button 
          size="lg"
          className="w-14 h-14 bg-game-primary hover:bg-blue-600 rounded-full shadow-lg hover:scale-110 transition-all duration-300"
          onClick={() => setLocation("/workout-builder")}
        >
          <Dumbbell className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
