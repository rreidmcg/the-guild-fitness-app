import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Target, TrendingUp, Trophy, Plus, Calendar, Weight, Zap, Heart, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const goalFormSchema = z.object({
  goalType: z.string().min(1, "Goal type is required"),
  targetValue: z.string().min(1, "Target value is required"),
  unit: z.string().min(1, "Unit is required"),
  targetDate: z.string().optional(),
});

type GoalFormData = z.infer<typeof goalFormSchema>;

interface FitnessGoal {
  id: number;
  goalType: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  startDate: string;
  targetDate?: string;
  isActive: boolean;
  milestones: Array<{
    percentage: number;
    value: number;
    achieved: boolean;
    achievedAt?: string;
    reward?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const goalTypeConfig = {
  lose_weight: {
    icon: Weight,
    label: "Lose Weight",
    color: "bg-red-500",
    description: "Track weight loss progress",
    defaultUnit: "kg",
    units: ["kg", "lbs", "percent"]
  },
  gain_muscle: {
    icon: Activity,
    label: "Gain Muscle",
    color: "bg-blue-500",
    description: "Build muscle mass and strength",
    defaultUnit: "kg",
    units: ["kg", "lbs", "volume"]
  },
  improve_endurance: {
    icon: Heart,
    label: "Improve Endurance",
    color: "bg-green-500",
    description: "Enhance cardiovascular fitness",
    defaultUnit: "minutes",
    units: ["minutes", "km", "miles"]
  },
  general_fitness: {
    icon: Zap,
    label: "General Fitness",
    color: "bg-purple-500",
    description: "Overall fitness improvement",
    defaultUnit: "workouts",
    units: ["workouts", "days", "hours"]
  }
};

export function FitnessGoalProgress() {
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery<FitnessGoal[]>({
    queryKey: ["/api/fitness-goals"],
    staleTime: 30000,
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/fitness-goals/analytics"],
    staleTime: 60000,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: GoalFormData) => {
      return await apiRequest("/api/fitness-goals", {
        method: "POST",
        body: goalData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness-goals"] });
      setShowCreateDialog(false);
      toast({
        title: "Goal Created",
        description: "Your fitness goal has been set successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create fitness goal",
        variant: "destructive",
      });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ goalType, currentValue }: { goalType: string; currentValue: number }) => {
      return await apiRequest("/api/fitness-goals/update-progress", {
        method: "POST",
        body: { goalType, currentValue },
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness-goals"] });
      setShowUpdateDialog(false);
      
      if (result.milestones.achieved.length > 0) {
        toast({
          title: "Milestone Achieved!",
          description: `Congratulations! You've reached ${result.milestones.achieved[0].percentage}% of your goal!`,
        });
      } else {
        toast({
          title: "Progress Updated",
          description: "Your goal progress has been updated successfully!",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      goalType: "",
      targetValue: "",
      unit: "",
      targetDate: "",
    },
  });

  const updateForm = useForm({
    defaultValues: {
      currentValue: "",
    },
  });

  const handleCreateGoal = (data: GoalFormData) => {
    createGoalMutation.mutate(data);
  };

  const handleUpdateProgress = (data: { currentValue: string }) => {
    if (!selectedGoal) return;
    updateProgressMutation.mutate({
      goalType: selectedGoal.goalType,
      currentValue: parseInt(data.currentValue),
    });
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100);
  };

  const getNextMilestone = (goal: FitnessGoal) => {
    const unachievedMilestones = goal.milestones?.filter(m => !m.achieved) || [];
    return unachievedMilestones.length > 0 ? unachievedMilestones[0] : null;
  };

  if (isLoading) {
    return (
      <div className="fitness-goal-progress__loading space-y-4">
        <div className="fitness-goal-progress__skeleton h-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="fitness-goal-progress__skeleton h-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="fitness-goal-progress">
      <div className="fitness-goal-progress__header flex justify-between items-center mb-6">
        <div>
          <h2 className="fitness-goal-progress__title text-2xl font-bold">Fitness Goals</h2>
          <p className="fitness-goal-progress__subtitle text-muted-foreground">
            Track your progress towards your fitness objectives
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="fitness-goal-progress__create-btn">
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Fitness Goal</DialogTitle>
              <DialogDescription>
                Set a new goal to track your fitness progress
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateGoal)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="goalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Type</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        const config = goalTypeConfig[value as keyof typeof goalTypeConfig];
                        if (config) {
                          createForm.setValue("unit", config.defaultUnit);
                        }
                      }}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a goal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(goalTypeConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center">
                                <config.icon className="h-4 w-4 mr-2" />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter target value"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {createForm.watch("goalType") && goalTypeConfig[createForm.watch("goalType") as keyof typeof goalTypeConfig]?.units.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createGoalMutation.isPending}>
                  {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="fitness-goal-progress__empty-state">
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Goals Set</h3>
              <p className="text-muted-foreground mb-4">
                Create your first fitness goal to start tracking your progress
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="fitness-goal-progress__goals grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const config = goalTypeConfig[goal.goalType as keyof typeof goalTypeConfig];
            const progress = getProgressPercentage(goal.currentValue, goal.targetValue);
            const nextMilestone = getNextMilestone(goal);
            const Icon = config?.icon || Target;

            return (
              <Card key={goal.id} className="fitness-goal-progress__goal-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${config?.color || 'bg-gray-500'}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{config?.label || goal.goalType}</CardTitle>
                        <CardDescription>{config?.description}</CardDescription>
                      </div>
                    </div>
                    {goal.isActive && (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{goal.currentValue} {goal.unit}</span>
                        <span>{goal.targetValue} {goal.unit}</span>
                      </div>
                    </div>

                    {nextMilestone && (
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">Next Milestone</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {nextMilestone.percentage}% goal ({nextMilestone.value} {goal.unit})
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setShowUpdateDialog(true);
                          updateForm.setValue("currentValue", goal.currentValue.toString());
                        }}
                      >
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                      {goal.targetDate && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(goal.targetDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {goal.milestones && goal.milestones.length > 0 && (
                      <div className="grid grid-cols-4 gap-1 mt-3">
                        {goal.milestones.map((milestone, index) => (
                          <div
                            key={index}
                            className={`h-2 rounded-full ${
                              milestone.achieved
                                ? 'bg-green-500'
                                : progress >= milestone.percentage
                                ? 'bg-yellow-500'
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                            title={`${milestone.percentage}% milestone`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Progress Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>
              Update your current progress for {selectedGoal && goalTypeConfig[selectedGoal.goalType as keyof typeof goalTypeConfig]?.label}
            </DialogDescription>
          </DialogHeader>
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(handleUpdateProgress)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value ({selectedGoal?.unit})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={`Enter current ${selectedGoal?.unit}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={updateProgressMutation.isPending}>
                {updateProgressMutation.isPending ? "Updating..." : "Update Progress"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}