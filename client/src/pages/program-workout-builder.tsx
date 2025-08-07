import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, GripVertical, Play, Save, Calendar, Clock } from "lucide-react";
import { ParallaxBackground } from "@/components/ui/parallax-background";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import type { Exercise, ProgramWorkout } from "@shared/schema";

// Day names for display
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ExerciseData {
  exerciseId: number;
  sets: number;
  reps?: number;
  duration?: number;
  weight?: number;
  restTime?: number;
  section?: string;
  supersetGroup?: string;
  order?: number;
  fields?: string[];
}

interface WorkoutFormData {
  name: string;
  description?: string;
  weekNumber: number;
  dayNumber: number;
  exercises: ExerciseData[];
  notes?: string;
  estimatedDuration?: number;
}

// Exercise defaults based on category
const getExerciseDefaults = (exercise: Exercise) => {
  const category = exercise.category.toLowerCase();
  
  switch (category) {
    case 'strength':
      return {
        sets: 3,
        reps: 10,
        weight: 0,
        restTime: 120,
        fields: ['weight', 'reps', 'RIR']
      };
    case 'cardio':
      return {
        sets: 1,
        duration: 1200, // 20 minutes in seconds
        restTime: 60,
        fields: ['duration', 'RPE']
      };
    case 'bodyweight':
    case 'plyometric':
      return {
        sets: 3,
        reps: 15,
        restTime: 90,
        fields: ['reps', 'RIR']
      };
    case 'flexibility':
    case 'mobility':
      return {
        sets: 1,
        duration: 300, // 5 minutes
        restTime: 30,
        fields: ['duration']
      };
    default:
      return {
        sets: 3,
        reps: 10,
        weight: 0,
        restTime: 120,
        fields: ['weight', 'reps', 'RIR']
      };
  }
};

