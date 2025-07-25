import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WorkoutCard } from "@/components/ui/workout-card";
import { useToast } from "@/hooks/use-toast";
import { CurrencyHeader } from "@/components/ui/currency-header";
import { apiRequest } from "@/lib/queryClient";
import type { WorkoutSession, WorkoutProgram, DailyProgress, User } from "@shared/schema";
import { 
  Dumbbell, 
  Plus, 
  Play, 
  Calendar,
  TrendingUp,
  Droplets,
  Footprints,
  UtensilsCrossed,
  Moon,
  Star,
  Settings,
  Gift,
  Coins,
  Shield,
  Calculator
} from "lucide-react";

export default function Workouts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculator state
  const [showCalculators, setShowCalculators] = useState(false);
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

  const { data: workoutSessions } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workout-sessions"],
  });

  const { data: workoutPrograms } = useQuery<WorkoutProgram[]>({
    queryKey: ["/api/workout-programs"],
  });

  const { data: dailyProgress } = useQuery<DailyProgress>({
    queryKey: ["/api/daily-progress"],
  });

  const { data: userStats } = useQuery<User>({
    queryKey: ["/api/user/stats"],
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
      hot: 1.2,
      veryHot: 1.4
    };
    
    const activityMultiplier = activityAdjustments[activityLevel as keyof typeof activityAdjustments] || 1.0;
    const climateMultiplier = climateAdjustments[climate as keyof typeof climateAdjustments] || 1.0;
    
    return Math.round(baseWater * activityMultiplier * climateMultiplier);
  };

  const toggleDailyQuestMutation = useMutation({
    mutationFn: async ({ questType, completed }: { questType: 'hydration' | 'steps' | 'protein' | 'sleep'; completed: boolean }) => {
      return apiRequest<{ 
        completed: boolean; 
        xpAwarded?: boolean; 
        streakFreezeAwarded?: boolean; 
        xpRemoved?: boolean; 
        streakFreezeRemoved?: boolean 
      }>("/api/toggle-daily-quest", {
        method: "POST",
        body: { questType, completed },
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      if (variables.completed) {
        // Quest completed
        let message = "Quest Completed!";
        let description = "Keep going to complete all daily quests for rewards!";
        
        if (data.xpAwarded && data.streakFreezeAwarded) {
          message = "Rewards Earned!";
          description = "You earned 5 XP and a Streak Freeze!";
        } else if (data.xpAwarded) {
          message = "All Daily Quests Complete!";
          description = "You earned 5 XP! (Already have max Streak Freezes)";
        } else if (data.streakFreezeAwarded) {
          message = "2+ Quests Complete!";
          description = "You earned a Streak Freeze!";
        }
        
        toast({
          title: message,
          description: description,
        });
      } else {
        // Quest unchecked
        let message = "Quest Unchecked";
        let description = "Quest marked as incomplete.";
        
        if (data.xpRemoved && data.streakFreezeRemoved) {
          message = "Rewards Removed";
          description = "5 XP and 1 Streak Freeze have been removed.";
        } else if (data.xpRemoved) {
          message = "XP Removed";
          description = "5 XP has been removed for uncompleting all quests.";
        } else if (data.streakFreezeRemoved) {
          message = "Streak Freeze Removed";
          description = "1 Streak Freeze has been removed.";
        }
        
        toast({
          title: message,
          description: description,
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quest. Please try again.",
        variant: "destructive",
      });
    },
  });

  const recentSessions = (workoutSessions || []).slice(0, 5);
  const programs = workoutPrograms || [];

  const handleProgramClick = (program: WorkoutProgram) => {
    toast({
      title: "Program Selected",
      description: `Opening ${program.name} program details...`,
    });
    // Navigate to workout builder
    navigate("/workout-builder");
  };

  const handleStartProgram = (program: WorkoutProgram) => {
    toast({
      title: "Starting Workout",
      description: `Beginning ${program.name} workout session...`,
    });
    // Navigate to workout session with program ID
    navigate(`/workout-session/${program.id}`);
  };

  const handleQuestCheck = (questType: 'hydration' | 'steps' | 'protein' | 'sleep', checked: boolean) => {
    // Only update if the state is actually changing
    if (checked !== dailyProgress?.[questType]) {
      toggleDailyQuestMutation.mutate({ questType, completed: checked });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <CurrencyHeader />
      
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Workouts & Daily Quests</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Train your character and complete daily challenges</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowCalculators(!showCalculators)}
                size="sm"
                variant="outline"
                className="p-2"
              >
                <Calculator className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => navigate("/workout-builder")}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-blue-100"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Workout
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

        {/* Daily Quest Rewards */}
        <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-4">
              <Gift className="w-6 h-6 text-yellow-500" />
              <div className="text-center">
                <h3 className="font-bold text-yellow-400">Daily Quest Rewards</h3>
                <div className="flex items-center justify-center space-x-6 mt-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="text-foreground">2+ Quests: Streak Freeze</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-foreground">All 4: +5 XP</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Quests */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Daily Quests
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {dailyProgress?.hydration && dailyProgress?.steps && dailyProgress?.protein && dailyProgress?.sleep
                  ? dailyProgress?.xpAwarded 
                    ? "All Complete! Rewards Earned"
                    : "All Complete! Processing rewards..."
                  : [dailyProgress?.hydration, dailyProgress?.steps, dailyProgress?.protein, dailyProgress?.sleep].filter(Boolean).length >= 2
                    ? dailyProgress?.streakFreezeAwarded
                      ? "2+ Complete! Streak Freeze Earned"
                      : "2+ Complete! Processing rewards..."
                    : ""
                }
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Hydration Quest */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 cursor-help">
                    <Checkbox
                      checked={dailyProgress?.hydration || false}
                      onCheckedChange={(checked) => handleQuestCheck('hydration', checked as boolean)}
                      disabled={toggleDailyQuestMutation.isPending}
                      className="border-blue-500 data-[state=checked]:bg-blue-500"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Droplets className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Stay Hydrated</p>
                        <p className="text-xs text-muted-foreground">Drink 8 glasses of water</p>
                      </div>
                      <div className="text-xs text-blue-500 font-medium">+5 XP</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Check/uncheck to mark quest completion status</span>
                </TooltipContent>
              </Tooltip>

              {/* Steps Quest */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 cursor-help">
                    <Checkbox
                      checked={dailyProgress?.steps || false}
                      onCheckedChange={(checked) => handleQuestCheck('steps', checked as boolean)}
                      disabled={toggleDailyQuestMutation.isPending}
                      className="border-green-500 data-[state=checked]:bg-green-500"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Footprints className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Daily Steps</p>
                        <p className="text-xs text-muted-foreground">Walk 7,500 steps</p>
                      </div>
                      <div className="text-xs text-green-500 font-medium">+5 XP</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Check/uncheck to mark quest completion status</span>
                </TooltipContent>
              </Tooltip>

              {/* Protein Quest */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 cursor-help">
                    <Checkbox
                      checked={dailyProgress?.protein || false}
                      onCheckedChange={(checked) => handleQuestCheck('protein', checked as boolean)}
                      disabled={toggleDailyQuestMutation.isPending}
                      className="border-orange-500 data-[state=checked]:bg-orange-500"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Protein Goal</p>
                        <p className="text-xs text-muted-foreground">Hit your protein target</p>
                      </div>
                      <div className="text-xs text-orange-500 font-medium">+5 XP</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Check/uncheck to mark quest completion status</span>
                </TooltipContent>
              </Tooltip>

              {/* Sleep Quest */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 cursor-help">
                    <Checkbox
                      checked={dailyProgress?.sleep || false}
                      onCheckedChange={(checked) => handleQuestCheck('sleep', checked as boolean)}
                      disabled={toggleDailyQuestMutation.isPending}
                      className="border-purple-500 data-[state=checked]:bg-purple-500"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Moon className="w-5 h-5 text-purple-500" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Sleep Well</p>
                        <p className="text-xs text-muted-foreground">Get 7+ hours of sleep</p>
                      </div>
                      <div className="text-xs text-purple-500 font-medium">+5 XP</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Check/uncheck to mark quest completion status</span>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        {/* Recent Workouts */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground mb-3">Recent Sessions</CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => navigate('/workout-builder')}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Workout
              </Button>
              <Button variant="ghost" className="text-game-primary hover:text-blue-400">
                <TrendingUp className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">No workouts yet</h3>
                <p className="mb-6">Start your fitness journey today! Use the "New Workout" button above.</p>
              </div>
            ) : (
              recentSessions.map((session: WorkoutSession) => (
                <WorkoutCard key={session.id} session={session} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Workout Programs */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">Workout Programs</CardTitle>
          </CardHeader>
          <CardContent>
            {programs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No workout programs available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programs.map((program: WorkoutProgram) => (
                  <Card 
                    key={program.id} 
                    className="bg-card border-border hover:border-game-primary transition-colors cursor-pointer"
                    onClick={() => handleProgramClick(program)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">{program.name}</h3>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-game-primary hover:bg-game-primary/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartProgram(program);
                            }}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{program.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="bg-game-primary/20 text-game-primary px-2 py-1 rounded">{program.difficultyLevel}</span>
                        <span>{program.durationWeeks} weeks</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">This Week</h3>
              <div className="text-3xl font-bold text-game-primary mb-1">
                {recentSessions.length}
              </div>
              <p className="text-xs text-muted-foreground">Workouts completed</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Time</h3>
              <div className="text-3xl font-bold text-game-success mb-1">
                {recentSessions.reduce((total: number, session: WorkoutSession) => total + (session.duration || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Minutes this week</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Volume</h3>
              <div className="text-3xl font-bold text-game-warning mb-1">
                {recentSessions.reduce((total: number, session: WorkoutSession) => total + (session.totalVolume || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">lbs lifted this week</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}