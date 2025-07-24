import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WorkoutCard } from "@/components/ui/workout-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dumbbell, 
  Plus, 
  Play, 
  Calendar,
  TrendingUp,
  Droplets,
  Footprints,
  UtensilsCrossed,
  Star,
  Settings,
  Gift,
  Coins,
  Shield
} from "lucide-react";

export default function Workouts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workoutSessions } = useQuery({
    queryKey: ["/api/workout-sessions"],
  });

  const { data: workoutPrograms } = useQuery({
    queryKey: ["/api/workout-programs"],
  });

  const { data: dailyProgress } = useQuery({
    queryKey: ["/api/daily-progress"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const completeDailyQuestMutation = useMutation({
    mutationFn: async (questType: 'hydration' | 'steps' | 'protein') => {
      return apiRequest("/api/complete-daily-quest", {
        method: "POST",
        body: { questType },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      let message = "Quest Completed!";
      let description = "Keep going to complete all daily quests for rewards!";
      
      if (data.xpAwarded && data.streakFreezeAwarded) {
        message = "All Daily Quests Complete!";
        description = "You earned 5 XP and a Streak Freeze!";
      } else if (data.xpAwarded) {
        message = "All Daily Quests Complete!";
        description = "You earned 5 XP! (Already have max Streak Freezes)";
      } else if (data.streakFreezeAwarded) {
        message = "All Daily Quests Complete!";
        description = "You earned a Streak Freeze!";
      }
      
      toast({
        title: message,
        description: description,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete quest. Please try again.",
        variant: "destructive",
      });
    },
  });

  const recentSessions = workoutSessions?.slice(0, 5) || [];
  const programs = workoutPrograms || [];

  const handleProgramClick = (program: any) => {
    toast({
      title: "Program Selected",
      description: `Opening ${program.name} program details...`,
    });
    // Navigate to workout builder
    setLocation("/workout-builder");
  };

  const handleStartProgram = (program: any) => {
    toast({
      title: "Starting Workout",
      description: `Beginning ${program.name} workout session...`,
    });
    // Navigate to workout session with program ID
    setLocation(`/workout-session/${program.id}`);
  };

  const handleQuestCheck = (questType: 'hydration' | 'steps' | 'protein', checked: boolean) => {
    if (checked && !dailyProgress?.[questType]) {
      completeDailyQuestMutation.mutate(questType);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Quests</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Complete your daily adventures</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setLocation("/workout-builder")}
                size="sm"
                className="bg-game-primary hover:bg-blue-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Workout
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

        {/* Daily Quest Rewards */}
        <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-4">
              <Gift className="w-6 h-6 text-yellow-500" />
              <div className="text-center">
                <h3 className="font-bold text-yellow-400">Daily Quest Completion Rewards</h3>
                <div className="flex items-center justify-center space-x-4 mt-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-foreground">+5 XP</span>
                  </div>
                  <span className="text-muted-foreground">+</span>
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="text-foreground">1 Streak Freeze</span>
                  </div>
                  <span className="text-muted-foreground">(max 2)</span>
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
                {dailyProgress?.hydration && dailyProgress?.steps && dailyProgress?.protein
                  ? dailyProgress?.xpAwarded 
                    ? "Complete! Rewards Earned"
                    : "Complete! Processing rewards..."
                  : "Complete all quests for rewards"
                }
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Hydration Quest */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 cursor-help">
                    <Checkbox
                      checked={dailyProgress?.hydration || false}
                      onCheckedChange={(checked) => handleQuestCheck('hydration', checked as boolean)}
                      disabled={dailyProgress?.hydration || completeDailyQuestMutation.isPending}
                      className="border-blue-500 data-[state=checked]:bg-blue-500"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Droplets className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-foreground">Stay Hydrated</p>
                        <p className="text-xs text-muted-foreground">Drink 8 glasses of water</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>+5 XP on completion</span>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Steps Quest */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 cursor-help">
                    <Checkbox
                      checked={dailyProgress?.steps || false}
                      onCheckedChange={(checked) => handleQuestCheck('steps', checked as boolean)}
                      disabled={dailyProgress?.steps || completeDailyQuestMutation.isPending}
                      className="border-green-500 data-[state=checked]:bg-green-500"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Footprints className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-foreground">Daily Steps</p>
                        <p className="text-xs text-muted-foreground">Walk 7,500 steps</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>+5 XP on completion</span>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Protein Quest */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 cursor-help">
                    <Checkbox
                      checked={dailyProgress?.protein || false}
                      onCheckedChange={(checked) => handleQuestCheck('protein', checked as boolean)}
                      disabled={dailyProgress?.protein || completeDailyQuestMutation.isPending}
                      className="border-orange-500 data-[state=checked]:bg-orange-500"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-foreground">Protein Goal</p>
                        <p className="text-xs text-muted-foreground">Hit your protein target</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>+5 XP on completion</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        {/* Recent Workouts */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-foreground">Recent Sessions</CardTitle>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => setLocation('/workout-builder')}
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
              recentSessions.map((session) => (
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
                {programs.map((program) => (
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
                {recentSessions.reduce((total, session) => total + (session.duration || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Minutes this week</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Volume</h3>
              <div className="text-3xl font-bold text-game-warning mb-1">
                {recentSessions.reduce((total, session) => total + (session.totalVolume || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">lbs lifted this week</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}