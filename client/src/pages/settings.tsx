import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { ProfileEditDialog } from "@/components/ui/profile-edit-dialog";
import { useBackgroundMusic } from "@/contexts/background-music-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import { getTitleComponent } from "@/lib/title-rarity";
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
        description: "You have been logged out of Dumbbells & Dragons",
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

  // Available titles based on dungeon rank completion
  const getAvailableTitles = (userProgress: any, currentTitle: string) => {
    const titleRequirements = [
      { title: "No Title", requirement: "default" }, // Always available option
      { title: "Recruit", requirement: "default" },
      { title: "E-Rank Survivor", requirement: "e_rank_complete" },
      { title: "Novice Adventurer", requirement: "e_rank_complete" },
      { title: "D-Rank Conqueror", requirement: "d_rank_complete" },
      { title: "Dungeon Walker", requirement: "d_rank_complete" },
      { title: "C-Rank Vanquisher", requirement: "c_rank_complete" },
      { title: "Monster Hunter", requirement: "c_rank_complete" },
      { title: "Fitness Warrior", requirement: "c_rank_complete" },
      // B, A, S rank titles are locked for now
    ];

    const unlockedTitles = titleRequirements
      .filter(req => {
        if (req.requirement === "default") return true;
        // For now, all dungeon ranks are in development, so only basic titles available
        return false;
      })
      .map(req => req.title);

    // Add special admin title for specific users or if user already has it
    const username = userProgress?.username;
    if (currentTitle === "<G.M.>" || username === "Player 1") {
      unlockedTitles.push("<G.M.>");
    }

    return unlockedTitles;
  };

  const availableTitles = getAvailableTitles(userStats, (userStats as any)?.currentTitle || "");

  // Title update mutation
  const updateTitleMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      return apiRequest("/api/user/update-title", {
        method: "PATCH",
        body: { title: newTitle }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
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
          <p className="text-muted-foreground mt-0.5 text-sm">Customize your Dumbbells & Dragons experience</p>
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
                <Avatar2D size="sm" user={userStats as any} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-foreground">{(userStats as any)?.username || 'Fitness Warrior'}</h3>
                  {(() => {
                    const titleComponent = getTitleComponent((userStats as any)?.currentTitle, "sm");
                    return titleComponent.displayTitle ? (
                      <span className={titleComponent.className}>
                        {titleComponent.displayTitle}
                      </span>
                    ) : null;
                  })()}
                </div>
                <p className="text-muted-foreground">Level {(userStats as any)?.level || 1} • {(userStats as any)?.experience || 0} XP</p>
                <p className="text-sm text-muted-foreground">Avatar: {(userStats as any)?.gender === 'female' ? 'Female' : 'Male'}</p>
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
                    value={(userStats as any)?.currentTitle || "No Title"} 
                    onValueChange={(value) => updateTitleMutation.mutate(value)}
                    disabled={updateTitleMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTitles.map((title) => {
                        const titleComponent = getTitleComponent(title, "sm");
                        return (
                          <SelectItem key={title} value={title}>
                            <span className={title === "No Title" ? "text-gray-500" : titleComponent.className}>
                              {title === "No Title" ? "No Title" : titleComponent.displayTitle}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {updateTitleMutation.isPending && (
                <p className="text-xs text-muted-foreground mt-2">Updating title...</p>
              )}
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
              {(userStats as any)?.currentTitle === "<G.M.>" && (
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
              <p className="text-sm text-muted-foreground mb-2">Dumbbells & Dragons v1.0.0</p>
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