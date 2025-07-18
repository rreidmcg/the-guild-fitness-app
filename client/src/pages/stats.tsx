import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar
} from "lucide-react";

export default function Stats() {
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
  const streak = 7; // TODO: Calculate actual streak
  const totalVolumeThisMonth = 45280; // TODO: Calculate actual volume
  const currentXP = userStats?.experience || 0;
  const currentLevel = userStats?.level || 1;
  const xpForNextLevel = currentLevel * 1000;
  const xpProgress = (currentXP % 1000) / 1000 * 100;

  // Calculate level title
  const getLevelTitle = (level: number) => {
    const titles = [
      "Novice", "Apprentice", "Warrior", "Veteran", "Champion", 
      "Master", "Grandmaster", "Legend", "Mythic", "Godlike"
    ];
    const titleIndex = Math.min(Math.floor(level / 5), titles.length - 1);
    return titles[titleIndex];
  };

  return (
    <div className="min-h-screen bg-game-dark text-white pb-20">
      {/* Header */}
      <div className="bg-game-slate border-b border-gray-700 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Character Stats</h1>
          <p className="text-gray-400 mt-1">Your fitness progression journey</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Character Profile */}
        <Card className="bg-game-slate border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white text-center">Your Avatar</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 2D Avatar Display */}
            <div className="flex flex-col items-center mb-6">
              <Avatar2D user={userStats} size="lg" />
              
              {/* Character Info */}
              <div className="text-center mt-6">
                <h3 className="text-2xl font-bold text-white mb-2">Fitness {getLevelTitle(currentLevel)}</h3>
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-300">
                  <span className="flex items-center">
                    <Star className="w-4 h-4 text-game-warning mr-1" />
                    Level {currentLevel}
                  </span>
                  <span className="flex items-center">
                    <Flame className="w-4 h-4 text-orange-500 mr-1" />
                    {streak} day streak
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 text-blue-400 mr-1" />
                    45 days active
                  </span>
                </div>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-300">Experience Points</h4>
                <span className="text-sm text-gray-400">{currentXP} / {xpForNextLevel} XP</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="xp-bar h-3 rounded-full transition-all duration-300" style={{ width: `${xpProgress}%` }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{xpForNextLevel - currentXP} XP to Level {currentLevel + 1}</p>
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

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-game-slate border-gray-700 card-glow transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-game-warning" />
              </div>
              <div className="text-2xl font-bold text-white">{currentLevel}</div>
              <p className="text-xs text-gray-400">Current Level</p>
            </CardContent>
          </Card>

          <Card className="bg-game-slate border-gray-700 card-glow transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-orange-400">{streak}</div>
              <p className="text-xs text-gray-400">Day Streak</p>
            </CardContent>
          </Card>

          <Card className="bg-game-slate border-gray-700 card-glow transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ChartLine className="w-5 h-5 text-game-success" />
              </div>
              <div className="text-2xl font-bold text-white">{currentXP}</div>
              <p className="text-xs text-gray-400">Total XP</p>
            </CardContent>
          </Card>

          <Card className="bg-game-slate border-gray-700 card-glow transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Dumbbell className="w-5 h-5 text-game-primary" />
              </div>
              <div className="text-xl font-bold text-white">{totalVolumeThisMonth.toLocaleString()}</div>
              <p className="text-xs text-gray-400">lbs this month</p>
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
              <div className="text-center py-8 text-gray-400">
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
                      <p className="text-sm text-gray-400">{record.recordType}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {record.achievedAt ? new Date(record.achievedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Chart Placeholder */}
        <Card className="bg-game-slate border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Progress Chart</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-center text-gray-400">
              <ChartLine className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Progress Visualization</h3>
              <p>Track your fitness journey over time</p>
              <p className="text-sm mt-2">Charts coming soon!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}