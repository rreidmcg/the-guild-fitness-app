import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, RotateCcw, Play, Hash } from "lucide-react";
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

export default function ProgramDay() {
  const { programId, workoutId } = useParams<{ programId: string; workoutId: string }>();
  const navigate = useNavigate();
  const pId = parseInt(programId || "0");
  const wId = parseInt(workoutId || "0");

  // Fetch all workouts for the program to find the specific workout
  const { data: workouts, isLoading } = useQuery<ProgramWorkout[]>({
    queryKey: [`/api/workout-programs/${pId}/workouts`],
    enabled: !!pId,
  });

  const workout = workouts?.find(w => w.id === wId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded mb-6"></div>
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Workout Not Found</h1>
          <Button onClick={() => navigate(`/program-overview/${pId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Program
          </Button>
        </div>
      </div>
    );
  }

  const handleStartWorkout = () => {
    navigate(`/program-workout/${pId}/${wId}`);
  };

  const formatRestTime = (seconds?: number) => {
    if (!seconds) return "No rest specified";
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/program-overview/${pId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{workout.dayName}</h1>
            <p className="text-muted-foreground">{workout.workoutName}</p>
          </div>
        </div>

        {/* Workout Overview */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary" />
              Workout Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Exercises:</span>
                <span className="font-semibold text-foreground">{workout.exercises?.length || 0}</span>
              </div>
              {workout.rounds && (
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Rounds:</span>
                  <span className="font-semibold text-foreground">{workout.rounds}</span>
                </div>
              )}
              {workout.restSeconds && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Rest:</span>
                  <span className="font-semibold text-foreground">{formatRestTime(workout.restSeconds)}</span>
                </div>
              )}
            </div>
            
            {workout.instructions && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">Instructions:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {workout.instructions}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercise List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">
              Exercises ({workout.exercises?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workout.exercises?.map((exercise, index) => (
                <Card key={index} className="bg-muted/30 border-border">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-foreground">
                          {index + 1}. {exercise.name}
                        </h4>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {exercise.reps && (
                          <span>Reps: <strong className="text-foreground">{exercise.reps}</strong></span>
                        )}
                        {exercise.duration && (
                          <span>Duration: <strong className="text-foreground">{exercise.duration}</strong></span>
                        )}
                        {exercise.holdTime && (
                          <span>Hold: <strong className="text-foreground">{exercise.holdTime}</strong></span>
                        )}
                      </div>
                      
                      {exercise.instructions && (
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                          {exercise.instructions}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No exercises configured for this workout.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Start Workout Button */}
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={handleStartWorkout}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Workout
          </Button>
        </div>
      </div>
    </div>
  );
}