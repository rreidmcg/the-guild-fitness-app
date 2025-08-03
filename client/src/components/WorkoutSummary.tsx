import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Clock, Target, Star, ChevronRight, ArrowLeft, X } from "lucide-react";
import { useLocation } from "wouter";

interface WorkoutSummaryProps {
  workoutName: string;
  xpGained: number;
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXPForNextLevel: number;
  statsGained: {
    strength?: number;
    stamina?: number;
    agility?: number;
  };
  duration: number;
  totalVolume?: number;
  leveledUp?: boolean;
  newLevel?: number;
}

export function WorkoutSummary({
  workoutName,
  xpGained,
  currentLevel,
  currentXP,
  xpToNextLevel,
  totalXPForNextLevel,
  statsGained,
  duration,
  totalVolume,
  leveledUp = false,
  newLevel
}: WorkoutSummaryProps) {
  const [, setLocation] = useLocation();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const progressPercentage = ((currentXP / totalXPForNextLevel) * 100);
  
  const totalStatsGained = (statsGained.strength || 0) + (statsGained.stamina || 0) + (statsGained.agility || 0);

  return (
    <div className="workout-summary min-h-screen bg-background p-4 pb-24 overflow-y-auto">
      {/* Header with close button */}
      <div className="max-w-2xl mx-auto mb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/workouts")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/workouts")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          {leveledUp ? (
            <div className="workout-summary__level-up space-y-2">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                <Star className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Level Up!</h1>
              <p className="text-xl text-game-primary">You reached Level {newLevel}!</p>
            </div>
          ) : (
            <div className="workout-summary__complete space-y-2">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Workout Complete!</h1>
              <p className="text-lg text-muted-foreground">{workoutName}</p>
            </div>
          )}
        </div>

        {/* XP Gained */}
        <Card className="workout-summary__xp-card bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20">
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <TrendingUp className="w-8 h-8 text-blue-500 mx-auto" />
              <h3 className="text-2xl font-bold text-foreground">+{xpGained} XP</h3>
            </div>
          </CardContent>
        </Card>

        {/* Level Progress */}
        <Card className="workout-summary__progress-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Level {currentLevel} Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current XP</span>
                <span>{currentXP.toLocaleString()} / {totalXPForNextLevel.toLocaleString()}</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="text-center text-sm text-muted-foreground">
                {xpToNextLevel.toLocaleString()} XP until Level {currentLevel + 1}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Distribution */}
        {totalStatsGained > 0 && (
          <Card className="workout-summary__stats-card">
            <CardHeader>
              <CardTitle>Stat Gains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statsGained.strength && statsGained.strength > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Strength</span>
                    </div>
                    <span className="font-semibold text-red-500">+{statsGained.strength}</span>
                  </div>
                )}
                {statsGained.stamina && statsGained.stamina > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Stamina</span>
                    </div>
                    <span className="font-semibold text-green-500">+{statsGained.stamina}</span>
                  </div>
                )}
                {statsGained.agility && statsGained.agility > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span>Agility</span>
                    </div>
                    <span className="font-semibold text-blue-500">+{statsGained.agility}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workout Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="workout-summary__duration-card">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-lg font-semibold">{formatDuration(duration)}</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </CardContent>
          </Card>

          {totalVolume && (
            <Card className="workout-summary__volume-card">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-lg font-semibold">{totalVolume.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Volume</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-6">
          <Button
            onClick={() => setLocation("/stats")}
            className="w-full bg-game-primary hover:bg-game-primary/90 text-white py-3"
            size="lg"
          >
            View Stats
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button
            onClick={() => setLocation("/workouts")}
            variant="outline"
            className="w-full py-3"
            size="lg"
          >
            Back to Workouts
          </Button>
        </div>
      </div>
    </div>
  );
}