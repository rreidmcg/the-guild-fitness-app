import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Dumbbell, RotateCcw, Flame, Clock } from "lucide-react";
import type { WorkoutSession } from "@shared/schema";

interface WorkoutCardProps {
  session: WorkoutSession;
}

export function WorkoutCard({ session }: WorkoutCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWorkoutTypeIcon = (name: string) => {
    if (name.toLowerCase().includes('cardio')) return "🏃";
    if (name.toLowerCase().includes('strength')) return "💪";
    if (name.toLowerCase().includes('yoga')) return "🧘";
    return "🏋️";
  };

  return (
    <Card className="bg-card border-border hover:border-game-primary transition-colors cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-game-primary rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{session.name}</h3>
              <p className="text-sm text-foreground/70">
                {session.completedAt && formatDate(session.completedAt)} • {session.duration} min
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge className="bg-game-success text-white">
              +{session.xpEarned} XP
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-foreground/60">
          <span className="flex items-center">
            <Dumbbell className="w-3 h-3 mr-1" />
            {session.totalVolume || 0} lbs
          </span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {session.duration} min
          </span>
          <span className="flex items-center">
            <Flame className="w-3 h-3 mr-1" />
            +{Object.values(session.statsEarned || {}).reduce((a, b) => a + b, 0)} Stats
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
