import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Target, Trophy, ArrowRight, CheckCircle, Circle, Minus } from "lucide-react";
import type { TrainingProgram, ProgramCompletion, Workout } from "@shared/schema";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProgramOverview() {
  const { programId } = useParams<{ programId: string }>();
  const [_, navigate] = useLocation();
  const [currentWeek, setCurrentWeek] = useState(0);

  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ["/api/training-programs", programId],
  });

  const { data: completion, isLoading: completionLoading } = useQuery({
    queryKey: ["/api/program-completions", programId],
  });

  const { data: workouts } = useQuery({
    queryKey: ["/api/workouts"],
  });

  const getWorkoutName = (workoutId: string) => {
    const workout = workouts?.find((w: Workout) => w.id.toString() === workoutId);
    return workout?.name || "Workout";
  };

  const getWorkoutEstimatedTime = (workoutId: string) => {
    const workout = workouts?.find((w: Workout) => w.id.toString() === workoutId);
    // Estimate based on exercises if available, otherwise default
    return workout ? "45 min" : "30 min";
  };

  const getDayStatus = (weekIndex: number, dayIndex: number) => {
    if (!completion?.byWeek?.[weekIndex]?.days?.[dayIndex]) return "upcoming";
    return completion.byWeek[weekIndex].days[dayIndex].status;
  };

  const getUpcomingWorkouts = () => {
    if (!program || !completion || !program.calendar) return [];
    
    const upcoming = [];
    const today = new Date();
    
    for (let weekIndex = 0; weekIndex < program.calendar.length; weekIndex++) {
      const week = program.calendar[weekIndex];
      if (!week || !week.days) continue;
      for (let dayIndex = 0; dayIndex < week.days.length; dayIndex++) {
        const dayCell = week.days[dayIndex];
        if (dayCell && dayCell.workoutId) {
          const status = getDayStatus(weekIndex, dayIndex);
          if (status === "upcoming" && upcoming.length < 7) {
            const workoutDate = new Date(today);
            workoutDate.setDate(today.getDate() + upcoming.length);
            
            upcoming.push({
              weekIndex,
              dayIndex,
              workoutId: dayCell.workoutId,
              date: workoutDate,
              name: getWorkoutName(dayCell.workoutId),
              estimatedTime: getWorkoutEstimatedTime(dayCell.workoutId),
              status
            });
          }
        }
      }
    }
    
    return upcoming;
  };

  const handleStartWorkout = (weekIndex: number, dayIndex: number, workoutId: string) => {
    navigate(`/workout/${workoutId}?programId=${programId}&week=${weekIndex}&day=${dayIndex}`);
  };

  if (programLoading || completionLoading) {
    return <div className="program-overview__loading">Loading program...</div>;
  }

  if (!program) {
    return <div className="program-overview__error">Program not found</div>;
  }

  const upcomingWorkouts = getUpcomingWorkouts();

  return (
    <div className="program-overview">
      {/* Program Header */}
      <div className="program-overview__header">
        <div className="program-overview__header-content">
          <div className="program-overview__title-section">
            <h1 className="program-overview__title">{program?.name || "Unnamed Program"}</h1>
            <p className="program-overview__description">{program?.description || "No description"}</p>
          </div>
          
          <div className="program-overview__meta">
            <div className="program-overview__meta-item">
              <Target className="h-5 w-5" />
              <span>{program?.goal || "No goal set"}</span>
            </div>
            <div className="program-overview__meta-item">
              <Calendar className="h-5 w-5" />
              <span>{program?.durationWeeks || 4} weeks</span>
            </div>
            <div className="program-overview__meta-item">
              <Clock className="h-5 w-5" />
              <span>{program?.daysPerWeek || 3} days/week</span>
            </div>
          </div>

          {program?.equipment && program.equipment.length > 0 && (
            <div className="program-overview__equipment">
              <span className="font-medium">Equipment: </span>
              {program.equipment.map((item: string, index: number) => (
                <Badge key={item} variant="outline" className="mr-1">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Summary */}
      {completion && (
        <Card className="program-overview__progress">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Your Progress</h2>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{completion?.streak || 0}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{completion?.percentComplete || 0}%</div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
              </div>
            </div>
            <Progress value={completion?.percentComplete || 0} className="h-3" />
          </div>
        </Card>
      )}

      {/* Program Calendar */}
      <Card className="program-overview__calendar">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Program Calendar</h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                disabled={currentWeek === 0}
              >
                ← Previous Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(Math.min((program.calendar?.length || 1) - 1, currentWeek + 1))}
                disabled={currentWeek >= (program.calendar?.length || 1) - 1}
              >
                Next Week →
              </Button>
            </div>
          </div>

          <div className="program-overview__week">
            <div className="program-overview__week-header">
              <h3 className="font-medium">Week {currentWeek + 1}</h3>
            </div>
            
            <div className="program-overview__week-grid">
              {DAYS_OF_WEEK.map((day, dayIndex) => {
                const dayCell = program.calendar?.[currentWeek]?.days?.[dayIndex];
                const status = getDayStatus(currentWeek, dayIndex);

                return (
                  <div key={dayIndex} className="program-overview__day">
                    <div className="program-overview__day-header">
                      {day}
                    </div>
                    <div className="program-overview__day-content">
                      {dayCell?.rest ? (
                        <div className="program-overview__day-rest">
                          <Minus className="h-4 w-4" />
                          <span>Rest</span>
                        </div>
                      ) : dayCell?.workoutId ? (
                        <div className="program-overview__day-workout">
                          <div className="program-overview__workout-status">
                            {status === "completed" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : status === "missed" ? (
                              <Circle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="program-overview__workout-name">
                            {getWorkoutName(dayCell.workoutId)}
                          </div>
                          {status === "upcoming" && (
                            <Button
                              size="sm"
                              className="program-overview__start-btn"
                              onClick={() => handleStartWorkout(currentWeek, dayIndex, dayCell.workoutId!)}
                            >
                              Start
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="program-overview__day-empty">
                          Free Day
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Upcoming Workouts */}
      {upcomingWorkouts.length > 0 && (
        <Card className="program-overview__upcoming">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Upcoming Workouts</h2>
            <div className="space-y-3">
              {upcomingWorkouts.map((workout, index) => (
                <div key={index} className="program-overview__upcoming-workout">
                  <div className="program-overview__upcoming-info">
                    <div className="program-overview__upcoming-date">
                      {workout.date.toLocaleDateString("en-US", { 
                        weekday: "short", 
                        month: "short", 
                        day: "numeric" 
                      })}
                    </div>
                    <div className="program-overview__upcoming-details">
                      <div className="font-medium">{workout.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Est. {workout.estimatedTime}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStartWorkout(workout.weekIndex, workout.dayIndex, workout.workoutId)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Coach Notes */}
      {program?.coachNotes && (
        <Card className="program-overview__notes">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2">Coach Notes</h2>
            <p className="text-muted-foreground">{program?.coachNotes}</p>
          </div>
        </Card>
      )}
    </div>
  );
}