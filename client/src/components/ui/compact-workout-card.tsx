import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Dumbbell, ChevronRight, Calendar, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

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

interface CompactWorkoutCardProps {
  workoutSessions: WorkoutSession[];
}

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return "Today";
  if (diffDays === 2) return "Yesterday";
  if (diffDays <= 7) return `${diffDays - 1} days ago`;
  return date.toLocaleDateString();
};

export function CompactWorkoutCard({ workoutSessions }: CompactWorkoutCardProps) {
  const [, setLocation] = useLocation();

  // Sort by most recent and show only first 3
  const sortedSessions = [...workoutSessions]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 3);

  const handleViewAll = () => {
    setLocation('/workout-history');
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold text-foreground">Recent Workouts</CardTitle>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="text-muted-foreground hover:text-foreground"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedSessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
              <Dumbbell className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm truncate text-foreground">
                  {session.name}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(session.completedAt)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(session.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{session.totalVolume.toLocaleString()} lbs</span>
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <span>+{session.xpGained} XP</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {workoutSessions.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No workouts completed yet.</p>
            <p className="text-xs mt-1">Start your fitness journey today!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}