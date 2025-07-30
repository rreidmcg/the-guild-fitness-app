import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Target, Users, Play } from "lucide-react";
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

export default function ProgramOverview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const programId = parseInt(id || "0");

  // Fetch program details
  const { data: program, isLoading: programLoading } = useQuery<WorkoutProgram>({
    queryKey: [`/api/workout-programs/${programId}`],
    enabled: !!programId,
  });

  // Fetch program workouts
  const { data: workouts, isLoading: workoutsLoading } = useQuery<ProgramWorkout[]>({
    queryKey: [`/api/workout-programs/${programId}/workouts`],
    enabled: !!programId && program?.isPurchased,
  });

  if (programLoading || workoutsLoading) {
    return (
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded mb-6"></div>
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Program Not Found</h1>
          <Button onClick={() => navigate("/workout-programs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Programs
          </Button>
        </div>
      </div>
    );
  }

  if (!program.isPurchased) {
    return (
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Program Not Available</h1>
          <p className="text-muted-foreground mb-6">
            You need to purchase this program to access its workouts.
          </p>
          <Button onClick={() => navigate("/workout-programs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse Programs
          </Button>
        </div>
      </div>
    );
  }

  // Group workouts by week
  const workoutsByWeek = (workouts || []).reduce((acc, workout) => {
    const week = workout.weekNumber || 1;
    if (!acc[week]) acc[week] = [];
    acc[week].push(workout);
    return acc;
  }, {} as Record<number, ProgramWorkout[]>);

  const handleStartWorkout = (workout: ProgramWorkout) => {
    navigate(`/program-workout/${programId}/${workout.id}`);
  };

  const handleViewDay = (workout: ProgramWorkout) => {
    navigate(`/program-day/${programId}/${workout.id}`);
  };

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/workout-programs")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{program.name}</h1>
            <p className="text-muted-foreground">{program.description}</p>
          </div>
        </div>

        {/* Program Overview */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">Program Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{program.durationWeeks} weeks</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{program.workoutsPerWeek}/week</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{program.estimatedDuration} min</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{program.difficultyLevel}</span>
              </div>
            </div>
            
            {program.features && program.features.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">Program Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {program.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Days */}
        <div className="space-y-6">
          {Object.entries(workoutsByWeek)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([weekNumber, weekWorkouts]) => (
            <Card key={weekNumber} className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">
                  Week {weekNumber}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {weekWorkouts.map((workout) => (
                    <Card 
                      key={workout.id} 
                      className="bg-muted/30 border-border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => handleViewDay(workout)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-foreground">{workout.dayName}</h4>
                            <p className="text-sm text-muted-foreground">{workout.workoutName}</p>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{workout.exercises?.length || 0} exercises</span>
                            {workout.rounds && <span>{workout.rounds} rounds</span>}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDay(workout);
                              }}
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartWorkout(workout);
                              }}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(workouts || []).length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">No Workouts Available</h3>
              <p className="text-muted-foreground">
                This program doesn't have any workouts configured yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}