import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { WorkoutVictoryModal } from "@/components/ui/workout-victory-modal";
import { WorkoutLoadingState } from "@/components/ui/loading-spinner";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Play, Pause, Square, Check, Target, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import type { User } from "@shared/schema";

export default function WorkoutSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseData, setExerciseData] = useState<any[]>([]);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [completedSession, setCompletedSession] = useState<any>(null);
  const [perceivedEffort, setPerceivedEffort] = useState(7); // RPE scale 1-10
  const [showRPESelection, setShowRPESelection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);

  const { data: userStats, isLoading: statsLoading } = useQuery<User>({
    queryKey: ["/api/user/stats"],
  });

  // Fetch workout data
  const { data: workout, isLoading: workoutLoading } = useQuery({
    queryKey: ["/api/workouts", id],
    enabled: !!id,
  });

  // Load workout data into exercise state
  useEffect(() => {
    if (workout && (workout as any).exercises) {
      setExerciseData((workout as any).exercises);
    }
  }, [workout]);

  // Page loading effect with minimum delay for tips
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setPageLoaded(true), 100);
    }, 2500); // Increased from 800ms to allow time to read tips
    return () => clearTimeout(loadTimer);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTime(time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  const completeWorkoutMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      return await apiRequest("/api/workout-sessions", {
        method: "POST",
        body: sessionData,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      // Show victory modal with the session data including new achievements
      setCompletedSession(result);
      setShowVictoryModal(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete workout",
        variant: "destructive",
      });
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const toggleSetCompletion = (exerciseIndex: number, setIndex: number) => {
    const setKey = `${exerciseIndex}-${setIndex}`;
    setCompletedSets(prev => ({
      ...prev,
      [setKey]: !prev[setKey]
    }));
  };

  const isSetCompleted = (exerciseIndex: number, setIndex: number) => {
    const setKey = `${exerciseIndex}-${setIndex}`;
    return completedSets[setKey] || false;
  };

  const getCurrentExerciseSets = () => {
    if (currentExerciseIndex >= exerciseData.length) return [];
    const currentExercise = exerciseData[currentExerciseIndex];
    
    // Generate sets based on the exercise data structure
    if (currentExercise.sets && Array.isArray(currentExercise.sets)) {
      return currentExercise.sets;
    } else if (currentExercise.sets && typeof currentExercise.sets === 'number') {
      // If sets is a number, create that many sets with reps/duration from exercise
      return Array.from({ length: currentExercise.sets }, (_, index) => ({
        id: `set-${index}`,
        reps: currentExercise.reps,
        weight: currentExercise.weight,
        duration: currentExercise.duration,
        type: 'R' // Regular set
      }));
    }
    return [];
  };

  const goToNextExercise = () => {
    if (currentExerciseIndex < exerciseData.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const goToPreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-card border-border px-4 py-6 mb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-2">
              <div className="w-8 h-8 bg-muted rounded"></div>
              <div className="w-48 h-8 bg-muted rounded"></div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className="w-20 h-6 bg-muted rounded"></div>
              <div className="w-16 h-8 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-20 h-6 bg-muted rounded"></div>
              <div className="w-24 h-4 bg-muted rounded"></div>
            </div>
            <div className="w-full h-3 bg-muted rounded-full"></div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="w-32 h-6 bg-muted rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4"></div>
              <div className="w-48 h-8 bg-muted rounded mx-auto mb-2"></div>
              <div className="w-64 h-4 bg-muted rounded mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const handleCompleteWorkout = () => {
    setIsActive(false); // Stop the timer
    setShowRPESelection(true); // Show RPE selection before completing
  };

  const handleCompleteWithRPE = () => {
    // Use the actual exercise data from the workout
    const completedExercises = exerciseData.map((exercise) => ({
      exerciseId: exercise.id || 0,
      name: exercise.name,
      category: exercise.category || "strength",
      statTypes: exercise.statTypes || { strength: 1 },
      sets: exercise.sets?.map((set: any) => ({
        reps: set.reps || 0,
        weight: set.weight || 0,
        duration: set.duration || 0,
        completed: true
      })) || []
    }));

    const sessionData = {
      workoutId: parseInt(id || "0"),
      name: (workout as any)?.name || "Workout Session",
      duration: Math.floor(time / 60), // Convert to minutes
      totalVolume: 0, // Will be calculated from exercises
      xpEarned: 0, // Will be calculated server-side
      statsEarned: {},
      perceivedEffort,
      exercises: completedExercises,
    };
    
    setShowRPESelection(false);
    completeWorkoutMutation.mutate(sessionData);
  };

  const handleVictoryClose = () => {
    setShowVictoryModal(false);
    navigate("/workouts");
  };

  const progress = exerciseData.length > 0 ? (currentExerciseIndex / exerciseData.length) * 100 : 0;

  // Show loading screen with tips during initial load
  if (isLoading || statsLoading || workoutLoading) {
    return <WorkoutLoadingState message="Preparing your workout session..." />;
  }

  // Handle case where workout is not found
  if (!workout) {
    return (
      <div className="min-h-screen bg-game-dark text-foreground pb-20 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Workout Not Found</h2>
            <p className="text-muted-foreground mb-4">The workout you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/workouts')}>
              Back to Workouts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-game-dark text-foreground pb-20 transition-opacity duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      
      
      <div className="bg-card border-b border-border px-4 py-6 animate-in fade-in slide-in-from-top-2 duration-400">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-2">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/workouts")}
                className="text-muted-foreground hover:text-foreground p-2 sm:p-3 self-start transition-all duration-200 hover:scale-110 animate-in fade-in slide-in-from-left-2 delay-100"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-200 hover:-translate-x-1" />
              </Button>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground animate-in fade-in slide-in-from-left-4 delay-200">{(workout as any)?.name || "Workout Session"}</h1>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-right animate-in fade-in slide-in-from-right-2 delay-300">
                <div className={`text-xl sm:text-2xl font-bold text-foreground transition-colors duration-300 ${isActive ? 'text-game-primary' : 'text-foreground'}`}>{formatTime(time)}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Duration</div>
              </div>
              <Button 
                onClick={handleStartPause}
                className={`transform transition-all duration-300 hover:scale-110 animate-in fade-in slide-in-from-right-4 delay-400 ${isActive ? "bg-orange-600 hover:bg-orange-700 !text-white" : "bg-game-primary hover:bg-blue-600 !text-white"}`}
                size="sm"
              >
                <div className="flex items-center transition-all duration-200">
                  {isActive ? <Pause className="w-4 h-4 mr-2 !text-white transition-transform duration-200 hover:rotate-12" /> : <Play className="w-4 h-4 mr-2 !text-white transition-transform duration-200 hover:scale-125" />}
                  <span className="!text-white">{isActive ? "Pause" : "Start"}</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Bar */}
        <Card className="bg-card border-border mb-8 transform transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-top-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Progress</h2>
              <span className="text-sm text-muted-foreground animate-in fade-in duration-500 delay-200">
                {currentExerciseIndex} of {exerciseData.length} exercises
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-300 dark:bg-gray-600">
              <div 
                className="h-full bg-game-primary transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Current Exercise Card */}
        <Card className="bg-card border-border mb-8 transform transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 delay-150">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground animate-in fade-in duration-500 delay-300">
                {exerciseData.length > 0 && currentExerciseIndex < exerciseData.length 
                  ? `Exercise ${currentExerciseIndex + 1} of ${exerciseData.length}`
                  : 'Start Your Workout'
                }
              </CardTitle>
              {exerciseData.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousExercise}
                    disabled={currentExerciseIndex === 0}
                    className="p-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextExercise}
                    disabled={currentExerciseIndex >= exerciseData.length - 1}
                    className="p-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {exerciseData.length > 0 && currentExerciseIndex < exerciseData.length ? (
              <div className="space-y-6">
                {/* Exercise Info */}
                <div className="text-center pb-4 border-b border-border">
                  <div className="w-20 h-20 bg-game-primary rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-500 hover:scale-110 animate-in zoom-in delay-400">
                    <Target className="w-10 h-10 !text-white transition-transform duration-300 hover:scale-125" />
                  </div>
                  <h3 className="text-2xl font-bold mb-1 text-foreground animate-in fade-in slide-in-from-bottom-2 delay-500">
                    {exerciseData[currentExerciseIndex]?.name || "Exercise"}
                  </h3>
                  {exerciseData[currentExerciseIndex]?.eachSide && (
                    <p className="text-sm text-orange-400 font-medium mb-2 animate-in fade-in slide-in-from-bottom-2 delay-600">
                      Each side
                    </p>
                  )}
                </div>

                {/* Sets List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground mb-3">Sets</h4>
                  {getCurrentExerciseSets().map((set: any, setIndex: number) => {
                    const isCompleted = isSetCompleted(currentExerciseIndex, setIndex);
                    return (
                      <div
                        key={setIndex}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                          isCompleted 
                            ? 'bg-green-500/10 border-green-500/30 text-foreground' 
                            : 'bg-muted/30 border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {setIndex + 1}
                          </span>
                          <div>
                            <div className="font-medium text-foreground">
                              {set.duration 
                                ? `${set.duration} ${typeof set.duration === 'number' ? 'sec' : ''}`
                                : `${set.reps || 12} reps`
                              }
                              {set.weight && ` @ ${set.weight}lbs`}
                            </div>
                            {set.type && set.type !== 'R' && (
                              <div className="text-xs text-muted-foreground">
                                {set.type === 'W' ? 'Warm-up' : 
                                 set.type === 'D' ? 'Drop set' : 
                                 set.type === 'F' ? 'To failure' : 'Regular'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant={isCompleted ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSetCompletion(currentExerciseIndex, setIndex)}
                          className={`${isCompleted 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20'
                          } transition-all duration-200`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Next Exercise Button */}
                {currentExerciseIndex < exerciseData.length - 1 && (
                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={goToNextExercise}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      Next Exercise
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-game-primary rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-500 hover:scale-110 animate-in zoom-in delay-400">
                  <Play className="w-12 h-12 !text-white transition-transform duration-300 hover:scale-125" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground animate-in fade-in slide-in-from-bottom-2 delay-500">Start Your Workout</h3>
                <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-2 delay-600">Press start to begin tracking your session</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercise List */}
        <Card className="bg-card border-border transform transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 delay-300">
          <CardHeader>
            <CardTitle className="text-foreground animate-in fade-in duration-500 delay-700">Exercise List</CardTitle>
          </CardHeader>
          <CardContent>
            {exerciseData.length > 0 ? (
              <div className="space-y-3 animate-in fade-in delay-800">
                {exerciseData.map((exercise, index) => {
                  const exerciseSets = exercise.sets && Array.isArray(exercise.sets) 
                    ? exercise.sets 
                    : Array.from({ length: exercise.sets || 0 }, (_: any, i: number) => ({ id: `set-${i}` }));
                  
                  const completedSetsCount = exerciseSets.filter((_: any, setIndex: number) => 
                    isSetCompleted(index, setIndex)
                  ).length;
                  
                  const totalSets = exerciseSets.length;
                  const allSetsCompleted = totalSets > 0 && completedSetsCount === totalSets;
                  
                  return (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                        index === currentExerciseIndex 
                          ? 'bg-primary/10 border-primary/30 text-foreground' 
                          : allSetsCompleted
                          ? 'bg-green-500/10 border-green-500/30 text-foreground'
                          : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => setCurrentExerciseIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {allSetsCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                          <div>
                            <h4 className="font-medium">{exercise.name}</h4>
                            {exercise.eachSide && (
                              <p className="text-xs text-orange-400">Each side</p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className={completedSetsCount > 0 ? 'text-green-600 font-medium' : ''}>
                            {completedSetsCount}
                          </span>
                          /{totalSets} sets
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground animate-in fade-in delay-800">
                <p>Exercise list will be populated when workout is loaded</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complete Workout Button */}
        <div className="fixed bottom-6 right-6 animate-in fade-in slide-in-from-bottom-6 delay-1000">
          <Button 
            size="lg"
            onClick={handleCompleteWorkout}
            disabled={completeWorkoutMutation.isPending}
            className="bg-game-success hover:bg-green-600 text-white transform transition-all duration-300 hover:scale-110 hover:shadow-lg"
          >
            <Check className={`w-6 h-6 mr-2 text-white transition-all duration-300 ${completeWorkoutMutation.isPending ? 'animate-spin' : 'hover:scale-125'}`} />
            <span className="transition-all duration-200">
              {completeWorkoutMutation.isPending ? 'Completing...' : 'Complete Workout'}
            </span>
          </Button>
        </div>
      </div>

      {/* Victory Modal */}
      {showVictoryModal && completedSession && (
        <WorkoutVictoryModal
          isOpen={showVictoryModal}
          onClose={handleVictoryClose}
          workoutName={completedSession.name || "Workout"}
          xpGained={completedSession.xpEarned || 0}
          statsGained={completedSession.statsEarned || {}}
          duration={completedSession.duration || 0}
          totalVolume={completedSession.totalVolume}
          validation={completedSession.validation}
          newAchievements={completedSession.newAchievements || []}
          streakBonus={userStats && (userStats.currentStreak ?? 0) >= 3 ? {
            isActive: true,
            streakDays: userStats.currentStreak ?? 0,
            multiplier: 1.5
          } : undefined}
        />
      )}

      {/* RPE Selection Modal */}
      <Dialog open={showRPESelection} onOpenChange={() => setShowRPESelection(false)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Target className="w-5 h-5" />
              Rate Your Effort
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-6">
            <div className="text-center text-foreground">
              <p className="mb-2">How hard did this workout feel?</p>
              <p className="text-sm text-muted-foreground">Scale: 1 (Very Easy) to 10 (Maximum Effort)</p>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-3xl font-bold text-game-primary">{perceivedEffort}</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {perceivedEffort <= 2 ? "Very Easy" :
                   perceivedEffort <= 4 ? "Easy" :
                   perceivedEffort <= 6 ? "Moderate" :
                   perceivedEffort <= 8 ? "Hard" :
                   perceivedEffort <= 9 ? "Very Hard" : "Maximum Effort"}
                </p>
              </div>
              
              <Slider
                value={[perceivedEffort]}
                onValueChange={(value) => setPerceivedEffort(value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Very Easy</span>
                <span>Max Effort</span>
              </div>
            </div>
            
            <Button 
              onClick={handleCompleteWithRPE}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={completeWorkoutMutation.isPending}
            >
              Complete Workout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
