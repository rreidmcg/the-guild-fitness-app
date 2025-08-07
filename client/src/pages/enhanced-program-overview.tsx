import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Target, Clock, Users, Play, Edit, Copy, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { ParallaxBackground } from "@/components/ui/parallax-background";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useState } from "react";
import type { WorkoutProgram, ProgramWorkout } from "@shared/schema";

// Day names for display
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface CalendarDay {
  dayNumber: number;
  dayName: string;
  workout?: ProgramWorkout;
}

interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

export default function EnhancedProgramOverview() {
  const params = useParams();
  const [, navigate] = useLocation();
  const [currentWeek, setCurrentWeek] = useState(1);
  
  // Support both slug and ID-based URLs
  const programId = params.id;

  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ['/api/workout-programs', programId],
    enabled: !!programId,
  });

  const { data: programWorkouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ['/api/workout-programs', programId, 'workouts'],
    enabled: !!programId && !!program?.isPurchased,
  });

  if (programLoading || workoutsLoading) {
    return (
      <ParallaxBackground>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </ParallaxBackground>
    );
  }

  if (!program) {
    return (
      <ParallaxBackground>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">Program Not Found</h2>
              <p className="text-muted-foreground mb-6">The program you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/workouts')} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workouts
              </Button>
            </CardContent>
          </Card>
        </div>
      </ParallaxBackground>
    );
  }

  if (!program.isPurchased) {
    return (
      <ParallaxBackground>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">Access Required</h2>
              <p className="text-muted-foreground mb-6">You need to purchase this program to view its contents.</p>
              <Button onClick={() => navigate('/workout-programs')} className="w-full">
                View in Shop
              </Button>
            </CardContent>
          </Card>
        </div>
      </ParallaxBackground>
    );
  }

  // Organize workouts into calendar structure
  const organizeWorkoutsByWeek = (workouts: ProgramWorkout[]): CalendarWeek[] => {
    const weeks: CalendarWeek[] = [];
    
    for (let weekNum = 1; weekNum <= program.durationWeeks; weekNum++) {
      const week: CalendarWeek = {
        weekNumber: weekNum,
        days: []
      };

      for (let dayNum = 1; dayNum <= 7; dayNum++) {
        const dayWorkout = workouts.find(w => w.weekNumber === weekNum && w.dayNumber === dayNum);
        week.days.push({
          dayNumber: dayNum,
          dayName: dayNames[dayNum - 1],
          workout: dayWorkout
        });
      }
      
      weeks.push(week);
    }
    
    return weeks;
  };

  const calendarWeeks = organizeWorkoutsByWeek(programWorkouts);
  const currentWeekData = calendarWeeks[currentWeek - 1];

  const handleWorkoutStart = (workout: ProgramWorkout) => {
    // Navigate to workout session for this program workout
    navigate(`/workout-session/program-workout/${workout.id}`);
  };

  const handleEditWorkout = (workout: ProgramWorkout) => {
    // Navigate to workout builder in program context
    navigate(`/program-workout-builder/${program.id}/${workout.id}`);
  };

  const handleCopyWorkout = (workout: ProgramWorkout) => {
    // Implement copy functionality
    console.log('Copy workout:', workout);
  };

  const handleDeleteWorkout = (workout: ProgramWorkout) => {
    // Implement delete functionality
    console.log('Delete workout:', workout);
  };

  const handleAddWorkout = (weekNumber: number, dayNumber: number) => {
    // Navigate to workout builder to create new workout
    navigate(`/program-workout-builder/${program.id}/new?week=${weekNumber}&day=${dayNumber}`);
  };

  return (
    <ParallaxBackground>
      <div className="min-h-screen bg-background text-foreground pb-20">
        
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/workouts')}
                className="hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{program.name}</h1>
                <p className="text-muted-foreground text-sm">{program.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6 space-y-8">

          {/* Program Stats */}
          <Card className="bg-card border-border">
            <CardContent className="space-y-4 p-6">
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

          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                disabled={currentWeek <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-bold">Week {currentWeek}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentWeek(Math.min(program.durationWeeks, currentWeek + 1))}
                disabled={currentWeek >= program.durationWeeks}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Badge variant="secondary">{currentWeek} / {program.durationWeeks}</Badge>
          </div>

          {/* Calendar View */}
          {currentWeekData && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {currentWeekData.days.map((day) => (
                <Card key={`${currentWeek}-${day.dayNumber}`} className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-center">
                      {day.dayName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {day.workout ? (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-foreground leading-tight">
                          {day.workout.name}
                        </h4>
                        {day.workout.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {day.workout.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{day.workout.exercises?.length || 0} exercises</span>
                          {day.workout.estimatedDuration && (
                            <span>{day.workout.estimatedDuration}min</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleWorkoutStart(day.workout!)}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2"
                            onClick={() => handleEditWorkout(day.workout!)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2"
                            onClick={() => handleCopyWorkout(day.workout!)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteWorkout(day.workout!)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <p className="text-xs text-muted-foreground mb-2">Rest Day</p>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-xs"
                          onClick={() => handleAddWorkout(currentWeek, day.dayNumber)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Workout
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Week Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">This Week</h3>
                <div className="text-3xl font-bold text-primary mb-1">
                  {currentWeekData?.days.filter(d => d.workout).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Scheduled workouts</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Time</h3>
                <div className="text-3xl font-bold text-accent mb-1">
                  {currentWeekData?.days.reduce((total, day) => 
                    total + (day.workout?.estimatedDuration || 0), 0
                  ) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Minutes scheduled</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Progress</h3>
                <div className="text-3xl font-bold text-success mb-1">
                  {Math.round((currentWeek / program.durationWeeks) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">Program complete</p>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </ParallaxBackground>
  );
}