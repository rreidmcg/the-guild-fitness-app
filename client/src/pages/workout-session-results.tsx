import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyHeader } from "@/components/ui/currency-header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { WorkoutLoadingState } from "@/components/ui/loading-spinner";
import { useNavigate } from "@/hooks/use-navigate";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Dumbbell, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Activity
} from "lucide-react";
import type { WorkoutSession } from "@shared/schema";

export default function WorkoutSessionResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const { data: session, isLoading } = useQuery<WorkoutSession & { exercises: any[] }>({
    queryKey: ["/api/workout-sessions", sessionId],
  });

  if (isLoading) {
    return <WorkoutLoadingState message="Loading workout session..." />;
  }

  if (!session) {
    return (
      <div className="workout-session-results min-h-screen bg-background overflow-y-auto">
        <CurrencyHeader />
        <div className="p-4 pb-24">
          <div className="max-w-2xl mx-auto text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Session Not Found</h2>
            <p className="text-muted-foreground mb-6">This workout session could not be found.</p>
            <Button onClick={() => navigate("/workouts")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workouts
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const completedAt = new Date(session.completedAt);
  const exercises = session.exercises || [];

  return (
    <div className="workout-session-results min-h-screen bg-background overflow-y-auto">
      <CurrencyHeader />
      
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/workouts")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {session.name || "Workout Session"}
            </h1>
            <p className="text-muted-foreground">
              Completed on {completedAt.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} at {completedAt.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Session Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{session.duration || 0}</div>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{session.totalVolume?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">Total Volume (lbs)</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{session.xpEarned || 0}</div>
                <p className="text-xs text-muted-foreground">XP Earned</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Activity className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{session.perceivedEffort || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">RPE</p>
              </CardContent>
            </Card>
          </div>

          {/* Exercises */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5" />
                Exercise Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {exercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No exercise details available for this session.</p>
                </div>
              ) : (
                exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="border-b border-border pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-foreground">{exercise.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {exercise.category || 'strength'}
                      </Badge>
                    </div>
                    
                    {exercise.sets && exercise.sets.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground mb-2">
                          <div>Set</div>
                          <div>Reps</div>
                          <div>Weight</div>
                          <div>RPE</div>
                          <div>Status</div>
                        </div>
                        
                        {exercise.sets.map((set: any, setIndex: number) => (
                          <div key={setIndex} className="grid grid-cols-5 gap-2 text-sm py-2 border-b border-border/50 last:border-b-0">
                            <div className="font-medium">{setIndex + 1}</div>
                            <div>{set.reps || '-'}</div>
                            <div>{set.weight ? `${set.weight} lbs` : '-'}</div>
                            <div>{set.rpe || '-'}</div>
                            <div>
                              {set.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No set details available</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="text-center">
            <Button 
              onClick={() => navigate("/workouts")}
              size="lg"
              className="bg-game-primary hover:bg-game-primary/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workouts
            </Button>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}