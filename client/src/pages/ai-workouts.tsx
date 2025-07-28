import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Brain, Clock, Target, Settings, Crown, Zap, TrendingUp, PlayCircle, Edit3, Lock } from "lucide-react";
import { Link } from "wouter";

const preferencesSchema = z.object({
  equipmentAccess: z.enum(["full_gym", "home_gym", "bodyweight_only"]),
  workoutsPerWeek: z.number().min(1).max(7),
  sessionDuration: z.number().min(15).max(120),
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]),
  trainingStyle: z.enum(["strength_focused", "cardio_focused", "balanced", "powerlifting"]),
  injuriesLimitations: z.array(z.string()).optional(),
  preferredMuscleGroups: z.array(z.string()).optional(),
  avoidedExercises: z.array(z.string()).optional(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

const muscleGroups = [
  "chest", "back", "shoulders", "biceps", "triceps", "legs", "glutes", "abs", "cardio"
];

const commonExercises = [
  "burpees", "jumping jacks", "mountain climbers", "high knees", "squat jumps",
  "push-ups", "pull-ups", "deadlifts", "squats", "bench press"
];

const injuries = [
  "lower back", "knee", "shoulder", "wrist", "ankle", "neck", "hip"
];

interface WorkoutRecommendation {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDuration: number;
  targetMuscleGroups: string[];
  exercises: Array<{
    exerciseId: number;
    sets: number;
    reps: number;
    weight?: number;
    duration?: number;
    restTime?: number;
    notes?: string;
  }>;
  aiReasoning: string;
  adaptationTips: string[];
}

const PreferencesDialog = ({ preferences, onSave }: { 
  preferences: any; 
  onSave: (data: PreferencesFormData) => void;
}) => {
  const [open, setOpen] = useState(false);
  
  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      equipmentAccess: preferences?.equipmentAccess || "home_gym",
      workoutsPerWeek: preferences?.workoutsPerWeek || 3,
      sessionDuration: preferences?.sessionDuration || 45,
      fitnessLevel: preferences?.fitnessLevel || "beginner",
      trainingStyle: preferences?.trainingStyle || "balanced",
      injuriesLimitations: preferences?.injuriesLimitations || [],
      preferredMuscleGroups: preferences?.preferredMuscleGroups || [],
      avoidedExercises: preferences?.avoidedExercises || [],
    },
  });

  const handleSubmit = (data: PreferencesFormData) => {
    onSave(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Update Preferences
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Workout Preferences</DialogTitle>
          <DialogDescription>
            Customize your preferences to get better AI workout recommendations
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="equipmentAccess"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment Access</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full_gym">Full Gym</SelectItem>
                        <SelectItem value="home_gym">Home Gym</SelectItem>
                        <SelectItem value="bodyweight_only">Bodyweight Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fitnessLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fitness Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="workoutsPerWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workouts Per Week: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={7}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sessionDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Duration: {field.value} min</FormLabel>
                    <FormControl>
                      <Slider
                        min={15}
                        max={120}
                        step={15}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="trainingStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Style</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="strength_focused">Strength Focused</SelectItem>
                      <SelectItem value="cardio_focused">Cardio Focused</SelectItem>
                      <SelectItem value="powerlifting">Powerlifting</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredMuscleGroups"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Muscle Groups</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {muscleGroups.map((muscle) => (
                      <div key={muscle} className="flex items-center space-x-2">
                        <Checkbox
                          id={muscle}
                          checked={field.value?.includes(muscle)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, muscle]);
                            } else {
                              field.onChange(currentValue.filter((m) => m !== muscle));
                            }
                          }}
                        />
                        <label htmlFor={muscle} className="text-sm capitalize">
                          {muscle}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="injuriesLimitations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Injuries/Limitations</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {injuries.map((injury) => (
                      <div key={injury} className="flex items-center space-x-2">
                        <Checkbox
                          id={injury}
                          checked={field.value?.includes(injury)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, injury]);
                            } else {
                              field.onChange(currentValue.filter((i) => i !== injury));
                            }
                          }}
                        />
                        <label htmlFor={injury} className="text-sm capitalize">
                          {injury}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Save Preferences</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const WorkoutCard = ({ workout, onCreateWorkout }: { 
  workout: WorkoutRecommendation; 
  onCreateWorkout: (workoutId: string) => void;
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "intermediate": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "advanced": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{workout.name}</CardTitle>
            <CardDescription className="mt-1">{workout.description}</CardDescription>
          </div>
          <Badge className={getDifficultyColor(workout.difficulty)}>
            {workout.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {workout.estimatedDuration} min
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {workout.exercises.length} exercises
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Target Muscles:</h4>
          <div className="flex flex-wrap gap-1">
            {workout.targetMuscleGroups.map((muscle, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {muscle}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">AI Reasoning:</h4>
          <p className="text-sm text-muted-foreground">{workout.aiReasoning}</p>
        </div>

        {workout.adaptationTips?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Adaptation Tips:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {workout.adaptationTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={() => onCreateWorkout(workout.id)} className="flex-1">
          <PlayCircle className="w-4 h-4 mr-2" />
          Create Workout
        </Button>
        <Button variant="outline" size="sm">
          <Edit3 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function AIWorkouts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check subscription status
  const { data: user } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Get workout preferences
  const { data: preferences } = useQuery({
    queryKey: ["/api/workout-preferences"],
  });

  // Get AI workout recommendations
  const { 
    data: recommendations, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["/api/workout-recommendations"],
    enabled: user?.subscriptionStatus === 'active',
  });

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: (data: PreferencesFormData) => 
      apiRequest("POST", "/api/workout-preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-recommendations"] });
      toast({
        title: "Preferences Updated",
        description: "Your AI recommendations will be updated based on your new preferences.",
      });
    },
  });

  // Create workout from recommendation
  const createWorkout = useMutation({
    mutationFn: (recommendationId: string) => 
      apiRequest("POST", `/api/workout-recommendations/${recommendationId}/create`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Workout Created",
        description: "Your AI-recommended workout has been added to your workout library!",
      });
    },
  });

  const isSubscribed = user?.subscriptionStatus === 'active';

  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Lock className="w-5 h-5" />
              <span className="font-semibold">Premium Feature</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Workout Recommendations</h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get personalized workout plans created by advanced AI that adapts to your equipment, goals, and feedback.
            </p>

            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center space-y-4">
                <Brain className="w-16 h-16 text-primary mx-auto" />
                <h3 className="text-lg font-semibold">Unlock AI-Powered Training</h3>
                <p className="text-muted-foreground">
                  Upgrade to premium to access personalized workout recommendations that evolve with your progress.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span>Personalized AI workout plans</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-500" />
                    <span>Equipment-specific recommendations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>Adaptive plans based on feedback</span>
                  </div>
                </div>
                <Link href="/premium">
                  <Button className="w-full">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-lg font-semibold mb-2">Unable to Load Recommendations</h2>
              <p className="text-muted-foreground mb-4">
                {error?.message || "Failed to load AI workout recommendations"}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full mb-2">
              <Brain className="w-4 h-4" />
              <span className="text-sm font-semibold">AI Powered</span>
            </div>
            <h1 className="text-3xl font-bold">Workout Recommendations</h1>
            <p className="text-muted-foreground">
              Personalized training plans created by AI based on your preferences
            </p>
          </div>
          <PreferencesDialog 
            preferences={preferences} 
            onSave={(data) => updatePreferences.mutate(data)} 
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-64">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recommendations Grid */}
        {recommendations && recommendations.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((workout: WorkoutRecommendation) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onCreateWorkout={(id) => createWorkout.mutate(id)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {recommendations && recommendations.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No Recommendations Yet</h2>
              <p className="text-muted-foreground mb-4">
                Update your workout preferences to get personalized AI recommendations.
              </p>
              <PreferencesDialog 
                preferences={preferences} 
                onSave={(data) => updatePreferences.mutate(data)} 
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}