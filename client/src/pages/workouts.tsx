import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/ui/workout-card";
import { useToast } from "@/hooks/use-toast";
import { 
  Dumbbell, 
  Plus, 
  Play, 
  Calendar,
  TrendingUp
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export default function Workouts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: workoutSessions } = useQuery({
    queryKey: ["/api/workout-sessions"],
  });

  const { data: workoutPrograms } = useQuery({
    queryKey: ["/api/workout-programs"],
  });

  const recentSessions = workoutSessions?.slice(0, 5) || [];
  const programs = workoutPrograms || [];

  const handleProgramClick = (program: any) => {
    toast({
      title: "Program Selected",
      description: `Opening ${program.name} program details...`,
    });
    // Navigate to workout builder
    setLocation("/workout-builder");
  };

  const handleStartProgram = (program: any) => {
    toast({
      title: "Starting Workout",
      description: `Beginning ${program.name} workout session...`,
    });
    // Navigate to workout session with program ID
    setLocation(`/workout-session/${program.id}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <PageHeader 
        title="Workouts" 
        subtitle="Track your fitness journey"
      >
        <Button 
          onClick={() => setLocation("/workout-builder")}
          size="sm"
          className="bg-game-primary hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Workout
        </Button>
      </PageHeader>

      <div className="max-w-4xl mx-auto p-6 space-y-8">

        {/* Recent Workouts */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-foreground">Recent Sessions</CardTitle>
              <Button variant="ghost" className="text-game-primary hover:text-blue-400">
                <TrendingUp className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">No workouts yet</h3>
                <p className="mb-6">Start your fitness journey today! Use the "New Workout" button above.</p>
              </div>
            ) : (
              recentSessions.map((session) => (
                <WorkoutCard key={session.id} session={session} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Workout Programs */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">Workout Programs</CardTitle>
          </CardHeader>
          <CardContent>
            {programs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No workout programs available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programs.map((program) => (
                  <Card 
                    key={program.id} 
                    className="bg-card border-border hover:border-game-primary transition-colors cursor-pointer"
                    onClick={() => handleProgramClick(program)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">{program.name}</h3>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-game-primary hover:bg-game-primary/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartProgram(program);
                            }}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{program.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="bg-game-primary/20 text-game-primary px-2 py-1 rounded">{program.difficultyLevel}</span>
                        <span>{program.durationWeeks} weeks</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">This Week</h3>
              <div className="text-3xl font-bold text-game-primary mb-1">
                {recentSessions.length}
              </div>
              <p className="text-xs text-muted-foreground">Workouts completed</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Time</h3>
              <div className="text-3xl font-bold text-game-success mb-1">
                {recentSessions.reduce((total, session) => total + (session.duration || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Minutes this week</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Volume</h3>
              <div className="text-3xl font-bold text-game-warning mb-1">
                {recentSessions.reduce((total, session) => total + (session.totalVolume || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">lbs lifted this week</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}