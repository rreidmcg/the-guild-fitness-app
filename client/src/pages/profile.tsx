import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Target, 
  Award,
  Settings,
  Activity,
  Trophy,
  Dumbbell,
  Scale,
  TrendingUp,
  Ruler,
  Save,
  Edit3
} from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    height: "",
    weight: "",
    fitnessGoal: "",
    measurementUnit: "metric"
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: workoutSessions } = useQuery({
    queryKey: ["/api/workout-sessions"],
  });

  const { data: personalRecords } = useQuery({
    queryKey: ["/api/personal-records"],
  });

  // Initialize form data when user stats load
  useEffect(() => {
    if (userStats) {
      setFormData({
        username: userStats.username || "",
        height: userStats.height?.toString() || "",
        weight: userStats.weight?.toString() || "",
        fitnessGoal: userStats.fitnessGoal || "",
        measurementUnit: userStats.measurementUnit || "metric"
      });
    }
  }, [userStats]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const totalWorkouts = workoutSessions?.length || 0;
  const totalRecords = personalRecords?.length || 0;
  const totalBattles = userStats?.battlesWon || 0;

  const handleSave = () => {
    const updates: any = {};
    if (formData.username !== userStats?.username) updates.username = formData.username;
    if (formData.height && formData.height !== userStats?.height) updates.height = parseInt(formData.height);
    if (formData.weight && formData.weight !== userStats?.weight) updates.weight = parseInt(formData.weight);
    if (formData.fitnessGoal !== userStats?.fitnessGoal) updates.fitnessGoal = formData.fitnessGoal;
    if (formData.measurementUnit !== userStats?.measurementUnit) updates.measurementUnit = formData.measurementUnit;
    
    if (Object.keys(updates).length > 0) {
      updateProfileMutation.mutate(updates);
    } else {
      setIsEditing(false);
    }
  };

  const formatHeight = (heightCm: number, unit: string) => {
    if (!heightCm) return "Not set";
    if (unit === "imperial") {
      const totalInches = heightCm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}'${inches}" (${heightCm} cm)`;
    }
    return `${heightCm} cm`;
  };

  const formatWeight = (weightKg: number, unit: string) => {
    if (!weightKg) return "Not set";
    if (unit === "imperial") {
      const pounds = Math.round(weightKg * 2.205);
      return `${pounds} lbs (${weightKg} kg)`;
    }
    return `${weightKg} kg`;
  };

  const getFitnessGoalLabel = (goal: string) => {
    const goals = {
      "lose_weight": "Lose Weight",
      "gain_muscle": "Gain Muscle", 
      "improve_endurance": "Improve Endurance",
      "general_fitness": "General Fitness"
    };
    return goals[goal as keyof typeof goals] || "Not set";
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

  // Mock weight progress data for the graph
  const weightData = [
    { date: '2025-01-01', weight: userStats?.weight || 70 },
    { date: '2025-01-08', weight: (userStats?.weight || 70) - 0.5 },
    { date: '2025-01-15', weight: (userStats?.weight || 70) - 1 },
    { date: '2025-01-22', weight: (userStats?.weight || 70) - 0.8 }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">Manage your profile and app preferences</p>
            </div>
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={updateProfileMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Personal Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                {isEditing ? (
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-2 bg-muted rounded-md text-foreground">
                    {userStats?.username || "Not set"}
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="level">Character Level</Label>
                <div className="mt-1 p-2 bg-muted rounded-md text-foreground flex items-center">
                  <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                  Level {userStats?.level || 1} - {getLevelTitle(userStats?.level || 1)}
                </div>
              </div>

              <div>
                <Label htmlFor="measurementUnit">Measurement System</Label>
                {isEditing ? (
                  <Select value={formData.measurementUnit} onValueChange={(value) => setFormData(prev => ({ ...prev, measurementUnit: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select measurement system" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                      <SelectItem value="imperial">Imperial (lbs, ft/in)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1 p-2 bg-muted rounded-md text-foreground flex items-center">
                    <Ruler className="w-4 h-4 mr-2 text-blue-500" />
                    {formData.measurementUnit === "metric" ? "Metric (kg, cm)" : "Imperial (lbs, ft/in)"}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="height">Height</Label>
                {isEditing ? (
                  <Input
                    id="height"
                    type="number"
                    placeholder={formData.measurementUnit === "metric" ? "Height in cm" : "Height in inches"}
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-2 bg-muted rounded-md text-foreground">
                    {formatHeight(userStats?.height, formData.measurementUnit)}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="fitnessGoal">Fitness Goal</Label>
                {isEditing ? (
                  <Select value={formData.fitnessGoal} onValueChange={(value) => setFormData(prev => ({ ...prev, fitnessGoal: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your fitness goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose_weight">Lose Weight</SelectItem>
                      <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                      <SelectItem value="improve_endurance">Improve Endurance</SelectItem>
                      <SelectItem value="general_fitness">General Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1 p-2 bg-muted rounded-md text-foreground">
                    {getFitnessGoalLabel(userStats?.fitnessGoal)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight Tracking */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center">
              <Scale className="w-5 h-5 mr-2" />
              Weight Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="weight">Current Weight</Label>
                {isEditing ? (
                  <Input
                    id="weight"
                    type="number"
                    placeholder={formData.measurementUnit === "metric" ? "Weight in kg" : "Weight in lbs"}
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-muted rounded-md text-foreground">
                    <div className="text-2xl font-bold text-blue-400">
                      {formatWeight(userStats?.weight, formData.measurementUnit)}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <Label>Weight Progress</Label>
                <div className="mt-1 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-700">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">On Track</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Start Weight</span>
                      <span className="text-foreground">{formatWeight((userStats?.weight || 70) + 2, formData.measurementUnit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <span className="text-blue-400 font-semibold">{formatWeight(userStats?.weight || 70, formData.measurementUnit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Target</span>
                      <span className="text-green-400">{formatWeight((userStats?.weight || 70) - 3, formData.measurementUnit)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                      <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">40% to goal</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fitness Statistics */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Fitness Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                <Dumbbell className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-300">{totalWorkouts}</div>
                <div className="text-sm font-semibold text-blue-400">Total Workouts</div>
              </div>
              
              <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-700">
                <Target className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-300">{totalBattles}</div>
                <div className="text-sm font-semibold text-red-400">Battles Won</div>
              </div>
              
              <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-700">
                <Trophy className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-300">{totalRecords}</div>
                <div className="text-sm font-semibold text-green-400">Personal Records</div>
              </div>
              
              <div className="text-center p-4 bg-purple-900/20 rounded-lg border border-purple-700">
                <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-300">{userStats?.experience || 0}</div>
                <div className="text-sm font-semibold text-purple-400">Total XP</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Workout Reminders</Label>
                <p className="text-sm text-muted-foreground">Get daily reminders to stay active</p>
              </div>
              <Switch id="notifications" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sounds">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">Enable battle and workout sounds</p>
              </div>
              <Switch id="sounds" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="privacy">Private Profile</Label>
                <p className="text-sm text-muted-foreground">Hide your stats from other players</p>
              </div>
              <Switch id="privacy" />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Export Workout Data
            </Button>
            <Button variant="outline" className="w-full">
              Reset Progress
            </Button>
            <Button variant="destructive" className="w-full">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}