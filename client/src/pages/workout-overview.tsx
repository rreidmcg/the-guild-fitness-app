import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useNavigate } from "@/hooks/use-navigate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParallaxBackground } from "@/components/ui/parallax-background";
import { ArrowLeft, Play, Clock, Target, Dumbbell, Edit3 } from "lucide-react";
import { findBySlug, getWorkoutSessionUrl } from "@/lib/url-utils";

export default function WorkoutOverview() {
  const { slug } = useParams<{ slug?: string }>();
  const params = new URLSearchParams(window.location.search);
  const queryWorkoutId = params.get('workout');
  const navigate = useNavigate();

  // Fetch all workouts to support slug lookup
  const { data: allWorkouts } = useQuery<any[]>({
    queryKey: ["/api/workouts"],
  });

  // Determine workout ID from either slug or query parameter
  let workoutId: string | null = null;
  let workoutFromSlug: any = null;

  if (slug) {
    // Using slug-based URL
    workoutFromSlug = findBySlug(allWorkouts, slug);
    workoutId = workoutFromSlug?.id?.toString() || null;
  } else if (queryWorkoutId) {
    // Using query parameter (backwards compatibility)
    workoutId = queryWorkoutId;
  }

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
              <div className="mb-4">
                <div className="text-sm font-medium text-foreground mb-1">Description</div>
                <p className="text-muted-foreground">{workout.description}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (workout) {
                    navigate(getWorkoutSessionUrl(workout));
                  } else if (workoutId) {
                    navigate(`/workout-session/${workoutId}`);
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Workout
              </Button>
              <Button 
                onClick={() => navigate(`/workout-builder?edit=${workoutId}`)}
                variant="outline"
                size="lg"
                className="py-3"
              >
                <Edit3 className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workout Sections */}
        {(() => {
          // Group exercises by section (legacy support for flat exercise lists)
          const groupedExercises: Record<string, any[]> = {};
          
          workoutExercises.forEach((exercise: any) => {
            let sectionName = exercise.section;
            
            // If no section is specified, auto-group by exercise category
            if (!sectionName) {
              const exerciseDetails = exercises?.find(ex => ex.id === exercise.exerciseId);
              const category = exerciseDetails?.category;
              
              switch (category) {
                case 'warmup':
                  sectionName = 'Warm Up';
                  break;
                case 'strength':
                  sectionName = 'Main Workout';
                  break;
                case 'cardio':
                  sectionName = 'Cool Down';
                  break;
                case 'bodyweight':
                  sectionName = 'Warm Up';  // Group bodyweight with warm up
                  break;
                default:
                  sectionName = 'Main Workout';
              }
            }
            
            if (!groupedExercises[sectionName]) {
              groupedExercises[sectionName] = [];
            }
            groupedExercises[sectionName].push(exercise);
          });


          // Group supersets within each section
          const groupExercisesBySuperset = (exercises: any[]) => {
            const supersets: Record<string, any[]> = {};
            const regularExercises: any[] = [];
            
            exercises.forEach(exercise => {
              if (exercise.supersetGroup) {
                if (!supersets[exercise.supersetGroup]) {
                  supersets[exercise.supersetGroup] = [];
                }
                supersets[exercise.supersetGroup].push(exercise);
              } else {
                regularExercises.push(exercise);
              }
            });
            
            return { supersets, regularExercises };
          };

          if (workoutExercises.length === 0) {
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-500" />
                    Exercises
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No exercises found in this workout</p>
                    <p className="text-sm">The workout data may be structured differently or exercises may not be properly saved.</p>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return Object.entries(groupedExercises).map(([sectionName, sectionExercises]) => {
            const { supersets, regularExercises } = groupExercisesBySuperset(sectionExercises);
            
            // Show header for all sections now
            const showSectionHeader = true;
            
            return (
              <Card key={sectionName}>
                {showSectionHeader && (
                  <CardHeader>
                    <CardTitle>{sectionName}</CardTitle>
                  </CardHeader>
                )}
                <CardContent className="space-y-4">
                  {/* Regular exercises */}
                  {regularExercises.map((exercise: any, index: number) => {
                    const exerciseName = getExerciseName(exercise.exerciseId);
                    const exerciseDetails = exercises?.find(ex => ex.id === exercise.exerciseId);
                    const setsCount = exercise.sets || 1;
                    const reps = exercise.reps || '';
                    const duration = exercise.duration || '';
                    const weight = exercise.weight || 0;
                    const restTime = exercise.restTime || 0;
                    
                    const isTimeBasedExercise = exerciseDetails?.category === 'cardio' || duration;
                    const displayDuration = duration || (isTimeBasedExercise && reps ? reps : null);
                    
                    return (
                      <div key={`${sectionName}-${index}`} className="border rounded-lg p-4">
                        <div className="mb-3">
                          <h3 className="font-semibold text-foreground">{exerciseName}</h3>
                        </div>
                    
                        <div className="text-sm bg-muted/50 rounded p-2">
                          <div className="text-muted-foreground">
                            {setsCount} x {Array.from({length: setsCount}, (_, i) => {
                              const setDisplay = isTimeBasedExercise && displayDuration ? 
                                `${displayDuration} min` : 
                                `${reps} reps`;
                              return setDisplay;
                            }).join(', ')}
                          </div>
                        </div>

                        {exercise.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">{exercise.notes}</p>
                        )}
                      </div>
                    );
                  })}

                  {/* Supersets */}
                  {Object.entries(supersets).map(([supersetId, supersetExercises]) => (
                    <div key={`${sectionName}-${supersetId}`} className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="default" className="bg-primary/20 text-primary border-primary/50">
                          Superset {supersetId}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {supersetExercises.length} exercises - perform back-to-back
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {supersetExercises.map((exercise: any, index: number) => {
                          const exerciseName = getExerciseName(exercise.exerciseId);
                          const exerciseDetails = exercises?.find(ex => ex.id === exercise.exerciseId);
                          const setsCount = exercise.sets || 1;
                          const reps = exercise.reps || '';
                          const duration = exercise.duration || '';
                          const weight = exercise.weight || 0;
                          const restTime = exercise.restTime || 0;
                          
                          const isTimeBasedExercise = exerciseDetails?.category === 'cardio' || duration;
                          const displayDuration = duration || (isTimeBasedExercise && reps ? reps : null);
                          
                          return (
                            <div key={`${supersetId}-${index}`} className="bg-background border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <h4 className="font-medium text-foreground">{exerciseName}</h4>
                              </div>
                          
                              <div className="text-sm bg-muted/50 rounded p-2">
                                <div className="text-muted-foreground">
                                  {setsCount} x {Array.from({length: setsCount}, (_, i) => {
                                    const setDisplay = isTimeBasedExercise && displayDuration ? 
                                      `${displayDuration} min` : 
                                      `${reps} reps`;
                                    return setDisplay;
                                  }).join(', ')}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Superset rest info */}
                        <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded p-2">
                          Rest {supersetExercises[0]?.restTime || 60}s after completing all exercises in this superset
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          });
        })()}
      </div>
    </div>
  );
}