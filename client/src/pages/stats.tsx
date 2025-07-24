import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { StatBar } from "@/components/ui/stat-bar";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Coins,
  Plus,
  Settings,
  Shield,
  Calculator,
  Droplets
} from "lucide-react";

export default function Stats() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCalculators, setShowCalculators] = useState(false);
  
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

  // Calculator functions
  const calculateBMR = () => {
    const { age, weight, height, gender } = calorieForm;
    if (!age || !weight || !height) return 0;
    
    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    
    // Mifflin-St Jeor Equation
    if (gender === 'male') {
      return (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) + 5;
    } else {
      return (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) - 161;
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
    
    const weightNum = parseFloat(weight);
    let baseWater = weightNum * 35; // 35ml per kg body weight (scientific baseline)
    
    // Activity adjustments
    const activityAdjustments = {
      sedentary: 1.0,
      light: 1.1,
      moderate: 1.3,
      active: 1.5,
      veryActive: 1.8
    };
    
    // Climate adjustments
    const climateAdjustments = {
      cold: 0.9,
      moderate: 1.0,
      hot: 1.3,
      veryHot: 1.5
    };
    
    baseWater *= activityAdjustments[activityLevel as keyof typeof activityAdjustments];
    baseWater *= climateAdjustments[climate as keyof typeof climateAdjustments];
    
    return Math.round(baseWater); // in ml
  };
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: workoutSessions } = useQuery({
    queryKey: ["/api/workout-sessions"],
  });

  const { data: personalRecords } = useQuery({
    queryKey: ["/api/personal-records"],
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const usePotionMutation = useMutation({
    mutationFn: async (potionType: string) => {
      return apiRequest("/api/use-potion", {
        method: "POST",
        body: JSON.stringify({ potionType })
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      
      const isHealing = data.healedAmount !== undefined;
      const isMana = data.restoredAmount !== undefined;
      
      toast({
        title: "Potion Used",
        description: isHealing 
          ? `Healed ${data.healedAmount} HP!`
          : `Restored ${data.restoredAmount} MP!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot Use Potion",
        description: error.message || "You don't have this potion or are already at full capacity",
        variant: "destructive",
      });
    },
  });

  const useStreakFreezeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/use-streak-freeze", {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      if (data.success) {
        toast({
          title: "Streak Freeze Used!",
          description: `Your streak is protected today. Remaining: ${data.remainingFreezes}`,
        });
      } else {
        toast({
          title: "No Streak Freezes",
          description: "You need to complete daily quests to earn streak freezes.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to use streak freeze. Please try again.",
        variant: "destructive",
      });
    },
  });

  const recentSessions = workoutSessions?.slice(0, 3) || [];
  const topRecords = personalRecords?.slice(0, 4) || [];

  // Calculate stats
  const calculateTotalBattles = () => {
    // For now, we'll use the user's battle count from stats
    // This will be updated when we have battle history
    return userStats?.battlesWon || 0;
  };

  // Use streak from user stats instead of calculating
  const streak = userStats?.currentStreak || 0;

  const totalBattles = calculateTotalBattles();
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
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Character Stats</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">Your fitness progression journey</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-foreground text-sm">{userStats?.gold || 0}</span>
              </div>
              <Button 
                onClick={() => setShowCalculators(!showCalculators)}
                size="sm"
                variant="outline"
                className="p-2"
              >
                <Calculator className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => setLocation('/settings')}
                size="sm"
                variant="outline"
                className="p-2"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">

        {/* Calculators */}
        {showCalculators && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calorie & Macro Calculator */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-500" />
                  Calorie & Macro Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
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
                    <label className="text-sm font-medium text-muted-foreground">Weight (kg)</label>
                    <Input
                      type="number"
                      placeholder="70"
                      value={calorieForm.weight}
                      onChange={(e) => setCalorieForm(prev => ({ ...prev, weight: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Height (cm)</label>
                    <Input
                      type="number"
                      placeholder="175"
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
              </CardContent>
            </Card>

            {/* Hydration Calculator */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  Hydration Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Body Weight (kg)</label>
                    <Input
                      type="number"
                      placeholder="70"
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
                        <SelectItem value="light">Light Activity</SelectItem>
                        <SelectItem value="moderate">Moderate Activity</SelectItem>
                        <SelectItem value="active">High Activity</SelectItem>
                        <SelectItem value="veryActive">Very High Activity</SelectItem>
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
                        <SelectItem value="veryHot">Very Hot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {calculateHydration() > 0 && (
                  <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                    <h4 className="font-semibold text-blue-400 mb-2">Your Daily Water Needs</h4>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">{calculateHydration()} ml</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        ≈ {Math.round(calculateHydration() / 250)} glasses (250ml each)
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ≈ {(calculateHydration() / 1000).toFixed(1)} liters
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground border-t border-blue-700 pt-3">
                      <p><strong>Note:</strong> Based on 35ml per kg body weight with adjustments for activity level and climate. 
                      Increase intake during illness, pregnancy, or breastfeeding.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {/* Character Profile */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            {/* Character Info Above Avatar */}
            <div className="text-center mb-6">
              <div className="mb-2">
                <span className="text-sm text-green-300 font-semibold px-3 py-1 bg-green-900/20 rounded-full border border-green-700">
                  &lt;{getLevelTitle(currentLevel)}&gt;
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-6 text-foreground">{userStats?.username || 'Player'}</h3>
            </div>

            {/* 2D Avatar Display */}
            <div className="flex flex-col items-center mb-6">
              <Avatar2D user={userStats} size="lg" />
              
              {/* Character Stats Below Avatar */}
              <div className="text-center mt-6">
                <div className="flex items-center justify-center space-x-6 text-sm font-semibold text-foreground">
                  <span className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-600 mr-1" />
                    Level {currentLevel}
                  </span>
                  <span className="flex items-center">
                    <Flame className="w-4 h-4 text-orange-600 mr-1" />
                    {streak} day streak
                  </span>
                  <span className="flex items-center">
                    <Target className="w-4 h-4 text-red-600 mr-1" />
                    {totalBattles} battles won
                  </span>
                </div>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground">Experience Points</h4>
                <span className="text-sm font-semibold text-muted-foreground">{currentXP} / {xpForNextLevel} XP</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-green-500 to-green-600" style={{ width: `${xpProgress}%` }}></div>
              </div>
              <p className="text-xs font-semibold mt-1 text-muted-foreground">{xpForNextLevel - currentXP} XP to Level {currentLevel + 1}</p>
            </div>

            {/* Health Bar */}
            <div className="mb-6 p-4 bg-red-900/20 rounded-lg border border-red-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span className="font-semibold text-red-400">Health</span>
                </div>
                <span className="text-sm text-red-300">
                  {userStats?.currentHp || 0} / {userStats?.maxHp || 40}
                </span>
              </div>
              <div className="w-full bg-red-900/40 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-400 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((userStats?.currentHp || 0) / (userStats?.maxHp || 1)) * 100))}%`
                  }}
                />
              </div>
              <div className="text-xs text-red-300 mt-2 opacity-80">
                Regenerates 1% of max HP per minute when not in combat
              </div>
              
              {/* Healing Potions */}
              <div className="mt-3 flex space-x-2">
                {['minor_healing', 'major_healing', 'full_healing'].map((potionType) => {
                  const potionNames = {
                    minor_healing: 'Minor',
                    major_healing: 'Major', 
                    full_healing: 'Full'
                  };
                  const quantity = inventory?.find((item: any) => 
                    item.itemName === potionType && item.itemType === 'potion'
                  )?.quantity || 0;
                  
                  return quantity > 0 ? (
                    <Button
                      key={potionType}
                      size="sm"
                      variant="outline"
                      onClick={() => usePotionMutation.mutate(potionType)}
                      disabled={usePotionMutation.isPending}
                      className="text-xs border-red-500 text-red-300 hover:bg-red-900/30"
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      {potionNames[potionType as keyof typeof potionNames]} ({quantity})
                    </Button>
                  ) : null;
                })}
                {(!inventory || inventory.filter((item: any) => item.itemType === 'potion').length === 0) && (
                  <p className="text-xs text-muted-foreground">Visit the shop to buy healing potions</p>
                )}
              </div>
            </div>

            {/* Magic Points Bar */}
            <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-blue-400">Magic Points</span>
                </div>
                <span className="text-sm text-blue-300">
                  {userStats?.currentMp || 0} / {userStats?.maxMp || 20}
                </span>
              </div>
              <div className="w-full bg-blue-900/40 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((userStats?.currentMp || 0) / (userStats?.maxMp || 1)) * 100))}%`
                  }}
                />
              </div>
              <div className="text-xs text-blue-300 mt-2 opacity-80">
                Regenerates 4% per minute when not in combat
              </div>
              
              {/* Mana Potions */}
              <div className="mt-3 flex space-x-2">
                {['minor_mana', 'major_mana', 'full_mana'].map((potionType) => {
                  const potionNames = {
                    minor_mana: 'Minor',
                    major_mana: 'Major',
                    full_mana: 'Full'
                  };
                  const quantity = inventory?.find((item: any) => 
                    item.itemName === potionType && item.itemType === 'potion'
                  )?.quantity || 0;
                  
                  return quantity > 0 ? (
                    <Button
                      key={potionType}
                      size="sm"
                      variant="outline"
                      onClick={() => usePotionMutation.mutate(potionType)}
                      disabled={usePotionMutation.isPending}
                      className="text-xs border-blue-500 text-blue-300 hover:bg-blue-900/30"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      {potionNames[potionType as keyof typeof potionNames]} ({quantity})
                    </Button>
                  ) : null;
                })}
                {(!inventory || inventory.filter((item: any) => 
                  item.itemType === 'potion' && item.itemName.includes('mana')
                ).length === 0) && (
                  <p className="text-xs text-muted-foreground">Visit the shop to buy mana potions</p>
                )}
              </div>
            </div>

            {/* Character Stats - Numerical Display */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-700">
                <Dumbbell className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-300">{userStats?.strength || 0}</div>
                <div className="text-sm font-semibold text-red-400">Strength</div>
              </div>
              <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-700">
                <Heart className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-300">{userStats?.stamina || 0}</div>
                <div className="text-sm font-semibold text-green-400">Stamina</div>
              </div>
              <div className="text-center p-4 bg-purple-900/20 rounded-lg border border-purple-700">
                <Wind className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-300">{userStats?.agility || 0}</div>
                <div className="text-sm font-semibold text-purple-400">Agility</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-primary">{userStats?.gold || 0}</div>
            <div className="text-xs font-semibold text-muted-foreground">Gold Coins</div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-primary">{currentLevel}</div>
            <p className="text-xs font-semibold text-muted-foreground">Current Level</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-400">{streak}</div>
            <p className="text-xs font-semibold text-muted-foreground">Day Streak</p>
            {(userStats?.streakFreezeCount || 0) > 0 && (
              <div className="space-y-1 mt-2">
                <div className="flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-500">{userStats?.streakFreezeCount} Freeze{userStats?.streakFreezeCount !== 1 ? 's' : ''}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => useStreakFreezeMutation.mutate()}
                  disabled={useStreakFreezeMutation.isPending}
                  className="text-xs px-2 py-1 h-6 border-blue-500 text-blue-400 hover:bg-blue-900/30"
                >
                  Use Freeze
                </Button>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <ChartLine className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-primary">{currentXP}</div>
            <p className="text-xs font-semibold text-muted-foreground">Total XP</p>
          </div>
        </div>

        {/* Personal Records */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-foreground">Personal Records</CardTitle>
              <TrendingUp className="w-5 h-5 text-primary" />
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
                  <Card key={record.id} className="bg-secondary border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <h3 className="font-semibold text-foreground">Exercise #{record.exerciseId}</h3>
                      </div>
                      <div className="text-2xl font-bold text-primary">{record.value}</div>
                      <p className="text-sm text-muted-foreground">{record.recordType}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {record.achievedAt ? new Date(record.achievedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


      </div>
    </div>
  );
}