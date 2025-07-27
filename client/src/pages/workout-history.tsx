import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, Clock, Dumbbell, Calendar, TrendingUp, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface WorkoutSession {
  id: number;
  userId: number;
  workoutId: number;
  name: string;
  completedAt: string;
  totalVolume: number;
  duration: number;
  xpGained: number;
}

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function WorkoutHistory() {
  const [, setLocation] = useLocation();

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch workout sessions
  const { data: workoutSessions, isLoading } = useQuery({
    queryKey: ["/api/workout-sessions"],
  });

  // Sort sessions by most recent first
  const sortedSessions = (Array.isArray(workoutSessions) ? [...workoutSessions]
    .sort((a: WorkoutSession, b: WorkoutSession) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    ) : []) as WorkoutSession[];

  // Calculate total stats
  const totalWorkouts = sortedSessions.length;
  const totalVolume = sortedSessions.reduce((sum: number, session: WorkoutSession) => sum + session.totalVolume, 0);
  const totalXP = sortedSessions.reduce((sum: number, session: WorkoutSession) => sum + session.xpGained, 0);
  const totalTime = sortedSessions.reduce((sum: number, session: WorkoutSession) => sum + session.duration, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20 pt-16">
        <div className="max-w-4xl mx-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading workout history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/stats')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Stats
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="w-8 h-8" />
              Workout History
            </h1>
            <p className="mt-2 text-white/80">
              Track your complete fitness journey and progress over time
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Workout Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {totalWorkouts}
                </div>
                <div className="text-sm text-muted-foreground">Total Workouts</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {totalVolume.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Volume (lbs)</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {Math.round(totalTime / 60)}h
                </div>
                <div className="text-sm text-muted-foreground">Total Time</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {totalXP.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total XP</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Workout Sessions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Dumbbell className="w-5 h-5" />
              All Workouts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedSessions.length > 0 ? sortedSessions.map((session: WorkoutSession) => (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border"
              >
                <div className="p-3 rounded-lg bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                  <Dumbbell className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{session.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(session.completedAt)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(session.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>{session.totalVolume.toLocaleString()} lbs</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Trophy className="w-4 h-4" />
                      <span>+{session.xpGained} XP</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Workouts Yet</h3>
                <p className="text-sm">Start your fitness journey by creating your first workout!</p>
                <Button
                  onClick={() => setLocation('/workouts')}
                  className="mt-4"
                >
                  Create Your First Workout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}