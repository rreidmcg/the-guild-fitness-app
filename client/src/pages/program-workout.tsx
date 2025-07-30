import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Play, Pause, Square, Timer, Hash } from "lucide-react";
import { useNavigate } from "@/hooks/use-navigate";

interface ProgramWorkout {
  id: number;
  programId: number;
  weekNumber: number;
  dayName: string;
  workoutName: string;
  exercises: Array<{
    name: string;
    reps?: string;
    duration?: string;
    holdTime?: string;
    instructions?: string;
  }>;
  instructions: string;
  rounds?: number;
  restSeconds?: number;
}

export default function ProgramWorkout() {
  const { programId, workoutId } = useParams<{ programId: string; workoutId: string }>();
  const navigate = useNavigate();
  const pId = parseInt(programId || "0");
  const wId = parseInt(workoutId || "0");

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);

  // Fetch all workouts for the program to find the specific workout
  const { data: workouts, isLoading } = useQuery<ProgramWorkout[]>({
    queryKey: [`/api/workout-programs/${pId}/workouts`],
    enabled: !!pId,
  });

  const workout = workouts?.find(w => w.id === wId);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        if (isResting) {
          setRestTimer(prev => {
            if (prev <= 1) {
              setIsResting(false);
              setIsTimerRunning(false);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setTimer(prev => prev + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isResting]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded mb-6"></div>
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!workout || !workout.exercises || workout.exercises.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Workout Not Available</h1>
          <Button onClick={() => navigate(`/program-overview/${pId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Program
          </Button>
        </div>
      </div>
    );
  }

  const exercises = workout.exercises;
  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;
  const progress = ((currentExerciseIndex + 1) / totalExercises) * 100;

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setTimer(0);
      setIsTimerRunning(false);
      setIsResting(false);
    }
  };

  const handleNext = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      // Start rest period if configured
      if (workout.restSeconds && workout.restSeconds > 0) {
        setRestTimer(workout.restSeconds);
        setIsResting(true);
        setIsTimerRunning(true);
      }
      
      setCurrentExerciseIndex(prev => prev + 1);
      setTimer(0);
      
      if (!workout.restSeconds) {
        setIsTimerRunning(false);
      }
    } else {
      handleFinishWorkout();
    }
  };

  const handleFinishWorkout = () => {
    navigate(`/program-overview/${pId}`);
  };

  const toggleTimer = () => {
    setIsTimerRunning(prev => !prev);
  };

  const resetTimer = () => {
    setTimer(0);
    setIsTimerRunning(false);
    setIsResting(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSwipeLeft = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      handleNext();
    }
  };

  const handleSwipeRight = () => {
    if (currentExerciseIndex > 0) {
      handlePrevious();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/program-day/${pId}/${wId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground">{workout.dayName}</h1>
            <p className="text-sm text-muted-foreground">{workout.workoutName}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFinishWorkout}
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Exercise {currentExerciseIndex + 1} of {totalExercises}</span>
            {workout.rounds && workout.rounds > 1 && (
              <span>Round {currentRound} of {workout.rounds}</span>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Rest Timer Overlay */}
        {isResting && (
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="text-center py-8">
              <Timer className="w-12 h-12 mx-auto mb-4 text-amber-500" />
              <h3 className="text-2xl font-bold text-foreground mb-2">Rest Time</h3>
              <p className="text-4xl font-mono font-bold text-amber-500 mb-4">
                {formatTime(restTimer)}
              </p>
              <p className="text-muted-foreground">Get ready for the next exercise</p>
            </CardContent>
          </Card>
        )}

        {/* Current Exercise Card */}
        {!isResting && (
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
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Exercise Details */}
              <div className="text-center space-y-4">
                <div className="flex justify-center flex-wrap gap-6 text-lg">
                  {currentExercise.reps && (
                    <div className="flex items-center gap-2">
                      <Hash className="w-5 h-5 text-primary" />
                      <span className="text-muted-foreground">Reps:</span>
                      <span className="font-bold text-foreground">{currentExercise.reps}</span>
                    </div>
                  )}
                  {currentExercise.duration && (
                    <div className="flex items-center gap-2">
                      <Timer className="w-5 h-5 text-primary" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-bold text-foreground">{currentExercise.duration}</span>
                    </div>
                  )}
                  {currentExercise.holdTime && (
                    <div className="flex items-center gap-2">
                      <Timer className="w-5 h-5 text-primary" />
                      <span className="text-muted-foreground">Hold:</span>
                      <span className="font-bold text-foreground">{currentExercise.holdTime}</span>
                    </div>
                  )}
                </div>

                {/* Timer */}
                <div className="text-center">
                  <div className="text-6xl font-mono font-bold text-primary mb-4">
                    {formatTime(timer)}
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button onClick={toggleTimer} size="lg">
                      {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button onClick={resetTimer} variant="outline" size="lg">
                      <Square className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {currentExercise.instructions && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Instructions:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {currentExercise.instructions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
      </div>
    </div>
  );
}