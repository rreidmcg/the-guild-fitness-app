import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { WorkoutVictoryModal } from "@/components/ui/workout-victory-modal";
import { CurrencyHeader } from "@/components/ui/currency-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Play, Pause, Square, Check, Target } from "lucide-react";

export default function WorkoutSession() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseData, setExerciseData] = useState<any[]>([]);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [completedSession, setCompletedSession] = useState<any>(null);
  const [perceivedEffort, setPerceivedEffort] = useState(7); // RPE scale 1-10
  const [showRPESelection, setShowRPESelection] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTime(time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  const completeWorkoutMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      return await apiRequest("/api/workout-sessions", {
        method: "POST",
        body: sessionData,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      // Show victory modal with the session data including new achievements
      setCompletedSession(result);
      setShowVictoryModal(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete workout",
        variant: "destructive",
      });
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleCompleteWorkout = () => {
    setIsActive(false); // Stop the timer
    setShowRPESelection(true); // Show RPE selection before completing
  };

  const handleCompleteWithRPE = () => {
    // Generate sample exercise data for validation
    const sampleExercises = [
      {
        exerciseId: 1,
        name: "Push-ups",
        category: "strength",
        statTypes: { strength: 1 },
        sets: [
          { reps: 15, weight: 0, completed: true },
          { reps: 12, weight: 0, completed: true },
          { reps: 10, weight: 0, completed: true }
        ]
      },
      {
        exerciseId: 2,
        name: "Squats",
        category: "strength", 
        statTypes: { strength: 1, stamina: 0.5 },
        sets: [
          { reps: 20, weight: 0, completed: true },
          { reps: 18, weight: 0, completed: true },
          { reps: 15, weight: 0, completed: true }
        ]
      }
    ];

    const sessionData = {
      workoutId: parseInt(id || "0"),
      name: "Workout Session",
      duration: Math.floor(time / 60), // Convert to minutes
      totalVolume: 0, // Will be calculated from exercises
      xpEarned: 0, // Will be calculated server-side
      statsEarned: {},
      perceivedEffort,
      exercises: sampleExercises, // Include exercise data for validation
    };
    
    setShowRPESelection(false);
    completeWorkoutMutation.mutate(sessionData);
  };

  const handleVictoryClose = () => {
    setShowVictoryModal(false);
    setLocation("/workouts");
  };

  const progress = exerciseData.length > 0 ? (currentExerciseIndex / exerciseData.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-game-dark text-white pb-20">
      <CurrencyHeader />
      
      <div className="bg-game-slate border-b border-gray-700 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/workouts")}
                className="text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workouts
              </Button>
              <h1 className="text-3xl font-bold">Workout Session</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold">{formatTime(time)}</div>
                <div className="text-sm text-gray-400">Duration</div>
              </div>
              <Button 
                onClick={handleStartPause}
                className={isActive ? "bg-orange-600 hover:bg-orange-700" : "bg-game-primary hover:bg-blue-600"}
              >
                {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isActive ? "Pause" : "Start"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Bar */}
        <Card className="bg-game-slate border-gray-700 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Progress</h2>
              <span className="text-sm text-gray-400">
                {currentExerciseIndex} of {exerciseData.length} exercises
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Current Exercise */}
        <Card className="bg-game-slate border-gray-700 mb-8">
          <CardHeader>
            <CardTitle>Current Exercise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-game-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Start Your Workout</h3>
              <p className="text-gray-400">Press start to begin tracking your session</p>
            </div>
          </CardContent>
        </Card>

        {/* Exercise List */}
        <Card className="bg-game-slate border-gray-700">
          <CardHeader>
            <CardTitle>Exercise List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-400">
              <p>Exercise list will be populated when workout is loaded</p>
            </div>
          </CardContent>
        </Card>

        {/* Complete Workout Button */}
        <div className="fixed bottom-6 right-6">
          <Button 
            size="lg"
            onClick={handleCompleteWorkout}
            disabled={completeWorkoutMutation.isPending}
            className="bg-game-success hover:bg-green-600"
          >
            <Check className="w-6 h-6 mr-2" />
            Complete Workout
          </Button>
        </div>
      </div>

      {/* Victory Modal */}
      {showVictoryModal && completedSession && (
        <WorkoutVictoryModal
          isOpen={showVictoryModal}
          onClose={handleVictoryClose}
          workoutName={completedSession.name || "Workout"}
          xpGained={completedSession.xpEarned || 0}
          statsGained={completedSession.statsEarned || {}}
          duration={completedSession.duration || 0}
          totalVolume={completedSession.totalVolume}
          validation={completedSession.validation}
          newAchievements={completedSession.newAchievements || []}
        />
      )}

      {/* RPE Selection Modal */}
      <Dialog open={showRPESelection} onOpenChange={() => setShowRPESelection(false)}>
        <DialogContent className="sm:max-w-md bg-game-slate border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Target className="w-5 h-5" />
              Rate Your Effort
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-6">
            <div className="text-center text-gray-300">
              <p className="mb-2">How hard did this workout feel?</p>
              <p className="text-sm text-gray-400">Scale: 1 (Very Easy) to 10 (Maximum Effort)</p>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-3xl font-bold text-blue-400">{perceivedEffort}</span>
                <p className="text-sm text-gray-400 mt-1">
                  {perceivedEffort <= 2 ? "Very Easy" :
                   perceivedEffort <= 4 ? "Easy" :
                   perceivedEffort <= 6 ? "Moderate" :
                   perceivedEffort <= 8 ? "Hard" :
                   perceivedEffort <= 9 ? "Very Hard" : "Maximum Effort"}
                </p>
              </div>
              
              <Slider
                value={[perceivedEffort]}
                onValueChange={(value) => setPerceivedEffort(value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>Very Easy</span>
                <span>Max Effort</span>
              </div>
            </div>
            
            <Button 
              onClick={handleCompleteWithRPE}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={completeWorkoutMutation.isPending}
            >
              Complete Workout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
