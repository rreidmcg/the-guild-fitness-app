import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParallaxBackground } from "@/components/ui/parallax-background";

import { ArrowLeft, Trophy, Clock, Calendar, Target, Activity, Zap } from "lucide-react";

interface ProgramWorkout {
  id: number;
  programId: number;
  weekNumber: number;
  dayNumber: number;
  dayName: string;
  name: string;
  description: string;
  exercises: Array<{
    exerciseId: number;
    sets: number;
    reps: number;
    weight?: number;
    restTime: number;
    rpe?: number;
  }>;
}

interface WorkoutProgram {
  id: number;
  name: string;
  description: string;
  durationWeeks: number;
  difficultyLevel: string;
  price: number;
  workoutsPerWeek: number;
  estimatedDuration: number;
  targetAudience: string;
  features: string[];
  isPurchased: boolean;
  priceFormatted: string;
}

// Calculate estimated workout duration based on exercises
function calculateEstimatedDuration(exercises: any[]): number {
  if (!exercises || exercises.length === 0) return 30;
  
  let totalTime = 0;
  
  exercises.forEach((exercise) => {
    const sets = exercise.sets || 3;
    const restTime = exercise.restTime || 60; // seconds
    
    // Estimate 45 seconds per set + rest time between sets
    const setTime = 45; // seconds per set
    const exerciseTime = (sets * setTime) + ((sets - 1) * restTime);
    totalTime += exerciseTime;
  });
  
  // Add 5 minutes for general warm-up/transition time
  totalTime += 300;
  
  // Convert to minutes and round
  return Math.round(totalTime / 60);
}

export default function ProgramOverview() {
  const params = new URLSearchParams(window.location.search);
  const programId = params.get('program');
  const navigate = useNavigate();

  const { data: program, isLoading: programLoading, error: programError } = useQuery<WorkoutProgram>({
    queryKey: ["/api/workout-programs", programId],
    enabled: !!programId,
  });

  const { data: programWorkouts, isLoading: workoutsLoading, error: workoutsError } = useQuery<ProgramWorkout[]>({
    queryKey: [`/api/workout-programs/${programId}/workouts`],
    enabled: !!programId,
  });

  const difficultyColors = {
    novice: "bg-green-500",
    intermediate: "bg-yellow-500", 
    advanced: "bg-red-500"
  };

  const difficultyIcons = {
    novice: <Target className="w-4 h-4" />,
    intermediate: <Activity className="w-4 h-4" />,
    advanced: <Zap className="w-4 h-4" />
  };

  if (programLoading || workoutsLoading) {
    return (
      <ParallaxBackground>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </ParallaxBackground>
    );
  }

  if (!program) {
    return (
      <ParallaxBackground>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-2">Program Not Found</h2>
                <p className="text-muted-foreground mb-4">The program you're looking for doesn't exist.</p>
                <Button onClick={() => navigate('/workout-programs')}>
                  Back to Programs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </ParallaxBackground>
    );
  }

  // Group workouts by week
  const workoutsByWeek = (programWorkouts || []).reduce((acc, workout) => {
    const weekKey = `Week ${workout.weekNumber}`;
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(workout);
    return acc;
  }, {} as Record<string, ProgramWorkout[]>);

  // Convert program workouts to the format expected by WorkoutCard
  const convertToWorkoutFormat = (programWorkout: ProgramWorkout) => ({
    id: programWorkout.id,
    name: programWorkout.workoutName,
    description: programWorkout.instructions || `Week ${programWorkout.weekNumber} - ${programWorkout.dayName}`,
    exercises: programWorkout.exercises,
    estimatedDuration: calculateEstimatedDuration(programWorkout.exercises),
    totalExercises: programWorkout.exercises.length,
    isProgramWorkout: true,
    programId: programWorkout.programId,
    weekNumber: programWorkout.weekNumber,
    dayName: programWorkout.dayName
  });

  return (
    <ParallaxBackground>
      <div className="min-h-screen bg-background text-foreground pb-20">
        
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/workout-programs')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{program.name}</h1>
                <p className="text-muted-foreground mt-0.5 text-sm">{program.description}</p>
              </div>
            </div>

            {/* Program Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{program.durationWeeks}</div>
                <div className="text-sm text-muted-foreground">Weeks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{program.workoutsPerWeek}</div>
                <div className="text-sm text-muted-foreground">Per Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">{program.estimatedDuration}min</div>
                <div className="text-sm text-muted-foreground">Est. Time</div>
              </div>
              <div className="text-center">
                <Badge 
                  className={`${difficultyColors[program.difficultyLevel.toLowerCase()]} text-white`}
                >
                  {difficultyIcons[program.difficultyLevel.toLowerCase()]}
                  <span className="ml-1 capitalize">{program.difficultyLevel}</span>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-8">
          
          {/* Workout Schedule */}
          {Object.entries(workoutsByWeek).map(([weekName, weekWorkouts]) => (
            <div key={weekName}>
              <h2 className="text-xl font-bold mb-4 text-foreground">{weekName}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {weekWorkouts
                  .sort((a, b) => a.dayName.localeCompare(b.dayName))
                  .map((workout) => (
                    <Card 
                      key={workout.id}
                      className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20 hover:border-green-400/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/workout-overview?workout=${workout.id}&program=true`)}
                    >
                      <CardContent className="p-4">
                        <div className="mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{workout.workoutName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {workout.dayName} • {calculateEstimatedDuration(workout.exercises)} min
                            </p>
                          </div>
                        </div>
                        
                        {workout.instructions && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {workout.instructions}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {calculateEstimatedDuration(workout.exercises)} min
                          </span>
                          <span className="flex items-center">
                            <Target className="w-3 h-3 mr-1" />
                            {workout.exercises.length} exercises
                          </span>
                          {workout.rounds && (
                            <span className="flex items-center">
                              <Activity className="w-3 h-3 mr-1" />
                              {workout.rounds} rounds
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}

          {(!programWorkouts || programWorkouts.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Workouts Found</h3>
                <p className="text-muted-foreground">This program doesn't have any workouts configured yet.</p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </ParallaxBackground>
  );
}