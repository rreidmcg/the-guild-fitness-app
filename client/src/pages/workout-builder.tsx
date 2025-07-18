import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseSelector } from "@/components/ui/exercise-selector";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Save, Play } from "lucide-react";
import type { Exercise } from "@shared/schema";

interface WorkoutExercise {
  exerciseId: number;
  exercise?: Exercise;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  restTime?: number;
}

export default function WorkoutBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [workoutName, setWorkoutName] = useState("");
  const [workoutDescription, setWorkoutDescription] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);

  const { data: exercises } = useQuery({
    queryKey: ["/api/exercises"],
  });

  const createWorkoutMutation = useMutation({
    mutationFn: async (workoutData: any) => {
      const response = await apiRequest("POST", "/api/workouts", workoutData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Success!",
        description: "Workout created successfully",
      });
      setLocation("/workouts");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workout",
        variant: "destructive",
      });
    },
  });

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exercise,
      sets: 3,
      reps: 10,
      weight: 0,
      restTime: 60,
    };
    setSelectedExercises([...selectedExercises, newExercise]);
  };

  const handleUpdateExercise = (index: number, updates: Partial<WorkoutExercise>) => {
    const updated = [...selectedExercises];
    updated[index] = { ...updated[index], ...updates };
    setSelectedExercises(updated);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const handleSaveWorkout = () => {
    if (!workoutName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workout name",
        variant: "destructive",
      });
      return;
    }

    if (selectedExercises.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one exercise",
        variant: "destructive",
      });
      return;
    }

    const workoutData = {
      name: workoutName,
      description: workoutDescription,
      exercises: selectedExercises.map(ex => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        duration: ex.duration,
        restTime: ex.restTime,
      })),
    };

    createWorkoutMutation.mutate(workoutData);
  };

  const handleStartWorkout = () => {
    // TODO: Navigate to workout session with current exercises
    toast({
      title: "Coming Soon",
      description: "Workout session functionality will be added soon",
    });
  };

  return (
    <div className="min-h-screen bg-game-dark text-white pb-20">
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
              <h1 className="text-3xl font-bold">Create Workout</h1>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleSaveWorkout}
                disabled={createWorkoutMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Workout
              </Button>
              <Button 
                className="bg-game-primary hover:bg-blue-600"
                onClick={handleStartWorkout}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workout Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-game-slate border-gray-700">
              <CardHeader>
                <CardTitle>Workout Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workout-name">Workout Name</Label>
                  <Input
                    id="workout-name"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    placeholder="Enter workout name..."
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="workout-description">Description (Optional)</Label>
                  <Textarea
                    id="workout-description"
                    value={workoutDescription}
                    onChange={(e) => setWorkoutDescription(e.target.value)}
                    placeholder="Describe your workout..."
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Selected Exercises */}
            <Card className="bg-game-slate border-gray-700">
              <CardHeader>
                <CardTitle>Exercise List ({selectedExercises.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedExercises.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No exercises added yet. Select exercises from the right panel.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedExercises.map((exercise, index) => (
                      <Card key={index} className="bg-gray-800 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-white">{exercise.exercise?.name}</h3>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveExercise(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs text-gray-400">Sets</Label>
                              <Input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => handleUpdateExercise(index, { sets: parseInt(e.target.value) || 0 })}
                                className="bg-gray-700 border-gray-600"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-400">Reps</Label>
                              <Input
                                type="number"
                                value={exercise.reps}
                                onChange={(e) => handleUpdateExercise(index, { reps: parseInt(e.target.value) || 0 })}
                                className="bg-gray-700 border-gray-600"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-400">Weight (lbs)</Label>
                              <Input
                                type="number"
                                value={exercise.weight || 0}
                                onChange={(e) => handleUpdateExercise(index, { weight: parseInt(e.target.value) || 0 })}
                                className="bg-gray-700 border-gray-600"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-400">Rest (sec)</Label>
                              <Input
                                type="number"
                                value={exercise.restTime || 60}
                                onChange={(e) => handleUpdateExercise(index, { restTime: parseInt(e.target.value) || 0 })}
                                className="bg-gray-700 border-gray-600"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Exercise Selection */}
          <div>
            <ExerciseSelector 
              exercises={exercises || []}
              onSelectExercise={handleAddExercise}
              selectedExerciseIds={selectedExercises.map(ex => ex.exerciseId)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
