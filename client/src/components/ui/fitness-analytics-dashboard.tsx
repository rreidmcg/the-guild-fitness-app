import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Target, Award, Calendar, Activity } from "lucide-react";

interface FitnessAnalytics {
  weeklyProgress: Array<{
    period: string;
    workouts: number;
    totalXp: number;
    totalVolume: number;
  }>;
  monthlyProgress: Array<{
    period: string;
    workouts: number;
    totalXp: number;
    totalVolume: number;
  }>;
  goalAchievements: Array<{
    goalType: string;
    progress: number;
    milestones: Array<{
      percentage: number;
      achieved: boolean;
      achievedAt?: string;
    }>;
  }>;
  strengthTrend: number[];
  staminaTrend: number[];
  agilityTrend: number[];
}

const goalTypeLabels = {
  lose_weight: "Weight Loss",
  gain_muscle: "Muscle Gain",
  improve_endurance: "Endurance",
  general_fitness: "General Fitness"
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export function FitnessAnalyticsDashboard() {
  const { data: analytics, isLoading } = useQuery<FitnessAnalytics>({
    queryKey: ["/api/fitness-goals/analytics"],
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="fitness-analytics__loading space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="fitness-analytics__skeleton h-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
        <div className="fitness-analytics__skeleton h-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="fitness-analytics__no-data">
        <CardContent className="pt-6">
          <div className="text-center">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground">
              Complete some workouts and set fitness goals to see your analytics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalWorkouts = analytics.weeklyProgress.reduce((sum, week) => sum + week.workouts, 0);
  const totalXp = analytics.weeklyProgress.reduce((sum, week) => sum + week.totalXp, 0);
  const totalVolume = analytics.weeklyProgress.reduce((sum, week) => sum + week.totalVolume, 0);
  const avgWorkoutsPerWeek = analytics.weeklyProgress.length > 0 ? totalWorkouts / analytics.weeklyProgress.length : 0;

  const strengthTrend = analytics.strengthTrend.length > 1 
    ? analytics.strengthTrend[analytics.strengthTrend.length - 1] - analytics.strengthTrend[0]
    : 0;
  const staminaTrend = analytics.staminaTrend.length > 1 
    ? analytics.staminaTrend[analytics.staminaTrend.length - 1] - analytics.staminaTrend[0]
    : 0;
  const agilityTrend = analytics.agilityTrend.length > 1 
    ? analytics.agilityTrend[analytics.agilityTrend.length - 1] - analytics.agilityTrend[0]
    : 0;

  const statTrendData = analytics.strengthTrend.map((strength, index) => ({
    session: index + 1,
    strength,
    stamina: analytics.staminaTrend[index] || 0,
    agility: analytics.agilityTrend[index] || 0,
  }));

  const goalProgressData = analytics.goalAchievements.map((goal, index) => ({
    name: goalTypeLabels[goal.goalType as keyof typeof goalTypeLabels] || goal.goalType,
    progress: goal.progress,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="fitness-analytics space-y-6">
      <div className="fitness-analytics__header">
        <h2 className="fitness-analytics__title text-2xl font-bold">Fitness Analytics</h2>
        <p className="fitness-analytics__subtitle text-muted-foreground">
          Track your progress and achievements over time
        </p>
      </div>

      {/* Summary Cards */}
      <div className="fitness-analytics__summary grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkouts}</div>
            <p className="text-xs text-muted-foreground">
              {avgWorkoutsPerWeek.toFixed(1)} per week average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalXp}</div>
            <p className="text-xs text-muted-foreground">
              From completed workouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVolume}</div>
            <p className="text-xs text-muted-foreground">
              kg lifted in total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.goalAchievements.length}</div>
            <p className="text-xs text-muted-foreground">
              Fitness goals in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goal Progress Overview */}
      {analytics.goalAchievements.length > 0 && (
        <div className="fitness-analytics__goals grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Goal Progress</CardTitle>
              <CardDescription>
                Your progress towards each fitness goal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.goalAchievements.map((goal, index) => (
                  <div key={goal.goalType} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {goalTypeLabels[goal.goalType as keyof typeof goalTypeLabels] || goal.goalType}
                      </span>
                      <span>{goal.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="flex space-x-1">
                      {goal.milestones.map((milestone, mIndex) => (
                        <Badge
                          key={mIndex}
                          variant={milestone.achieved ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {milestone.percentage}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Goal Distribution</CardTitle>
              <CardDescription>
                Breakdown of your fitness focus areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={goalProgressData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="progress"
                    label={({ name, progress }) => `${name}: ${progress.toFixed(0)}%`}
                  >
                    {goalProgressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stat Trends */}
      {statTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stat Progression</CardTitle>
            <CardDescription>
              Your strength, stamina, and agility gains over recent workouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 mb-4 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                {strengthTrend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Strength: +{strengthTrend}</span>
              </div>
              <div className="flex items-center space-x-2">
                {staminaTrend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Stamina: +{staminaTrend}</span>
              </div>
              <div className="flex items-center space-x-2">
                {agilityTrend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Agility: +{agilityTrend}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="strength" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="stamina" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="agility" stroke="#ffc658" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Weekly Progress */}
      {analytics.weeklyProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>
              Your workout frequency and performance over the past weeks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="workouts" fill="#8884d8" name="Workouts" />
                <Bar dataKey="totalXp" fill="#82ca9d" name="XP Earned" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}