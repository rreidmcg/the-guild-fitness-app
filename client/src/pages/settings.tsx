import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { ProfileEditDialog } from "@/components/ui/profile-edit-dialog";
import { useBackgroundMusic } from "@/hooks/use-background-music";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Calculator,
  Droplets
} from "lucide-react";


export default function Settings() {
  const { toast } = useToast();
  const { isPlaying, isMuted, toggleMusic } = useBackgroundMusic();
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Unit system state
  const [unitSystem, setUnitSystem] = useState('metric');
  
  // Calculator states
  const [calorieForm, setCalorieForm] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintain'
  });
  
  const [hydrationForm, setHydrationForm] = useState({
    weight: '',
    activityLevel: 'moderate',
    climate: 'moderate'
  });

  // Unit conversion functions
  const convertWeight = (value: number, toImperial: boolean) => {
    return toImperial ? value * 2.20462 : value / 2.20462; // kg <-> lbs
  };

  const convertHeight = (value: number, toImperial: boolean) => {
    return toImperial ? value / 2.54 : value * 2.54; // cm <-> inches
  };

  // Calculator functions with unit conversion
  const calculateBMR = () => {
    const { age, weight, height, gender } = calorieForm;
    if (!age || !weight || !height) return 0;
    
    const ageNum = parseInt(age);
    let weightKg = parseFloat(weight);
    let heightCm = parseFloat(height);
    
    // Convert to metric if needed
    if (unitSystem === 'imperial') {
      weightKg = convertWeight(weightKg, false);
      heightCm = convertHeight(heightCm, false);
    }
    
    // Mifflin-St Jeor Equation (uses metric units)
    if (gender === 'male') {
      return (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) + 5;
    } else {
      return (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) - 161;
    }
  };

  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };
    return bmr * activityMultipliers[calorieForm.activityLevel as keyof typeof activityMultipliers];
  };

  const calculateCalorieGoal = () => {
    const tdee = calculateTDEE();
    switch (calorieForm.goal) {
      case 'lose': return tdee - 500; // 1 lb/week loss
      case 'gain': return tdee + 500; // 1 lb/week gain
      default: return tdee; // maintain
    }
  };

  const calculateMacros = (calories: number) => {
    // Standard macro split: 30% protein, 35% carbs, 35% fat
    return {
      protein: Math.round((calories * 0.30) / 4), // 4 cal per gram
      carbs: Math.round((calories * 0.35) / 4),
      fat: Math.round((calories * 0.35) / 9) // 9 cal per gram
    };
  };

  const calculateHydration = () => {
    const { weight, activityLevel, climate } = hydrationForm;
    if (!weight) return 0;
    
    let weightKg = parseFloat(weight);
    
    // Convert to metric if needed
    if (unitSystem === 'imperial') {
      weightKg = convertWeight(weightKg, false);
    }
    
    // Base calculation: 35ml per kg
    let waterMl = weightKg * 35;
    
    // Activity adjustments
    const activityMultipliers = {
      sedentary: 1,
      light: 1.1,
      moderate: 1.2,
      active: 1.3,
      veryActive: 1.4
    };
    
    // Climate adjustments
    const climateMultipliers = {
      cold: 0.9,
      moderate: 1,
      hot: 1.2
    };
    
    waterMl *= activityMultipliers[activityLevel as keyof typeof activityMultipliers];
    waterMl *= climateMultipliers[climate as keyof typeof climateMultipliers];
    
    return Math.round(waterMl);
  };



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
                <h3 className="text-lg font-semibold text-foreground">{userStats?.username || 'Fitness Warrior'}</h3>
                <p className="text-muted-foreground">Level {userStats?.level || 1} • {userStats?.experience || 0} XP</p>
                <p className="text-sm text-muted-foreground">Avatar: {userStats?.gender === 'female' ? 'Female' : 'Male'}</p>
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
            </div>
            
            <div className="text-center py-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">FitQuest v1.0.0</p>
              <p className="text-xs text-muted-foreground">
                Made with ❤️ for fitness enthusiasts
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Health Calculators */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="w-5 h-5" />
              <span>Health Calculators</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Unit System Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Measurement System</Label>
                <p className="text-sm text-muted-foreground">Choose between metric and imperial units</p>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="unit-system" className="text-sm">
                  {unitSystem === 'metric' ? 'Metric' : 'Imperial'}
                </Label>
                <Switch 
                  id="unit-system"
                  checked={unitSystem === 'imperial'}
                  onCheckedChange={(checked) => setUnitSystem(checked ? 'imperial' : 'metric')}
                />
              </div>
            </div>

            {/* Calorie & Macro Calculator */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-500" />
                Calorie & Macro Calculator
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Age</label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={calorieForm.age}
                    onChange={(e) => setCalorieForm(prev => ({ ...prev, age: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                  </label>
                  <Input
                    type="number"
                    placeholder={unitSystem === 'metric' ? '70' : '154'}
                    value={calorieForm.weight}
                    onChange={(e) => setCalorieForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Height ({unitSystem === 'metric' ? 'cm' : 'inches'})
                  </label>
                  <Input
                    type="number"
                    placeholder={unitSystem === 'metric' ? '175' : '69'}
                    value={calorieForm.height}
                    onChange={(e) => setCalorieForm(prev => ({ ...prev, height: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gender</label>
                  <Select value={calorieForm.gender} onValueChange={(value) => setCalorieForm(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Activity Level</label>
                  <Select value={calorieForm.activityLevel} onValueChange={(value) => setCalorieForm(prev => ({ ...prev, activityLevel: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="veryActive">Very Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Goal</label>
                  <Select value={calorieForm.goal} onValueChange={(value) => setCalorieForm(prev => ({ ...prev, goal: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose">Lose Weight</SelectItem>
                      <SelectItem value="maintain">Maintain</SelectItem>
                      <SelectItem value="gain">Gain Weight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {calculateCalorieGoal() > 0 && (
                <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                  <h4 className="font-semibold text-blue-400 mb-2">Your Results</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">BMR:</span>
                      <span className="ml-2 font-bold text-foreground">{Math.round(calculateBMR())} cal</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">TDEE:</span>
                      <span className="ml-2 font-bold text-foreground">{Math.round(calculateTDEE())} cal</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Daily Goal:</span>
                      <span className="ml-2 font-bold text-blue-400">{Math.round(calculateCalorieGoal())} calories</span>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-blue-700 pt-3">
                    <h5 className="text-sm font-semibold text-blue-400 mb-2">Macro Breakdown</h5>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {(() => {
                        const macros = calculateMacros(calculateCalorieGoal());
                        return (
                          <>
                            <div className="text-center p-2 bg-red-900/30 rounded">
                              <div className="font-bold text-red-400">{macros.protein}g</div>
                              <div className="text-muted-foreground">Protein</div>
                            </div>
                            <div className="text-center p-2 bg-green-900/30 rounded">
                              <div className="font-bold text-green-400">{macros.carbs}g</div>
                              <div className="text-muted-foreground">Carbs</div>
                            </div>
                            <div className="text-center p-2 bg-yellow-900/30 rounded">
                              <div className="font-bold text-yellow-400">{macros.fat}g</div>
                              <div className="text-muted-foreground">Fat</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hydration Calculator */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                Hydration Calculator
              </h3>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Body Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                  </label>
                  <Input
                    type="number"
                    placeholder={unitSystem === 'metric' ? '70' : '154'}
                    value={hydrationForm.weight}
                    onChange={(e) => setHydrationForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Activity Level</label>
                  <Select value={hydrationForm.activityLevel} onValueChange={(value) => setHydrationForm(prev => ({ ...prev, activityLevel: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="veryActive">Very Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Climate</label>
                  <Select value={hydrationForm.climate} onValueChange={(value) => setHydrationForm(prev => ({ ...prev, climate: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cold">Cold</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="hot">Hot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {calculateHydration() > 0 && (
                <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                  <h4 className="font-semibold text-blue-400 mb-2">Recommended Daily Intake</h4>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {unitSystem === 'metric' 
                        ? `${(calculateHydration() / 1000).toFixed(1)} L`
                        : `${(calculateHydration() * 0.033814).toFixed(1)} fl oz`
                      }
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {unitSystem === 'metric' 
                        ? `${calculateHydration()} ml`
                        : `${Math.round(calculateHydration() / 240)} cups`
                      }
                    </div>
                  </div>
                </div>
              )}
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