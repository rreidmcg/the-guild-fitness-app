import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParallaxBackground } from "@/components/ui/parallax-background";
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

import { ArrowLeft, Trophy, Clock, Calendar, Target, Activity, Zap, Edit, Save, X } from "lucide-react";

interface ProgramWorkout {
  id: number;
  programId: number;
  weekNumber: number;
  dayName: string;
  workoutName: string;
  instructions?: string;
  rounds?: number;
  restSeconds?: number;
  exercises: Array<{
    name: string;
    reps?: string;
    duration?: string;
    holdTime?: string;
    instructions?: string;
  }>;
}

interface WorkoutProgram {
  id: number;
  creatorId?: number;
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

interface CalendarDay {
  dayName: string;
  weekNumber: number;
  workouts: ProgramWorkout[];
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

// Draggable workout card component
function DraggableWorkoutCard({ workout, isEditing, onWorkoutClick }: { 
  workout: ProgramWorkout; 
  isEditing: boolean;
  onWorkoutClick: (workout: ProgramWorkout) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `workout-${workout.id}`,
    data: { workout },
    disabled: !isEditing,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditing ? listeners : {})}
      {...(isEditing ? attributes : {})}
      onClick={() => !isEditing && onWorkoutClick(workout)}
      className={`
        bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20 
        hover:border-green-400/40 transition-colors rounded-lg p-3
        ${isDragging ? 'opacity-50 z-50' : ''}
        ${isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        ${!isEditing ? 'hover:bg-green-500/15' : ''}
      `}
    >
      <div className="mb-2">
        <h4 className="font-semibold text-foreground text-sm">{workout.workoutName}</h4>
        <p className="text-xs text-muted-foreground">
          {calculateEstimatedDuration(workout.exercises)} min • {workout.exercises.length} exercises
        </p>
      </div>
      {workout.instructions && (
        <p className="text-xs text-muted-foreground truncate">
          {workout.instructions.substring(0, 50)}...
        </p>
      )}
    </div>
  );
}

// Droppable day cell component
function DroppableDay({ day, weekNumber, workouts, isEditing, onWorkoutClick }: {
  day: string;
  weekNumber: number;
  workouts: ProgramWorkout[];
  isEditing: boolean;
  onWorkoutClick: (workout: ProgramWorkout) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${weekNumber}-${day}`,
    data: { day, weekNumber },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        border rounded-lg p-3 min-h-[120px] space-y-2
        ${isOver && isEditing ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20' : 'border-border'}
        ${isEditing ? 'hover:border-blue-400' : ''}
      `}
    >
      <div className="text-sm font-medium text-foreground mb-2">{day}</div>
      <div className="space-y-2">
        {workouts.map((workout) => (
          <DraggableWorkoutCard 
            key={workout.id}
            workout={workout} 
            isEditing={isEditing}
            onWorkoutClick={onWorkoutClick}
          />
        ))}
        {workouts.length === 0 && isEditing && (
          <div className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed border-border rounded">
            Drop workout here
          </div>
        )}
        {workouts.length === 0 && !isEditing && (
          <div className="text-xs text-muted-foreground text-center py-4">
            Rest day
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProgramOverview() {
  const params = new URLSearchParams(window.location.search);
  const programId = params.get('program');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [draggedWorkout, setDraggedWorkout] = useState<ProgramWorkout | null>(null);

  // Query for current user to check permissions
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: program, isLoading: programLoading, error: programError } = useQuery<WorkoutProgram>({
    queryKey: ["/api/workout-programs", programId],
    enabled: !!programId,
  });

  const { data: programWorkouts, isLoading: workoutsLoading, error: workoutsError } = useQuery<ProgramWorkout[]>({
    queryKey: [`/api/workout-programs/${programId}/workouts`],
    enabled: !!programId,
  });

  // Mutation to update workout schedule
  const updateWorkoutMutation = useMutation({
    mutationFn: async (data: { workoutId: number; weekNumber: number; dayName: string }) => {
      return await apiRequest(`/api/program-workouts/${data.workoutId}`, {
        method: "PATCH",
        body: JSON.stringify({
          weekNumber: data.weekNumber,
          dayName: data.dayName,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workout-programs/${programId}/workouts`] });
    },
  });

  // Check if current user is the creator (for demo, allow editing for all users)
  const canEdit = true; // TODO: check if userStats?.id === program?.creatorId

  // Drag and drop handlers
  const handleDragStart = (event: any) => {
    const workout = event.active.data.current?.workout;
    if (workout) {
      setDraggedWorkout(workout);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedWorkout(null);

    if (!over || !active.data.current?.workout) return;

    const workout = active.data.current.workout as ProgramWorkout;
    const dropData = over.data.current;
    
    if (dropData?.day && dropData?.weekNumber) {
      // Only update if the day or week actually changed
      if (workout.dayName !== dropData.day || workout.weekNumber !== dropData.weekNumber) {
        updateWorkoutMutation.mutate({
          workoutId: workout.id,
          weekNumber: dropData.weekNumber,
          dayName: dropData.day,
        });
      }
    }
  };

  const handleWorkoutClick = (workout: ProgramWorkout) => {
    navigate(`/workout-overview?workout=${workout.id}&program=true&programId=${workout.programId}`);
  };

  const difficultyColors: Record<string, string> = {
    novice: "bg-green-500",
    intermediate: "bg-yellow-500", 
    advanced: "bg-red-500"
  };

  const difficultyIcons: Record<string, JSX.Element> = {
    novice: <Target className="w-4 h-4" />,
    intermediate: <Activity className="w-4 h-4" />,
    advanced: <Zap className="w-4 h-4" />
  };

  // Create calendar structure
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weeks = Array.from({ length: program?.durationWeeks || 1 }, (_, i) => i + 1);
  
  // Group workouts by week and day
  const workoutCalendar = weeks.map(weekNumber => {
    const weekDays = daysOfWeek.map(day => {
      const dayWorkouts = (programWorkouts || []).filter(
        w => w.weekNumber === weekNumber && w.dayName === day
      );
      return { day, workouts: dayWorkouts };
    });
    return { week: weekNumber, days: weekDays };
  });

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
                onClick={() => navigate('/quests')}
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

        <div className="max-w-7xl mx-auto p-6 space-y-8">
          
          {/* Edit Toggle */}
          {canEdit && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-foreground">Program Schedule</h2>
                {isEditing && (
                  <Badge variant="secondary" className="text-blue-600">
                    <Edit className="w-3 h-3 mr-1" />
                    Editing Mode
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      disabled={updateWorkoutMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Done
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Schedule
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Calendar View */}
          <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-8">
              {workoutCalendar.map(({ week, days }) => (
                <Card key={week}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      Week {week}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {daysOfWeek.map(day => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                          {day.slice(0, 3)}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {days.map(({ day, workouts }) => (
                        <DroppableDay
                          key={`${week}-${day}`}
                          day={day}
                          weekNumber={week}
                          workouts={workouts}
                          isEditing={isEditing}
                          onWorkoutClick={handleWorkoutClick}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {draggedWorkout && (
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20 rounded-lg p-3 shadow-lg">
                  <div className="mb-2">
                    <h4 className="font-semibold text-foreground text-sm">{draggedWorkout.workoutName}</h4>
                    <p className="text-xs text-muted-foreground">
                      {calculateEstimatedDuration(draggedWorkout.exercises)} min • {draggedWorkout.exercises.length} exercises
                    </p>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>

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