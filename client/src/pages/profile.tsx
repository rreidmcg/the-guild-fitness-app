import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { ProfileEditDialog } from "@/components/ui/profile-edit-dialog";
import { 
  User, 
  Star, 
  Trophy, 
  Target, 
  Crown,
  Award,
  Calendar,
  TrendingUp,
  Coins,
  Flame
} from "lucide-react";

export default function Profile() {
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: workoutSessions } = useQuery({
    queryKey: ["/api/workout-sessions"],
  });

  const { data: personalRecords } = useQuery({
    queryKey: ["/api/personal-records"],
  });

  const { data: achievements } = useQuery({
    queryKey: ["/api/user/achievements"],
  });

  // Calculate stats
  const calculateActiveDays = () => {
    if (!workoutSessions || workoutSessions.length === 0) return 0;
    
    const uniqueDates = new Set(
      workoutSessions.map((session: any) => {
        const date = new Date(session.completedAt);
        return date.toDateString();
      })
    );
    
    return uniqueDates.size;
  };

  const totalWorkouts = workoutSessions?.length || 0;
  const activeDays = calculateActiveDays();
  const totalRecords = personalRecords?.length || 0;
  const unlockedAchievements = achievements?.length || 0;

  // Get tier title
  const getTierTitle = (tier: string) => {
    const tierTitles = {
      "": "Recruit",
      "E": "Fighter", 
      "D": "Warrior",
      "C": "Champion",
      "B": "Hero",
      "A": "Legend",
      "S": "Mythic"
    };
    return tierTitles[tier as keyof typeof tierTitles] || "Recruit";
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profile</h1>
              <p className="text-muted-foreground mt-1">Your fitness journey overview</p>
            </div>
            <ProfileEditDialog>
              <Button variant="outline">Edit Profile</Button>
            </ProfileEditDialog>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Character Profile */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            {/* Character Info Above Avatar */}
            <div className="text-center mb-6">
              <div className="mb-2">
                <Badge variant="secondary" className="bg-green-900/20 text-green-300 border-green-700">
                  &lt;{getLevelTitle(userStats?.level || 1)}&gt;
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">{userStats?.username || 'Player'}</h3>
              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Crown className="w-4 h-4 mr-1" />
                  {getTierTitle(userStats?.highestTierCompleted || "")}
                </span>
                <span className="flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  Level {userStats?.level || 1}
                </span>
              </div>
            </div>

            {/* 2D Avatar Display */}
            <div className="flex flex-col items-center mb-6">
              <Avatar2D user={userStats} size="lg" />
            </div>

            {/* Current Title */}
            <div className="text-center mb-6">
              <Badge className="bg-purple-900/20 text-purple-300 border-purple-700 text-lg px-4 py-2">
                {userStats?.currentTitle || "Recruit"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Profile Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{totalWorkouts}</div>
              <div className="text-sm text-muted-foreground">Total Workouts</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{activeDays}</div>
              <div className="text-sm text-muted-foreground">Active Days</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{totalRecords}</div>
              <div className="text-sm text-muted-foreground">Personal Records</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <Coins className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-foreground">{userStats?.gold || 0}</div>
              <div className="text-sm text-muted-foreground">Gold Earned</div>
            </CardContent>
          </Card>
        </div>

        {/* Character Stats */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Character Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400 mb-1">{userStats?.strength || 0}</div>
                <div className="text-sm text-muted-foreground font-medium">Strength</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">{userStats?.stamina || 0}</div>
                <div className="text-sm text-muted-foreground font-medium">Stamina</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">{userStats?.agility || 0}</div>
                <div className="text-sm text-muted-foreground font-medium">Agility</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Recent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unlockedAchievements > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements?.slice(0, 4).map((achievement: any) => (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg border border-border">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <div>
                      <div className="font-semibold text-foreground">{achievement.name}</div>
                      <div className="text-sm text-muted-foreground">{achievement.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No achievements unlocked yet. Complete workouts and battles to earn achievements!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}