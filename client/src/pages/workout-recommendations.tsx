import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Brain, 
  Target, 
  Clock, 
  Dumbbell, 
  Heart, 
  Zap, 
  TrendingUp, 
  Play,
  CheckCircle,
  Star,
  AlertCircle
} from "lucide-react";
import { CurrencyHeader } from "@/components/ui/currency-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface WorkoutRecommendation {
  id: string;
  name: string;
  description: string;
  reason: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDuration: number;
  targetStats: {
    strength?: number;
    stamina?: number;
    agility?: number;
  };
  exercises: RecommendedExercise[];
  score: number;
}

interface RecommendedExercise {
  exerciseId: number;
  name: string;
  category: string;
  muscleGroups: string[];
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  restTime: number;
  reason: string;
}

export default function WorkoutRecommendationsPage() {
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: recommendations, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/workout-recommendations"],
    retry: false, // Don't retry on 403 subscription errors
  });

  const createWorkoutMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      return await apiRequest(`/api/workout-recommendations/${recommendationId}/create`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Workout Created!",
        description: "Your recommended workout has been added to your workout library.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workout from recommendation",
        variant: "destructive",
      });
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "intermediate": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "advanced": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getStatIcon = (stat: string) => {
    switch (stat) {
      case "strength": return <Dumbbell className="w-4 h-4 text-red-400" />;
      case "stamina": return <Heart className="w-4 h-4 text-yellow-400" />;
      case "agility": return <Zap className="w-4 h-4 text-green-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <CurrencyHeader />
      
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center space-x-2">
                <Brain className="w-6 h-6 text-purple-500" />
                <span>AI Workout Recommendations</span>
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Personalized workouts based on your stats, goals, and progress
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recommendations && Array.isArray(recommendations) && recommendations.length > 0 ? (
          <div className="space-y-6">
            {/* Info Banner */}
            <Card className="bg-purple-500/5 border-purple-500/20">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Smart Recommendations
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      These workouts are tailored to your current stats, fitness goals, and recent activity patterns.
                      The AI considers your strengths, weaknesses, and recovery needs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations.map((recommendation: WorkoutRecommendation, index: number) => (
              <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{recommendation.name}</CardTitle>
                        {index === 0 && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                            <Star className="w-3 h-3 mr-1" />
                            Top Pick
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={getDifficultyColor(recommendation.difficulty)}
                        >
                          {recommendation.difficulty}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {recommendation.description}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="bg-muted/30 rounded-lg p-3 mt-3">
                    <div className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-blue-600 dark:text-blue-400">Why this workout: </span>
                        {recommendation.reason}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Quick Stats */}
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{recommendation.estimatedDuration} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span>{recommendation.exercises.length} exercises</span>
                    </div>
                  </div>

                  {/* Target Stats */}
                  {Object.keys(recommendation.targetStats).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Target Stats:</h4>
                      <div className="flex space-x-4">
                        {Object.entries(recommendation.targetStats).map(([stat, value]) => (
                          <div key={stat} className="flex items-center space-x-1">
                            {getStatIcon(stat)}
                            <span className="text-xs capitalize">{stat}</span>
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              +{value}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Exercise Preview */}
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRecommendation(
                        expandedRecommendation === recommendation.id ? null : recommendation.id
                      )}
                      className="text-xs mb-3 p-0 h-auto"
                    >
                      {expandedRecommendation === recommendation.id ? "Hide" : "Show"} Exercise Details
                    </Button>

                    {expandedRecommendation === recommendation.id && (
                      <div className="space-y-3">
                        {recommendation.exercises.map((exercise, idx) => (
                          <div key={idx} className="bg-muted/20 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-sm">{exercise.name}</h5>
                              <Badge variant="outline" className="text-xs">
                                {exercise.category}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>Sets: <span className="font-medium">{exercise.sets}</span></div>
                              <div>Reps: <span className="font-medium">{exercise.reps}</span></div>
                              {exercise.duration && (
                                <div>Duration: <span className="font-medium">{exercise.duration}s</span></div>
                              )}
                              <div>Rest: <span className="font-medium">{exercise.restTime}s</span></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {exercise.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={() => createWorkoutMutation.mutate(recommendation.id)}
                      disabled={createWorkoutMutation.isPending}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Add to My Workouts
                    </Button>
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Start Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Recommendations Available</h3>
              <p className="text-muted-foreground mb-4">
                Complete a few workouts to help our AI understand your fitness patterns and generate personalized recommendations.
              </p>
              <Button onClick={() => refetch()}>
                Generate Recommendations
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}