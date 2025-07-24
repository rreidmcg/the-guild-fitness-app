import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { ProfileEditDialog } from "@/components/ui/profile-edit-dialog";
import { useBackgroundMusic } from "@/hooks/use-background-music";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Download, 
  Upload,
  HelpCircle,
  LogOut,
  Volume2,
  VolumeX,
  Vibrate,
  Moon,
  Smartphone,
  Crown
} from "lucide-react";


export default function Settings() {
  const { toast } = useToast();
  const { isPlaying, isMuted, toggleMusic } = useBackgroundMusic();
  const [, setLocation] = useLocation();
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
    onSuccess: () => {
      // Clear any stored authentication data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      // Clear query cache
      queryClient.clear();
      
      // Show success message
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of FitQuest",
      });
      
      // Redirect to login page
      setLocation('/login');
    },
    onError: () => {
      // Even if logout fails on server, clear local data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      queryClient.clear();
      setLocation('/login');
    },
  });

  const handleSignOut = () => {
    signOutMutation.mutate();
  };

  // Available titles based on level progression
  const getAvailableTitles = (level: number, currentTitle: string) => {
    const titleRequirements = [
      { title: "Recruit", level: 1 },
      { title: "Novice", level: 2 },
      { title: "Apprentice", level: 5 }, 
      { title: "Journeyman", level: 10 },
      { title: "Expert", level: 15 },
      { title: "Master", level: 20 },
      { title: "Champion", level: 25 },
      { title: "Legend", level: 30 },
      { title: "Mythic", level: 40 },
    ];

    const unlockedTitles = titleRequirements
      .filter(req => level >= req.level)
      .map(req => req.title);

    // Add special admin title if user already has it
    if (currentTitle === "<G.M.>") {
      unlockedTitles.push("<G.M.>");
    }

    return unlockedTitles;
  };

  const availableTitles = getAvailableTitles(userStats?.level || 1, userStats?.currentTitle || "");

  // Title update mutation
  const updateTitleMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      return apiRequest("/api/user/update-title", {
        method: "PATCH",
        body: JSON.stringify({ title: newTitle })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Title Updated",
        description: "Your title has been changed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update title",
        variant: "destructive",
      });
    },
  });



  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Customize your FitQuest experience</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile</span>
              </div>
              <ProfileEditDialog>
                <Button variant="outline" size="sm">Edit Profile</Button>
              </ProfileEditDialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <Avatar2D size="sm" user={userStats} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-foreground">{userStats?.username || 'Fitness Warrior'}</h3>
                  {userStats?.currentTitle && (
                    <span className="px-2 py-1 text-xs font-bold bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
                      {userStats.currentTitle}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">Level {userStats?.level || 1} • {userStats?.experience || 0} XP</p>
                <p className="text-sm text-muted-foreground">Avatar: {userStats?.gender === 'female' ? 'Female' : 'Male'}</p>
              </div>
            </div>

            {/* Title Selection */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center space-x-2">
                    <Crown className="w-4 h-4" />
                    <span>Character Title</span>
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Choose your display title
                  </div>
                </div>
                <div className="w-48">
                  <Select 
                    value={userStats?.currentTitle || "Recruit"} 
                    onValueChange={(value) => updateTitleMutation.mutate(value)}
                    disabled={updateTitleMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTitles.map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {updateTitleMutation.isPending && (
                <p className="text-xs text-muted-foreground mt-2">Updating title...</p>
              )}
              
              {/* Title Progression Display */}
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-semibold text-foreground mb-3">Title Progression</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { title: "Recruit", level: 1 },
                    { title: "Novice", level: 2 },
                    { title: "Apprentice", level: 5 }, 
                    { title: "Journeyman", level: 10 },
                    { title: "Expert", level: 15 },
                    { title: "Master", level: 20 },
                    { title: "Champion", level: 25 },
                    { title: "Legend", level: 30 },
                    { title: "Mythic", level: 40 },
                  ].map(({ title, level }) => {
                    const isUnlocked = (userStats?.level || 1) >= level;
                    const isCurrent = userStats?.currentTitle === title;
                    return (
                      <div 
                        key={title}
                        className={`flex items-center justify-between p-2 rounded ${
                          isCurrent 
                            ? 'bg-yellow-500/20 border border-yellow-500/30' 
                            : isUnlocked 
                              ? 'bg-green-500/10 border border-green-500/20' 
                              : 'bg-gray-500/10 border border-gray-500/20 opacity-60'
                        }`}
                      >
                        <span className={`font-medium ${
                          isCurrent 
                            ? 'text-yellow-300' 
                            : isUnlocked 
                              ? 'text-green-300' 
                              : 'text-gray-400'
                        }`}>
                          {title}
                        </span>
                        <span className={`text-xs ${
                          isUnlocked ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          Lv. {level}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Current Level: {userStats?.level || 1} • Complete workouts and battles to level up and unlock new titles!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5" />
              <span>Audio</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="background-music" className="text-base">Background Music</Label>
                <div className="text-sm text-muted-foreground">
                  {isPlaying && !isMuted ? 'Currently playing' : 'Currently paused'}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="background-music"
                  checked={isPlaying && !isMuted}
                  onCheckedChange={toggleMusic}
                />
                {isPlaying && !isMuted ? (
                  <Volume2 className="w-4 h-4 text-green-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="workout-reminders" className="text-base">Workout Reminders</Label>
                <p className="text-sm text-muted-foreground">Get notified about scheduled workouts</p>
              </div>
              <Switch id="workout-reminders" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="achievement-alerts" className="text-base">Achievement Alerts</Label>
                <p className="text-sm text-muted-foreground">Celebrate when you level up or set PRs</p>
              </div>
              <Switch id="achievement-alerts" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="streak-warnings" className="text-base">Streak Warnings</Label>
                <p className="text-sm text-muted-foreground">Get reminded when your streak is at risk</p>
              </div>
              <Switch id="streak-warnings" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="animations" className="text-base">Animations</Label>
                <p className="text-sm text-muted-foreground">Enable smooth transitions and effects</p>
              </div>
              <Switch id="animations" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-effects" className="text-base">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">Play sounds for actions and achievements</p>
              </div>
              <Switch id="sound-effects" />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Privacy & Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="data-sharing" className="text-base">Anonymous Analytics</Label>
                <p className="text-sm text-muted-foreground">Help improve the app with anonymous usage data</p>
              </div>
              <Switch id="data-sharing" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="workout-privacy" className="text-base">Private Workouts</Label>
                <p className="text-sm text-muted-foreground">Keep your workout data private</p>
              </div>
              <Switch id="workout-privacy" defaultChecked />
            </div>

            <Button variant="outline" className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Data Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="flex items-center justify-center">
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </Button>
            </div>
            <Button variant="destructive" className="w-full">
              Delete All Data
            </Button>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5" />
              <span>Help & Support</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="flex items-center justify-center">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help Center
              </Button>
              <Button variant="outline" className="flex items-center justify-center">
                <Smartphone className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
              {userStats?.currentTitle === "<G.M.>" && (
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center"
                  onClick={() => setLocation('/admin')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}
            </div>
            
            <div className="text-center py-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">FitQuest v1.0.0</p>
              <p className="text-xs text-muted-foreground">
                Made with ❤️ for fitness enthusiasts
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}