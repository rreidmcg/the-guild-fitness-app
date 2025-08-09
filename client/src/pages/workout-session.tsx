import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { WorkoutVictoryModal } from "@/components/ui/workout-victory-modal";
import { WorkoutSummary } from "../components/WorkoutSummary";
import { WorkoutLoadingState } from "@/components/ui/loading-spinner";
import { EnhancedWorkoutTimer } from "@/components/ui/enhanced-workout-timer";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Play, Pause, Square, Check, Target, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import type { User } from "@shared/schema";
import { getDefaultTrackingFields, isTimeBased } from "@shared/exercise-defaults";

// Import component-specific styles to prevent conflicts
import "../styles/workout-session.css";

export default function WorkoutSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseData, setExerciseData] = useState<any[]>([]);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  const [setMetrics, setSetMetrics] = useState<Record<string, {
    weight?: number;
    reps?: number;
    rpe?: number;
    duration?: number;
  }>>({});
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [completedSession, setCompletedSession] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [perceivedEffort, setPerceivedEffort] = useState(7); // RPE scale 1-10
  const [showRPESelection, setShowRPESelection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  // Simple navigation state for arrow controls
  const [isNavigating, setIsNavigating] = useState(false);

  const { data: userStats, isLoading: statsLoading } = useQuery<User>({
    queryKey: ["/api/user/stats"],
  });

  // Fetch workout data
  const { data: workout, isLoading: workoutLoading } = useQuery({
    queryKey: ["/api/workouts", id],
    enabled: !!id,
  });

  // Fetch exercises data to get names
  const { data: exercises } = useQuery<any[]>({
    queryKey: ["/api/exercises"],
  });

  // Fetch user exercise preferences for default values
  const { data: exercisePreferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ["/api/exercise-preferences"],
    enabled: !!userStats,
  });

  // Load workout data into exercise state with exercise names
  useEffect(() => {
    if (workout && (workout as any).exercises && exercises) {
      const workoutExercises = (workout as any).exercises.map((workoutEx: any) => {
        const exerciseDetails = exercises.find(ex => ex.id === workoutEx.exerciseId);
        
        // Convert sets from number to array for session tracking
        const setsArray = Array.from({ length: workoutEx.sets || 0 }, (_, index) => ({
          id: index,
          reps: workoutEx.reps || 0,
          weight: workoutEx.weight || 0,
          duration: workoutEx.duration || undefined,
          completed: false
        }));
        
        return {
          ...workoutEx,
          name: exerciseDetails?.name || `Exercise ${workoutEx.exerciseId}`,
          category: exerciseDetails?.category || 'strength',
          muscleGroups: exerciseDetails?.muscleGroups || [],
          sets: setsArray // Replace the number with an array
        };
      });
      setExerciseData(workoutExercises);
    }
  }, [workout, exercises]);

  // Initialize set metrics with saved preferences or workout defaults
  useEffect(() => {
    if (exerciseData.length > 0) {
      const initialMetrics: Record<string, any> = {};
      
      exerciseData.forEach((exercise, exerciseIndex) => {
        const savedPreference = (exercisePreferences as any[])?.find(
          pref => pref.exerciseId === exercise.exerciseId
        );
        
        exercise.sets?.forEach((set: any, setIndex: number) => {
          const setKey = `${exerciseIndex}-${setIndex}`;
          
          // Use saved preferences as defaults, fallback to workout prescribed values
          initialMetrics[setKey] = {
            weight: savedPreference?.preferredWeight || exercise.weight || 0,
            reps: savedPreference?.preferredReps || exercise.reps || 0,
            rpe: savedPreference?.preferredRpe || exercise.rpe || 7,
            duration: savedPreference?.preferredDuration || exercise.duration || undefined,
          };
        });
      });
      
      setSetMetrics(initialMetrics);
    }
  }, [exerciseData, exercisePreferences]);

  // Page loading effect with minimum delay for tips
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setPageLoaded(true), 100);
    }, 2500); // Increased from 800ms to allow time to read tips
    return () => clearTimeout(loadTimer);
  }, []);

  // Timer effect and start tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      // Set start time when workout begins
      if (!startTime) {
        setStartTime(new Date());
      }
      interval = setInterval(() => {
        setTime(time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, time, startTime]);

  const saveExercisePreferenceMutation = useMutation({
    mutationFn: async (preference: any) => {
      return await apiRequest("/api/exercise-preferences", {
        method: "POST",
        body: preference,
      });
    },
    onSuccess: (data) => {
      console.log('Exercise preference saved successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-preferences"] });
    },
    onError: (error) => {
      console.error('Failed to save exercise preference:', error);
      toast({
        title: "Warning",
        description: "Failed to save exercise preference",
        variant: "destructive",
      });
    },
  });

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

  const updateSetMetric = (exerciseIndex: number, setIndex: number, field: string, value: number) => {
    console.log('=== updateSetMetric START ===');
    console.log('updateSetMetric called:', { exerciseIndex, setIndex, field, value });
    
    const setKey = `${exerciseIndex}-${setIndex}`;
    setSetMetrics(prev => ({
      ...prev,
      [setKey]: {
        ...prev[setKey],
        [field]: value
      }
    }));

    // Auto-save user preference for this exercise
    const currentExercise = exerciseData[exerciseIndex];
    console.log('Current exercise from exerciseData:', currentExercise);
    console.log('User stats:', userStats);
    console.log('saveExercisePreferenceMutation object:', saveExercisePreferenceMutation);
    
    if (currentExercise && userStats?.id) {
      console.log('CONDITIONS MET - proceeding with preference save');
      const currentMetrics = setMetrics[setKey] || {};
      const newMetrics = { ...currentMetrics, [field]: value };
      
      // Ensure all values are proper numbers or null
      const preferenceData = {
        exerciseId: currentExercise.exerciseId,
        preferredWeight: field === 'weight' ? value : (Number(newMetrics.weight) || null),
        preferredReps: field === 'reps' ? value : (Number(newMetrics.reps) || null),
        preferredRpe: field === 'rpe' ? value : (Number(newMetrics.rpe) || null),
        preferredDuration: field === 'duration' ? value : (Number(newMetrics.duration) || null),
      };
      
      console.log('About to call saveExercisePreferenceMutation.mutate with:', preferenceData);
      
      try {
        saveExercisePreferenceMutation.mutate(preferenceData);
        console.log('saveExercisePreferenceMutation.mutate called successfully');
      } catch (error) {
        console.error('ERROR calling saveExercisePreferenceMutation.mutate:', error);
      }
      
      // Show immediate feedback
      toast({
        title: "Preference Saved",
        description: `${field} updated to ${value}`,
        duration: 1000,
      });
    } else {
      console.log('CONDITIONS NOT MET:');
      console.log('- currentExercise exists:', !!currentExercise);
      console.log('- userStats?.id exists:', !!userStats?.id);
    }
    console.log('=== updateSetMetric END ===');
  };

  const getSetMetric = (exerciseIndex: number, setIndex: number, field: string): number | string => {
    const setKey = `${exerciseIndex}-${setIndex}`;
    const currentExercise = exerciseData[exerciseIndex];
    const metrics = setMetrics[setKey];
    
    if (metrics && metrics[field as keyof typeof metrics] !== undefined) {
      const value = metrics[field as keyof typeof metrics] as number;
      return value;
    }
    
    // Return default from exercise data - use actual prescribed values
    let defaultValue;
    switch (field) {
      case 'weight': defaultValue = currentExercise?.weight || 0; break;
      case 'reps': defaultValue = currentExercise?.reps || 0; break;
      case 'rpe': defaultValue = 7; break; // Default RPE
      case 'duration': defaultValue = currentExercise?.duration || 0; break;
      default: defaultValue = 0;
    }
    return defaultValue;
  };

  const markAllSetsComplete = () => {
    const currentSets = getCurrentExerciseSets();
    currentSets.forEach((_: any, setIndex: number) => {
      const setKey = `${currentExerciseIndex}-${setIndex}`;
      setCompletedSets(prev => ({
        ...prev,
        [setKey]: true
      }));
    });
  };

  const getCurrentSection = () => {
    const currentExercise = exerciseData[currentExerciseIndex];
    return currentExercise?.section || currentExercise?.category || "Workout";
  };

  // Simple arrow navigation handlers
  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0 && !isNavigating) {
      setIsNavigating(true);
      setCurrentExerciseIndex(prev => prev - 1);
      setTimeout(() => setIsNavigating(false), 200);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exerciseData.length - 1 && !isNavigating) {
      setIsNavigating(true);
      setCurrentExerciseIndex(prev => prev + 1);
      setTimeout(() => setIsNavigating(false), 200);
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
    // Use the actual exercise data from the workout with user-entered metrics
    const completedExercises = exerciseData.map((exercise, exerciseIndex) => {
      // Generate sets for this specific exercise
      const exerciseSets = exercise.sets && Array.isArray(exercise.sets) 
        ? exercise.sets 
        : Array.from({ length: exercise.sets || 0 }, (_, i) => ({
            id: `set-${i}`,
            reps: exercise.reps,
            weight: exercise.weight,
            duration: exercise.duration,
            type: 'R'
          }));
          
      const completedSetsData = exerciseSets.map((set: any, setIndex: number) => {
        const setKey = `${exerciseIndex}-${setIndex}`;
        const isCompleted = completedSets[setKey] || false;
        const metrics = setMetrics[setKey] || {};
        
        return {
          reps: metrics.reps || exercise.reps || 10,
          weight: metrics.weight || exercise.weight || 0,
          duration: metrics.duration || exercise.duration || 0,
          rpe: metrics.rpe || 7,
          completed: isCompleted
        };
      });

      return {
        exerciseId: exercise.exerciseId || exercise.id || 0,
        name: exercise.name,
        category: exercise.category || "strength",
        statTypes: exercise.statTypes || { strength: 1 },
        sets: completedSetsData
      };
    });

    // Calculate actual workout duration from start time to now
    const endTime = new Date();
    const actualDuration = startTime 
      ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) // Minutes
      : Math.floor(time / 60); // Fallback to timer if no start time

    const sessionData = {
      workoutId: parseInt(id || "0"),
      name: (workout as any)?.name || "Workout Session",
      duration: actualDuration,
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

  // Show workout summary if completed
  if (showSummary && completedSession && userStats) {
    const leveledUp = completedSession.newLevel && completedSession.newLevel > (userStats?.level || 1);
    
    // Calculate XP to next level
    const currentLevel = leveledUp ? completedSession.newLevel : (userStats?.level || 1);
    const currentXP = leveledUp ? ((userStats?.experience || 0) + completedSession.xpEarned) : (userStats?.experience || 0);
    const xpForNextLevel = Math.floor(100 * Math.pow(1.5, currentLevel));
    const xpToNextLevel = xpForNextLevel - currentXP;
    
    return (
      <WorkoutSummary
        workoutName={(workout as any)?.name || "Workout"}
        xpGained={completedSession.xpEarned || 0}
        currentLevel={currentLevel}
        currentXP={currentXP}
        xpToNextLevel={xpToNextLevel}
        totalXPForNextLevel={xpForNextLevel}
        statsGained={completedSession.statsEarned || {}}
        duration={completedSession.duration || 0}
        totalVolume={completedSession.totalVolume}
        leveledUp={leveledUp}
        newLevel={completedSession.newLevel}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-game-dark text-foreground pb-20 transition-opacity duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      
      
      {/* Minimalist Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/workouts")}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="text-right">
              <div className={`text-lg font-bold text-foreground ${isActive ? 'text-game-primary' : 'text-foreground'}`}>
                {formatTime(time)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-6">

        {/* Enhanced Workout Timer */}
        <div className="mb-8 bg-card border border-border rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground mb-4">Workout Timer</h2>
            <EnhancedWorkoutTimer
              estimatedMinutes={(workout as any)?.estimatedDuration || 15}
              onWorkoutComplete={(finalMinutes) => {
                // This will be called when the timer completes the workout
                setIsActive(false);
                setShowRPESelection(true);
              }}
              shouldStop={!isActive} // Stop the timer when workout is finished
            />
          </div>
        </div>

        {/* Minimalist Exercise Interface */}
        {exerciseData.length > 0 && currentExerciseIndex < exerciseData.length ? (
          <div className="space-y-6">
            {/* Section Title */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground capitalize">
                {getCurrentSection()}
              </h2>
            </div>

            {/* Exercise Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousExercise}
                disabled={currentExerciseIndex === 0}
                className="text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  {currentExerciseIndex + 1} of {exerciseData.length}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextExercise}
                disabled={currentExerciseIndex >= exerciseData.length - 1}
                className="text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Exercise Name */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-foreground">
                {exerciseData[currentExerciseIndex]?.name}
              </h3>
              {exerciseData[currentExerciseIndex]?.restTime && (
                <p className="text-sm text-muted-foreground">
                  Rest: {exerciseData[currentExerciseIndex].restTime}s between sets
                </p>
              )}
            </div>

            {/* WORKOUT SESSION EXERCISE CARD - Simple card with navigation arrows */}
            <div className="workout-session__exercise-card bg-card rounded-lg border border-border overflow-hidden">
                {(() => {
                  const currentExercise = exerciseData[currentExerciseIndex];
                  const defaultFields = getDefaultTrackingFields(currentExercise?.category || 'strength');
                  const isTimeExercise = defaultFields.includes('time') || currentExercise?.duration > 0;
                  const showWeight = defaultFields.includes('weight');
                  const showReps = defaultFields.includes('reps');
                  const showIntensity = defaultFields.includes('RIR') || defaultFields.includes('RPE');
                  
                  // Count visible columns: SET + visible metrics + checkmark
                  let visibleColumns = 2; // SET + checkmark always visible
                  if (isTimeExercise || showWeight) visibleColumns++;
                  if (showReps) visibleColumns++;
                  if (showIntensity) visibleColumns++;
                  
                  const gridClass = `grid-cols-${visibleColumns}`;
                  
                  return (
                    <>
                      {/* Table Header */}
                      <div className={`grid ${gridClass} gap-4 p-4 bg-muted/30 border-b border-border`}>
                        <div className="text-sm font-medium text-muted-foreground">SET</div>
                        {(isTimeExercise || showWeight) && (
                          <div className="text-sm font-medium text-muted-foreground">
                            {isTimeExercise ? 'SEC' : 'LB'}
                          </div>
                        )}
                        {showReps && (
                          <div className="text-sm font-medium text-muted-foreground">REPS</div>
                        )}
                        {showIntensity && (
                          <div className="text-sm font-medium text-muted-foreground">RIR</div>
                        )}
                        <div className="text-sm font-medium text-muted-foreground text-center">✓</div>
                      </div>

                      {/* Sets Rows */}
                      <div className="divide-y divide-border">
                        {getCurrentExerciseSets().map((set: any, setIndex: number) => {
                          const isCompleted = isSetCompleted(currentExerciseIndex, setIndex);
                          
                          return (
                            <div key={setIndex} className={`grid ${gridClass} gap-4 p-4 items-center`}>
                              {/* Set Number */}
                              <div className="text-sm">
                                {setIndex + 1}
                              </div>
                            
                            {/* Weight/Duration - Only show if needed */}
                            {(isTimeExercise || showWeight) && (
                              <div>
                                {isTimeExercise ? (
                                  <Input
                                    type="number"
                                    value={getSetMetric(currentExerciseIndex, setIndex, 'duration')}
                                    onChange={(e) => updateSetMetric(currentExerciseIndex, setIndex, 'duration', parseInt(e.target.value) || 0)}
                                    className="h-8 w-full text-center border border-input bg-background text-sm focus:ring-2 focus:ring-ring"
                                    min="0"
                                    placeholder={currentExercise.duration?.toString() || "0"}
                                  />
                                ) : (
                                  <Input
                                    type="number"
                                    value={getSetMetric(currentExerciseIndex, setIndex, 'weight') || ''}
                                    onChange={(e) => {
                                      const newValue = e.target.value === '' ? 0 : parseInt(e.target.value);
                                      updateSetMetric(currentExerciseIndex, setIndex, 'weight', newValue);
                                    }}
                                    className="h-8 w-full text-center border border-input bg-background text-sm focus:ring-2 focus:ring-ring"
                                    min="0"
                                    step="1"
                                    placeholder={currentExercise.weight?.toString() || "0"}
                                  />
                                )}
                              </div>
                            )}
                            
                            {/* Reps - Only show if needed */}
                            {showReps && (
                              <div>
                                <Input
                                  type="number"
                                  value={getSetMetric(currentExerciseIndex, setIndex, 'reps') || ''}
                                  onChange={(e) => {
                                    const newValue = e.target.value === '' ? 0 : parseInt(e.target.value);
                                    updateSetMetric(currentExerciseIndex, setIndex, 'reps', newValue);
                                  }}
                                  className="h-8 w-full text-center border border-input bg-background text-sm focus:ring-2 focus:ring-ring"
                                  min="1"
                                  step="1"
                                  placeholder={currentExercise.reps?.toString() || "0"}
                                />
                              </div>
                            )}
                            
                            {/* RIR - Only show if needed */}
                            {showIntensity && (
                              <div>
                                <Input
                                  type="number"
                                  value={getSetMetric(currentExerciseIndex, setIndex, 'rpe')}
                                  onChange={(e) => updateSetMetric(currentExerciseIndex, setIndex, 'rpe', parseInt(e.target.value) || 0)}
                                  className="h-8 w-full text-center border border-input bg-background text-sm focus:ring-2 focus:ring-ring"
                                  min="0"
                                  max="10"
                                  placeholder="3"
                                />
                              </div>
                            )}
                            
                            {/* Completion Checkbox */}
                            <div className="flex justify-center">
                              <Button
                                variant={isCompleted ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleSetCompletion(currentExerciseIndex, setIndex)}
                                className={`w-8 h-8 p-0 ${
                                  isCompleted 
                                    ? "bg-green-600 hover:bg-green-700 border-green-600" 
                                    : "border-border hover:bg-muted"
                                }`}
                              >
                                {isCompleted && <Check className="h-4 w-4 text-white" />}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>



            {/* Navigation Arrows */}
            <div className="flex items-center justify-center gap-6 pt-4 pb-2">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePreviousExercise}
                disabled={currentExerciseIndex === 0 || isNavigating}
                className="h-12 w-12 rounded-full p-0 border-2"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <div className="text-center min-w-[100px]">
                <div className="text-lg font-semibold">
                  {currentExerciseIndex + 1} / {exerciseData.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Exercise
                </div>
              </div>
              
              <Button
                variant="outline"
                size="lg"
                onClick={handleNextExercise}
                disabled={currentExerciseIndex === exerciseData.length - 1 || isNavigating}
                className="h-12 w-12 rounded-full p-0 border-2"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Finish Workout Button - Show on last exercise */}
            {currentExerciseIndex === exerciseData.length - 1 && (
              <div className="pt-6">
                <Button
                  onClick={() => setShowFinishConfirmation(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold"
                  size="lg"
                >
                  <Check className="w-6 h-6 mr-2" />
                  Finish Workout
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                variant="ghost"
                onClick={markAllSetsComplete}
                className="w-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Mark All Sets Complete
              </Button>
            </div>
          </div>
        ) : exerciseData.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-game-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-12 h-12 !text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-foreground">Start Your Workout</h3>
            <p className="text-muted-foreground">Press start to begin tracking your session</p>
          </div>
        ) : (
          <div className="text-center py-12 space-y-6">
            <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">All Exercises Complete!</h3>
              <p className="text-muted-foreground mb-6">You've finished all exercises in this workout</p>
            </div>
            
            {/* Show Complete Workout Button prominently when all exercises are done */}
            <Button 
              size="lg"
              onClick={handleCompleteWorkout}
              disabled={completeWorkoutMutation.isPending}
              className="bg-game-success hover:bg-green-600 text-white py-4 px-8 rounded-full text-lg"
            >
              <Check className={`w-6 h-6 mr-2 text-white ${completeWorkoutMutation.isPending ? 'animate-spin' : ''}`} />
              {completeWorkoutMutation.isPending ? 'Completing...' : 'Complete Workout & Get XP'}
            </Button>
          </div>
        )}

        {/* Complete Workout Button - Only show during exercises, not after completion */}
        {currentExerciseIndex < exerciseData.length && (
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
        )}
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

      {/* Finish Workout Confirmation Modal */}
      <Dialog open={showFinishConfirmation} onOpenChange={setShowFinishConfirmation}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Finish Workout?
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-6">
            <div className="text-center text-foreground">
              <p className="mb-2">Are you ready to complete this workout?</p>
              <p className="text-sm text-muted-foreground">
                You'll earn XP and level up your character stats!
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFinishConfirmation(false)}
                className="flex-1"
              >
                Continue Training
              </Button>
              <Button
                onClick={() => {
                  setShowFinishConfirmation(false);
                  handleCompleteWorkout();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={completeWorkoutMutation.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                {completeWorkoutMutation.isPending ? 'Finishing...' : 'Finish & Get XP'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
