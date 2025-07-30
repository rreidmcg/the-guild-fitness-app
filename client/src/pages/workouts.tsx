import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WorkoutCard } from "@/components/ui/workout-card";
import { ParallaxBackground } from "@/components/ui/parallax-background";
import { useToast } from "@/hooks/use-toast";

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
  Sparkles,
  Snowflake,
  Brain,
  Crown
} from "lucide-react";
import { Link } from "wouter";

export default function Workouts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workoutSessions } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workout-sessions"],
  });

  const { data: workoutPrograms } = useQuery<WorkoutProgram[]>({
    queryKey: ["/api/workout-programs"],
  });

  const { data: customWorkouts } = useQuery({
    queryKey: ["/api/workouts"],
  });

  const { data: dailyProgress } = useQuery<DailyProgress>({
    queryKey: ["/api/daily-progress"],
  });

  const { data: userStats } = useQuery<User>({
    queryKey: ["/api/user/stats"],
  });

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
        // Quest completed - always earn 5 XP per quest (with potential streak bonus)
        const hasStreakBonus = userStats && userStats.currentStreak >= 3;
        const baseXp = hasStreakBonus ? Math.floor(5 * 1.5) : 5;
        
        let message = "Quest Completed!";
        let description = `You earned ${baseXp} XP!${hasStreakBonus ? ` (1.5x streak bonus!)` : ''}`;
        
        if (data.xpAwarded && data.streakFreezeAwarded) {
          const totalXp = hasStreakBonus ? Math.floor(25 * 1.5) : 25;
          message = "All Daily Quests Complete!";
          description = `You earned a total of ${totalXp} XP and a Streak Freeze!${hasStreakBonus ? ` (1.5x streak bonus!)` : ''}`;
        } else if (data.xpAwarded) {
          const totalXp = hasStreakBonus ? Math.floor(25 * 1.5) : 25;
          message = "All Daily Quests Complete!";
          description = `You earned a total of ${totalXp} XP!${hasStreakBonus ? ` (1.5x streak bonus!)` : ''} (Already have max Streak Freezes)`;
        } else if (data.streakFreezeAwarded) {
          message = "2+ Quests Complete!";
          description = `You earned ${baseXp} XP and a Streak Freeze!${hasStreakBonus ? ` (1.5x streak bonus!)` : ''}`;
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
  const myCustomWorkouts = customWorkouts || [];
  const myPurchasedPrograms = programs.filter((program: any) => program.isPurchased);
  // Filter out owned programs from the main programs list
  const availablePrograms = programs.filter((program: any) => !program.isPurchased);

  const handleProgramClick = (program: WorkoutProgram) => {
    toast({
      title: "Program Selected",
      description: `Opening ${program.name} program details...`,
    });
    // Navigate to workout programs page to see program details
    navigate("/workout-programs");
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
    <ParallaxBackground>
      <div className="min-h-screen bg-background text-foreground pb-20">
      
      
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Quests</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Complete your daily adventures</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => navigate("/workout-programs")}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Star className="w-4 h-4 mr-1" />
                Programs
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

        {/* Daily Quest Rewards */}
        <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-700">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Gift className="w-6 h-6 text-yellow-500" />
                <h3 className="font-bold text-yellow-400">Daily Quest Rewards</h3>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-foreground">Each Quest: +5 XP</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Snowflake className="w-4 h-4 text-blue-500" />
                    <span className="text-foreground">2+ Quests: Streak Freeze</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-orange-500" />
                    <span className="text-foreground">All 4: +5 Bonus XP</span>
                  </div>
                </div>
                {userStats && userStats.currentStreak >= 3 && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-purple-900/30 rounded border border-purple-600">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-300 text-xs font-semibold">
                      {userStats.currentStreak} day streak: 1.5x XP bonus active!
                    </span>
                  </div>
                )}
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

        {/* My Programs */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              My Programs
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button 
                onClick={() => navigate("/workout-programs")}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white flex-1 sm:flex-none"
              >
                <Star className="w-4 h-4 mr-1" />
                Browse
              </Button>
              <Button 
                onClick={() => navigate('/workout-builder')}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {myPurchasedPrograms.length === 0 && myCustomWorkouts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">No programs yet</h3>
                <p className="mb-6">Purchase professional programs or create your own custom workouts to get started.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button 
                    onClick={() => navigate("/workout-programs")}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Browse
                  </Button>
                  <Button 
                    onClick={() => navigate('/workout-builder')}
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Purchased Programs */}
                {myPurchasedPrograms.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" />
                      Purchased Programs ({myPurchasedPrograms.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myPurchasedPrograms.map((program: any) => (
                        <Card 
                          key={program.id} 
                          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-400/40 transition-colors cursor-pointer"
                          onClick={() => handleProgramClick(program)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-amber-500" />
                                <h3 className="font-semibold text-foreground">{program.name}</h3>
                                <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-medium">
                                  Owned
                                </span>
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartProgram(program);
                                }}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Start
                              </Button>
                            </div>
                            <p className="text-sm text-foreground/80 mb-3">{program.description}</p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="bg-amber-500/20 text-amber-600 px-2 py-1 rounded font-medium">{program.difficultyLevel}</span>
                              <span className="text-foreground/70 font-medium">{program.durationWeeks} weeks</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Workouts */}
                {myCustomWorkouts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-blue-500" />
                      Custom Workouts ({myCustomWorkouts.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myCustomWorkouts.map((workout: any) => (
                        <Card 
                          key={workout.id} 
                          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 hover:border-blue-400/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/workout-session/${workout.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Dumbbell className="w-4 h-4 text-blue-500" />
                                <h3 className="font-semibold text-foreground">{workout.name}</h3>
                                <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded text-xs font-medium">
                                  Custom
                                </span>
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/workout-session/${workout.id}`);
                                }}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Start
                              </Button>
                            </div>
                            <p className="text-sm text-foreground/80 mb-3">{workout.description || "Custom workout routine"}</p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-foreground/70 font-medium">
                                {workout.exercises?.length || 0} exercises
                              </span>
                              <span className="text-foreground/70 font-medium">
                                ~{workout.estimatedDuration || 30} min
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Programs */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">Workout Programs</CardTitle>
          </CardHeader>
          <CardContent>
            {availablePrograms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">{programs.length === 0 ? "No workout programs available yet." : "All available programs are already owned!"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePrograms.map((program: WorkoutProgram) => (
                  <Card 
                    key={program.id} 
                    className="bg-card border-border hover:border-game-primary transition-colors cursor-pointer"
                    onClick={() => handleProgramClick(program)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{program.name}</h3>
                          {program.name === "Novice Program" && (
                            <span className="bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-0.5 rounded text-xs font-medium">
                              Free
                            </span>
                          )}
                        </div>
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
                      <p className="text-sm text-foreground/80 mb-3">{program.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="bg-game-primary/20 text-game-primary px-2 py-1 rounded font-medium">{program.difficultyLevel}</span>
                        <span className="text-foreground/70 font-medium">{program.durationWeeks} weeks</span>
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

        {/* Recent Sessions - Moved to bottom */}
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
      </div>
      </div>
    </ParallaxBackground>
  );
}