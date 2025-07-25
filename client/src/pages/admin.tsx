import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Users, 
  Shield, 
  ArrowLeft,
  Calendar,
  TrendingUp,
  Dumbbell,
  Crown
} from "lucide-react";
import { getTitleComponent } from "@/lib/title-rarity";

interface UserData {
  id: number;
  username: string;
  level: number;
  experience: number;
  strength: number;
  stamina: number;
  agility: number;
  gold: number;
  currentTitle: string;
  createdAt: string;
  battlesWon: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: userStats?.currentTitle === "<G.M.>",
  });

  const { data: systemStats } = useQuery({
    queryKey: ["/api/admin/system-stats"],
    enabled: userStats?.currentTitle === "<G.M.>",
  });

  // Check if user has admin access
  if (userStats && userStats.currentTitle !== "<G.M.>") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this area.
            </p>
            <Button onClick={() => setLocation("/")} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setLocation("/")}
                size="sm"
                variant="outline"
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center">
                  <Crown className="w-6 h-6 text-yellow-500 mr-2" />
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground mt-0.5 text-sm">Dumbbells & Dragons System Management</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Welcome, <span className="text-yellow-500 font-bold">{userStats?.username}</span>
              {userStats?.currentTitle && (
                <span className={`ml-2 ${getTitleComponent(userStats.currentTitle, "sm").className}`}>
                  {userStats.currentTitle}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">
                    {systemStats?.totalUsers || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold text-foreground">
                    {systemStats?.activeToday || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Workouts</p>
                  <p className="text-2xl font-bold text-foreground">
                    {systemStats?.totalWorkouts || 0}
                  </p>
                </div>
                <Dumbbell className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Level</p>
                  <p className="text-2xl font-bold text-foreground">
                    {systemStats?.averageLevel || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>All Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">Username</th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">Level</th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">XP</th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">Stats (S/St/A)</th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">Gold</th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">Battles</th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers?.map((user: UserData) => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-foreground">{user.username}</span>
                          {user.currentTitle === "<G.M.>" && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-foreground">{user.level}</td>
                      <td className="p-2 text-foreground">{user.experience}</td>
                      <td className="p-2">
                        <span className="text-red-400">{user.strength}</span>/
                        <span className="text-green-400">{user.stamina}</span>/
                        <span className="text-purple-400">{user.agility}</span>
                      </td>
                      <td className="p-2 text-yellow-500">{user.gold}</td>
                      <td className="p-2">
                        <span className={getTitleComponent(user.currentTitle || "Recruit", "sm").className}>
                          {user.currentTitle || "Recruit"}
                        </span>
                      </td>
                      <td className="p-2 text-foreground">{user.battlesWon || 0}</td>
                      <td className="p-2 text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}