export default function ProgramWorkoutBuilder() {
  const params = useParams();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const programId = parseInt(params.programId!);
  const workoutId = params.workoutId === 'new' ? null : parseInt(params.workoutId!);
  
  // Parse URL params for new workout
  const urlParams = new URLSearchParams(window.location.search);
  const defaultWeek = parseInt(urlParams.get('week') || '1');
  const defaultDay = parseInt(urlParams.get('day') || '1');

  const [formData, setFormData] = useState<WorkoutFormData>({
    name: '',
    description: '',
    weekNumber: defaultWeek,
    dayNumber: defaultDay,
    exercises: [],
    notes: '',
    estimatedDuration: 45,
  });

  // Queries
  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ['/api/workout-programs', programId],
  });

  const { data: existingWorkout, isLoading: workoutLoading } = useQuery({
    queryKey: ['/api/program-workouts', workoutId],
    enabled: !!workoutId,
  });

  const { data: exercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ['/api/exercises'],
  });

  // Load existing workout data
  useEffect(() => {
    if (existingWorkout) {
      setFormData({
        name: existingWorkout.name,
        description: existingWorkout.description || '',
        weekNumber: existingWorkout.weekNumber,
        dayNumber: existingWorkout.dayNumber,
        exercises: existingWorkout.exercises || [],
        notes: existingWorkout.notes || '',
        estimatedDuration: existingWorkout.estimatedDuration || 45,
      });
    }
  }, [existingWorkout]);

  // Mutations
  const createWorkoutMutation = useMutation({
    mutationFn: async (data: WorkoutFormData) => {
      const response = await fetch(`/api/workout-programs/${programId}/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create workout');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program workout created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-programs', programId, 'workouts'] });
      navigate(`/program-overview/${program?.name?.toLowerCase().replace(/\s+/g, '-')}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create workout",
        variant: "destructive",
      });
    },
  });

  const updateWorkoutMutation = useMutation({
    mutationFn: async (data: WorkoutFormData) => {
      const response = await fetch(`/api/program-workouts/${workoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update workout');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program workout updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-programs', programId, 'workouts'] });
      navigate(`/program-overview/${program?.name?.toLowerCase().replace(/\s+/g, '-')}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update workout",
        variant: "destructive",
      });
    },
  });

  if (programLoading || workoutLoading || exercisesLoading) {
    return (
      <ParallaxBackground>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </ParallaxBackground>
    );
  }

  if (!program) {
    return (
      <ParallaxBackground>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">Program Not Found</h2>
              <p className="text-muted-foreground mb-6">The program you're trying to edit doesn't exist.</p>
              <Button onClick={() => navigate('/workouts')} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workouts
              </Button>
            </CardContent>
          </Card>
        </div>
      </ParallaxBackground>
    );
  }

  const handleAddExercise = (exerciseId: number) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const defaults = getExerciseDefaults(exercise);
    const newExercise: ExerciseData = {
      exerciseId,
      ...defaults,
      order: formData.exercises.length,
    };

    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
  };

  const handleRemoveExercise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const handleExerciseChange = (index: number, field: keyof ExerciseData, value: any) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workout name",
        variant: "destructive",
      });
      return;
    }

    if (formData.exercises.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one exercise",
        variant: "destructive",
      });
      return;
    }

    if (workoutId) {
      updateWorkoutMutation.mutate(formData);
    } else {
      createWorkoutMutation.mutate(formData);
    }
  };

  const getExerciseName = (exerciseId: number) => {
    return exercises.find(e => e.id === exerciseId)?.name || 'Unknown Exercise';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}:00`;
  };

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
                onClick={() => navigate(`/program-overview/${program.name?.toLowerCase().replace(/\s+/g, '-')}`)}
                className="hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {workoutId ? 'Edit Workout' : 'Create Workout'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {program.name} • Week {formData.weekNumber} • {dayNames[formData.dayNumber - 1]}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">

          {/* Basic Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Workout Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Workout Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Upper Body Strength"
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedDuration">Duration (minutes)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={formData.estimatedDuration || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || undefined }))}
                    placeholder="45"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="week">Week Number</Label>
                  <Select value={formData.weekNumber.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, weekNumber: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: program.durationWeeks }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          Week {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="day">Day of Week</Label>
                  <Select value={formData.dayNumber.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, dayNumber: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayNames.map((day, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief workout description..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Exercise Selection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Add Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={(value) => handleAddExercise(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an exercise to add" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map((exercise) => (
                    <SelectItem key={exercise.id} value={exercise.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{exercise.name}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {exercise.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Exercise List */}
          {formData.exercises.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Workout Exercises ({formData.exercises.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.exercises.map((exercise, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-semibold">
                          {getExerciseName(exercise.exerciseId)}
                        </h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveExercise(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Sets</Label>
                        <Input
                          type="number"
                          value={exercise.sets || ''}
                          onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value) || 1)}
                          className="h-8"
                        />
                      </div>
                      
                      {exercise.fields?.includes('weight') && (
                        <div>
                          <Label className="text-xs">Weight (lbs)</Label>
                          <Input
                            type="number"
                            value={exercise.weight || ''}
                            onChange={(e) => handleExerciseChange(index, 'weight', parseInt(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                      )}
                      
                      {exercise.fields?.includes('reps') && (
                        <div>
                          <Label className="text-xs">Reps</Label>
                          <Input
                            type="number"
                            value={exercise.reps || ''}
                            onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value) || 10)}
                            className="h-8"
                          />
                        </div>
                      )}
                      
                      {exercise.fields?.includes('duration') && (
                        <div>
                          <Label className="text-xs">Duration (sec)</Label>
                          <Input
                            type="number"
                            value={exercise.duration || ''}
                            onChange={(e) => handleExerciseChange(index, 'duration', parseInt(e.target.value) || 300)}
                            className="h-8"
                          />
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-xs">Rest (sec)</Label>
                        <Input
                          type="number"
                          value={exercise.restTime || ''}
                          onChange={(e) => handleExerciseChange(index, 'restTime', parseInt(e.target.value) || 120)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Workout Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special instructions, tips, or notes for this workout..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate(`/program-overview/${program.name?.toLowerCase().replace(/\s+/g, '-')}`)}
              variant="ghost"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createWorkoutMutation.isPending || updateWorkoutMutation.isPending}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {createWorkoutMutation.isPending || updateWorkoutMutation.isPending 
                ? 'Saving...' 
                : (workoutId ? 'Update Workout' : 'Create Workout')
              }
            </Button>
          </div>

        </div>
      </div>
    </ParallaxBackground>
  );
}