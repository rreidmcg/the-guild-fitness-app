import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Pause, Square, Timer, Check, Dumbbell, Zap } from "lucide-react";
import { useNavigate } from "@/hooks/use-navigate";
import { WorkoutVictoryModal } from "@/components/ui/workout-victory-modal";
import { useToast } from "@/hooks/use-toast";

interface WorkoutExercise {
  exerciseId: number;
  name: string;
  category: string;
  sets: Array<{
    id: number;
    reps: number;
    weight: number;
    duration?: number;
    completed: boolean;
  }>;
  restTime: number;
  section?: string;
  order: number;
}

interface CompletedSession {
  name: string;
  xpEarned: number;
  statsEarned: Record<string, number>;
  duration: number;
  totalVolume?: number;
  validation?: any;
  newAchievements?: any[];
}

export default function WorkoutSession() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseData, setExerciseData] = useState<WorkoutExercise[]>([]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [completedSets, setCompletedSets] = useState<Record<string, Record<number, boolean>>>({});
  const [setMetrics, setSetMetrics] = useState<Record<string, Record<number, { reps?: number; weight?: number; duration?: number }>>>({});
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [completedSession, setCompletedSession] = useState<CompletedSession | null>(null);

  // Fetch workout data
  const { data: workout, isLoading: workoutLoading } = useQuery({
    queryKey: [`/api/workouts/${workoutId}`],
    enabled: !!workoutId,
  });

  // Fetch exercise library
  const { data: exercises, isLoading: exercisesLoading } = useQuery<any[]>({
    queryKey: ['/api/exercises'],
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Initialize workout data
  useEffect(() => {
    if (workout && exercises) {
      const workoutExercises = (workout as any).exercises.map((workoutEx: any) => {
        const exerciseDetails = exercises?.find((ex: any) => ex.id === workoutEx.exerciseId);
        
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
          sets: setsArray
        };
      });
      
      setExerciseData(workoutExercises);
      setCurrentExerciseIndex(0);
      
      // Auto-start timer
      setIsTimerRunning(true);
      setStartTime(new Date());
    }
  }, [workout, exercises]);

  // Complete workout mutation
  const completeWorkoutMutation = useMutation({
    mutationFn: async () => {
      const duration = Math.floor(timer / 60); // Convert to minutes
      const workoutLog = {
        workoutId: parseInt(workoutId || "0"),
        name: (workout as any)?.name || "Workout",
        duration,
        exercises: exerciseData.map(exercise => ({
          exerciseId: exercise.exerciseId,
          sets: exercise.sets.map(set => ({
            reps: setMetrics[exercise.exerciseId]?.[set.id]?.reps || set.reps,
            weight: setMetrics[exercise.exerciseId]?.[set.id]?.weight || set.weight,
            duration: setMetrics[exercise.exerciseId]?.[set.id]?.duration || set.duration,
            completed: completedSets[exercise.exerciseId]?.[set.id] || false
          }))
        }))
      };

      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutLog),
      });

      if (!response.ok) {
        throw new Error('Failed to complete workout');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setCompletedSession({
        name: (workout as any)?.name || "Workout",
        xpEarned: data.xpGained || 0,
        statsEarned: data.statsEarned || {},
        duration: Math.floor(timer / 60),
        totalVolume: data.totalVolume,
        validation: data.validation,
        newAchievements: data.newAchievements || []
      });
      setShowVictoryModal(true);
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete workout. Please try again.",
        variant: "destructive",
      });
    }
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setTimer(0);
    setIsTimerRunning(false);
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentExerciseIndex < exerciseData.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      // Finish workout
      completeWorkoutMutation.mutate();
    }
  };

  const handleSwipeLeft = () => {
    handleNext();
  };

  const handleSwipeRight = () => {
    handlePrevious();
  };

  const updateSetMetrics = (exerciseId: number, setId: number, field: 'reps' | 'weight' | 'duration', value: number) => {
    setSetMetrics(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [setId]: {
          ...prev[exerciseId]?.[setId],
          [field]: value
        }
      }
    }));
  };

  const toggleSetCompletion = (exerciseId: number, setId: number) => {
    setCompletedSets(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [setId]: !prev[exerciseId]?.[setId]
      }
    }));
  };

  const handleVictoryClose = () => {
    setShowVictoryModal(false);
    navigate('/workouts');
  };

  if (workoutLoading || exercisesLoading || exerciseData.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded mb-6"></div>
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  const currentExercise = exerciseData[currentExerciseIndex];
  const totalExercises = exerciseData.length;
  const progress = ((currentExerciseIndex + 1) / totalExercises) * 100;

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/workouts')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground">{(workout as any)?.name}</h1>
            <p className="text-sm text-muted-foreground">Workout Session</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-primary">
              {formatTime(timer)}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Exercise {currentExerciseIndex + 1} of {totalExercises}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Exercise Card */}
        <Card 
          className="bg-card border-border relative overflow-hidden"
          onTouchStart={(e) => {
            const startX = e.touches[0].clientX;
            const handleTouchEnd = (endEvent: TouchEvent) => {
              const endX = endEvent.changedTouches[0].clientX;
              const diff = startX - endX;
              if (Math.abs(diff) > 50) {
                if (diff > 0) {
                  handleSwipeLeft();
                } else {
                  handleSwipeRight();
                }
              }
              document.removeEventListener('touchend', handleTouchEnd);
            };
            document.addEventListener('touchend', handleTouchEnd);
          }}
        >
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground text-center">
              {currentExercise.name}
            </CardTitle>
            {currentExercise.section && (
              <p className="text-center text-muted-foreground">{currentExercise.section}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sets Table */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Sets</h4>
              {currentExercise.sets.map((set, index) => (
                <div key={set.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{index + 1}</span>
                  </div>
                  
                  {currentExercise.category !== 'cardio' && (
                    <>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground">Weight</label>
                        <Input
                          type="number"
                          value={setMetrics[currentExercise.exerciseId]?.[set.id]?.weight || set.weight}
                          onChange={(e) => updateSetMetrics(currentExercise.exerciseId, set.id, 'weight', parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground">Reps</label>
                        <Input
                          type="number"
                          value={setMetrics[currentExercise.exerciseId]?.[set.id]?.reps || set.reps}
                          onChange={(e) => updateSetMetrics(currentExercise.exerciseId, set.id, 'reps', parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </div>
                    </>
                  )}
                  
                  {(currentExercise.category === 'cardio' || set.duration) && (
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Duration (min)</label>
                      <Input
                        type="number"
                        value={setMetrics[currentExercise.exerciseId]?.[set.id]?.duration || set.duration || 0}
                        onChange={(e) => updateSetMetrics(currentExercise.exerciseId, set.id, 'duration', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                  )}
                  
                  <Button
                    variant={completedSets[currentExercise.exerciseId]?.[set.id] ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetCompletion(currentExercise.exerciseId, set.id)}
                    className="w-10 h-10 p-0"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Rest Time */}
            {currentExercise.restTime && (
              <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                <Timer className="w-5 h-5 inline mr-2 text-amber-500" />
                <span className="text-amber-600 font-medium">
                  Rest: {currentExercise.restTime}s between sets
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentExerciseIndex === 0}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">Swipe to navigate</p>
          </div>

          <Button
            size="lg"
            onClick={handleNext}
            disabled={completeWorkoutMutation.isPending}
            className={currentExerciseIndex === totalExercises - 1 ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {currentExerciseIndex === totalExercises - 1 ? "Finish" : "Next"}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Swipe Instructions */}
        <div className="text-center text-xs text-muted-foreground">
          ← Swipe left for next exercise • Swipe right for previous →
        </div>

        {/* Timer Controls */}
        <div className="text-center">
          <div className="flex justify-center gap-2">
            <Button onClick={toggleTimer} size="lg" variant="outline">
              {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button onClick={resetTimer} variant="outline" size="lg">
              <Square className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Victory Modal */}
      {showVictoryModal && completedSession && (
        <WorkoutVictoryModal
          isOpen={showVictoryModal}
          onClose={handleVictoryClose}
          workoutName={completedSession.name}
          xpGained={completedSession.xpEarned}
          statsGained={completedSession.statsEarned}
          duration={completedSession.duration}
          totalVolume={completedSession.totalVolume}
          validation={completedSession.validation}
          newAchievements={completedSession.newAchievements}
          streakBonus={{
            isActive: false,
            multiplier: 1,
            streakDays: 0
          }}
        />
      )}
    </div>
  );
}