import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParallaxBackground } from "@/components/ui/parallax-background";
import { ArrowLeft, Play, Clock, Target, Dumbbell } from "lucide-react";

export default function WorkoutOverview() {
  const params = new URLSearchParams(window.location.search);
  const workoutId = params.get('workout');
  const navigate = useNavigate();

  const { data: workout, isLoading } = useQuery<any>({
    queryKey: ["/api/workouts", workoutId],
    enabled: !!workoutId,
  });

  // Fetch exercises data to get names
  const { data: exercises } = useQuery<any[]>({
    queryKey: ["/api/exercises"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Workout Not Found</h2>
              <p className="text-muted-foreground mb-4">The workout you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/quests')}>
                Back to Quests
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const workoutExercises = workout.exercises || [];
  const totalExercises = workoutExercises.length;
  const estimatedTime = totalExercises * 3; // Rough estimate: 3 minutes per exercise

  console.log('Workout data:', workout);
  console.log('Workout exercises:', workoutExercises);
  
  // Helper function to get exercise name by ID
  const getExerciseName = (exerciseId: number) => {
    const exercise = exercises?.find(ex => ex.id === exerciseId);
    return exercise?.name || `Exercise ${exerciseId}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/quests')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{workout.name}</h1>
        </div>

        {/* Workout Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-blue-500" />
              Workout Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{totalExercises}</div>
                <div className="text-sm text-muted-foreground">Exercises</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{estimatedTime}min</div>
                <div className="text-sm text-muted-foreground">Est. Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {workoutExercises.reduce((total: number, ex: any) => total + (ex.sets || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Sets</div>
              </div>
            </div>
            
            {workout.description && (
              <p className="text-muted-foreground mb-4">{workout.description}</p>
            )}

            <Button 
              onClick={() => navigate(`/workout-session/${workoutId}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Workout
            </Button>
          </CardContent>
        </Card>

        {/* Exercise List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Exercises
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workoutExercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No exercises found in this workout</p>
                <p className="text-sm">The workout data may be structured differently or exercises may not be properly saved.</p>
              </div>
            ) : (
              workoutExercises.map((exercise: any, index: number) => {
                console.log('Exercise:', exercise);
                // Handle different data structures based on actual console logs
                const exerciseName = getExerciseName(exercise.exerciseId);
                const setsCount = exercise.sets || 1; // Based on console logs, sets is a number, not array
                const reps = exercise.reps || '';
                const weight = exercise.weight || 0;
                const restTime = exercise.restTime || 0;
                
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{exerciseName}</h3>
                      <Badge variant="outline">{setsCount} sets</Badge>
                    </div>
                
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between text-sm bg-muted/50 rounded p-2">
                        <span className="font-medium">Set Configuration</span>
                        <div className="flex gap-4 text-muted-foreground">
                          {reps && <span>{reps} reps</span>}
                          {weight > 0 && <span>{weight} lbs</span>}
                          {restTime > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {restTime}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {exercise.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">{exercise.notes}</p>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}