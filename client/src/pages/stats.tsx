import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { StatBar } from "@/components/ui/stat-bar";
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
  Coins
} from "lucide-react";

export default function Stats() {
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
      <div className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground">Character Stats</h1>
          <p className="mt-1 text-muted-foreground">Your fitness progression journey</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Character Profile */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            {/* Character Info Above Avatar */}
            <div className="text-center mb-6">
              <div className="mb-2">
                <span className="text-sm text-green-600 font-semibold px-3 py-1 bg-green-100 rounded-full border border-green-200">
                  &lt;{getLevelTitle(currentLevel)}&gt;
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-6" style={{ color: 'rgb(30, 30, 30)', fontWeight: 800 }}>{userStats?.username || 'Player'}</h3>
            </div>

            {/* 2D Avatar Display */}
            <div className="flex flex-col items-center mb-6">
              <Avatar2D user={userStats} size="lg" />
              
              {/* Character Stats Below Avatar */}
              <div className="text-center mt-6">
                <div className="flex items-center justify-center space-x-6 text-sm font-semibold" style={{ color: 'rgb(60, 60, 60)' }}>
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
                <h4 className="text-sm font-semibold" style={{ color: 'rgb(60, 60, 60)' }}>Experience Points</h4>
                <span className="text-sm font-semibold" style={{ color: 'rgb(80, 80, 80)' }}>{currentXP} / {xpForNextLevel} XP</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-green-500 to-green-600" style={{ width: `${xpProgress}%` }}></div>
              </div>
              <p className="text-xs font-semibold mt-1" style={{ color: 'rgb(100, 100, 100)' }}>{xpForNextLevel - currentXP} XP to Level {currentLevel + 1}</p>
            </div>

            {/* Character Stats - Numerical Display */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <Dumbbell className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-700">{userStats?.strength || 0}</div>
                <div className="text-sm font-semibold text-red-600">Strength</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <Heart className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">{userStats?.stamina || 0}</div>
                <div className="text-sm font-semibold text-green-600">Stamina</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Wind className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-700">{userStats?.agility || 0}</div>
                <div className="text-sm font-semibold text-purple-600">Agility</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Coins className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'rgb(30, 30, 30)', fontWeight: 800 }}>{userStats?.gold || 0}</div>
              <div className="text-xs font-semibold" style={{ color: 'rgb(100, 100, 100)' }}>Gold Coins</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'rgb(30, 30, 30)', fontWeight: 800 }}>{currentLevel}</div>
              <p className="text-xs font-semibold" style={{ color: 'rgb(100, 100, 100)' }}>Current Level</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-700">{streak}</div>
              <p className="text-xs font-semibold" style={{ color: 'rgb(100, 100, 100)' }}>Day Streak</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ChartLine className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'rgb(30, 30, 30)', fontWeight: 800 }}>{currentXP}</div>
              <p className="text-xs font-semibold" style={{ color: 'rgb(100, 100, 100)' }}>Total XP</p>
            </CardContent>
          </Card>
        </div>

        {/* Personal Records */}
        <Card className="bg-game-slate border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-white">Personal Records</CardTitle>
              <TrendingUp className="w-5 h-5 text-game-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {topRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-300">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No personal records yet. Complete workouts to set PRs!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topRecords.map((record) => (
                  <Card key={record.id} className="bg-gray-800 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <Trophy className="w-4 h-4 text-game-warning" />
                        <h3 className="font-semibold text-white">Exercise #{record.exerciseId}</h3>
                      </div>
                      <div className="text-2xl font-bold text-game-primary">{record.value}</div>
                      <p className="text-sm text-gray-300">{record.recordType}</p>
                      <p className="text-xs text-gray-400 mt-1">
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
          <Card className="bg-game-slate border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Character Wardrobe
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6 mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-white flex items-center justify-center">
                    <Star className="w-5 h-5 mr-2 text-purple-400" />
                    Customize Appearance
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Purchase and equip new clothing items for your character!
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
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
          <Card className="bg-game-slate border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <Dumbbell className="w-5 h-5 mr-2" />
                Battle Arena
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-white flex items-center justify-center">
                    <Target className="w-5 h-5 mr-2 text-red-400" />
                    Fight Monsters
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Battle creatures to earn gold for purchasing wardrobe items!
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
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