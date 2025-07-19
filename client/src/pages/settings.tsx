import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar2D } from "@/components/ui/avatar-2d";
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
  Vibrate,
  Moon,
  Smartphone
} from "lucide-react";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Customize your FitQuest experience</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <Avatar2D size="sm" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">Fitness Warrior</h3>
                <p className="text-muted-foreground">Level 1 • 0 XP</p>
                <p className="text-sm text-muted-foreground">Joined today</p>
              </div>
              <Button variant="outline">Edit Profile</Button>
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
            <Button variant="destructive" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}