/**
 * Day 4: Advanced Analytics Dashboard
 * 
 * Comprehensive user analytics with data visualization:
 * - Workout performance trends and insights
 * - Progression analytics with predictive modeling
 * - Comparative analysis with peer benchmarks
 * - Achievement tracking and goal recommendations
 */

import { memo, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Target,
  Award,
  Calendar,
  Zap,
  Activity,
  Users,
  Flame,
  Trophy,
  Clock,
  Heart
} from 'lucide-react';

interface AnalyticsData {
  workoutFrequency: Array<{ date: string; workouts: number; xp: number }>;
  statProgression: Array<{ date: string; strength: number; stamina: number; agility: number }>;
  performanceMetrics: {
    totalWorkouts: number;
    averageWorkoutDuration: number;
    totalXpEarned: number;
    currentStreak: number;
    longestStreak: number;
    workoutsThisWeek: number;
    workoutsThisMonth: number;
  };
  achievements: Array<{ name: string; date: string; rarity: string }>;
  goals: Array<{ name: string; progress: number; target: number; dueDate: string }>;
  peerComparison: {
    rank: number;
    totalUsers: number;
    percentile: number;
  };
}

interface AdvancedAnalyticsDashboardProps {
  className?: string;
  timeframe?: '7d' | '30d' | '90d' | '1y';
}

export const AdvancedAnalyticsDashboard = memo(({ 
  className,
  timeframe = '30d'
}: AdvancedAnalyticsDashboardProps) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics/dashboard', timeframe],
    staleTime: 300000, // 5 minutes
  });

  // Fetch user stats for context
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    staleTime: 30000,
  });

  // Calculate insights and trends
  const insights = useMemo(() => {
    if (!analyticsData) return null;

    const { workoutFrequency, statProgression, performanceMetrics } = analyticsData;

    // Workout frequency trend
    const recentWorkouts = workoutFrequency.slice(-7);
    const prevWorkouts = workoutFrequency.slice(-14, -7);
    const avgRecent = recentWorkouts.reduce((sum, d) => sum + d.workouts, 0) / recentWorkouts.length;
    const avgPrev = prevWorkouts.reduce((sum, d) => sum + d.workouts, 0) / prevWorkouts.length;
    const workoutTrend = avgRecent - avgPrev;

    // XP trend
    const recentXp = recentWorkouts.reduce((sum, d) => sum + d.xp, 0);
    const prevXp = prevWorkouts.reduce((sum, d) => sum + d.xp, 0);
    const xpTrend = recentXp - prevXp;

    // Stat progression analysis
    const latestStats = statProgression[statProgression.length - 1];
    const earlierStats = statProgression[Math.max(0, statProgression.length - 8)];
    const statGains = {
      strength: latestStats.strength - earlierStats.strength,
      stamina: latestStats.stamina - earlierStats.stamina,
      agility: latestStats.agility - earlierStats.agility
    };

    // Performance scoring
    const consistencyScore = Math.min(100, (performanceMetrics.currentStreak / 30) * 100);
    const progressScore = Math.min(100, ((statGains.strength + statGains.stamina + statGains.agility) / 3) * 10);
    const activityScore = Math.min(100, (performanceMetrics.workoutsThisWeek / 5) * 100);
    const overallScore = Math.round((consistencyScore + progressScore + activityScore) / 3);

    return {
      workoutTrend,
      xpTrend,
      statGains,
      scores: {
        overall: overallScore,
        consistency: Math.round(consistencyScore),
        progress: Math.round(progressScore),
        activity: Math.round(activityScore)
      },
      predictions: {
        nextLevelDays: Math.ceil((100 - (userStats?.experience || 0) % 100) / (recentXp / 7)),
        monthlyXpProjection: Math.round(recentXp * 4.3)
      }
    };
  }, [analyticsData, userStats]);

  // Chart color schemes
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#10B981', 
    tertiary: '#F59E0B',
    quaternary: '#EF4444',
    muted: '#6B7280'
  };

  if (isLoading || !analyticsData) {
    return (
      <Card className={`advanced-analytics-dashboard ${className || ''}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`advanced-analytics-dashboard space-y-6 ${className || ''}`}>
      {/* Header with Key Metrics */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-blue-400" />
              <span>Advanced Analytics</span>
            </div>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              {timeframe.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-blue-400">
                {analyticsData.performanceMetrics.totalWorkouts}
              </div>
              <p className="text-xs text-muted-foreground">Total Workouts</p>
              {insights && (
                <div className={`flex items-center justify-center space-x-1 text-xs ${
                  insights.workoutTrend >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {insights.workoutTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{Math.abs(insights.workoutTrend).toFixed(1)}/week</span>
                </div>
              )}
            </div>
            
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-green-400">
                {analyticsData.performanceMetrics.totalXpEarned}
              </div>
              <p className="text-xs text-muted-foreground">Total XP</p>
              {insights && (
                <div className={`flex items-center justify-center space-x-1 text-xs ${
                  insights.xpTrend >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {insights.xpTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>+{Math.abs(insights.xpTrend)} this week</span>
                </div>
              )}
            </div>
            
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-yellow-400">
                {analyticsData.performanceMetrics.currentStreak}
              </div>
              <p className="text-xs text-muted-foreground">Current Streak</p>
              <p className="text-xs text-green-400">
                Best: {analyticsData.performanceMetrics.longestStreak}
              </p>
            </div>
            
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-purple-400">
                {insights?.scores.overall || 0}
              </div>
              <p className="text-xs text-muted-foreground">Performance Score</p>
              <Progress value={insights?.scores.overall || 0} className="h-1 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progression">Progression</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Workout Frequency Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Workout Frequency</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analyticsData.workoutFrequency}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="workouts"
                      stroke={chartColors.primary}
                      fill={chartColors.primary}
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* XP Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>XP Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analyticsData.workoutFrequency}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="xp"
                      stroke={chartColors.secondary}
                      strokeWidth={2}
                      dot={{ fill: chartColors.secondary, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Scores */}
          {insights && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-blue-500/30">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{insights.scores.overall}</div>
                  <p className="text-xs text-muted-foreground">Overall Score</p>
                  <Progress value={insights.scores.overall} className="h-2 mt-2" />
                </CardContent>
              </Card>
              
              <Card className="border-green-500/30">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{insights.scores.consistency}</div>
                  <p className="text-xs text-muted-foreground">Consistency</p>
                  <Progress value={insights.scores.consistency} className="h-2 mt-2" />
                </CardContent>
              </Card>
              
              <Card className="border-yellow-500/30">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{insights.scores.progress}</div>
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <Progress value={insights.scores.progress} className="h-2 mt-2" />
                </CardContent>
              </Card>
              
              <Card className="border-purple-500/30">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{insights.scores.activity}</div>
                  <p className="text-xs text-muted-foreground">Activity</p>
                  <Progress value={insights.scores.activity} className="h-2 mt-2" />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Progression Tab */}
        <TabsContent value="progression" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Stat Progression Line Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Stat Progression Over Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.statProgression}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="strength"
                      stroke={chartColors.quaternary}
                      strokeWidth={2}
                      name="Strength"
                    />
                    <Line
                      type="monotone"
                      dataKey="stamina"
                      stroke={chartColors.secondary}
                      strokeWidth={2}
                      name="Stamina"
                    />
                    <Line
                      type="monotone"
                      dataKey="agility"
                      stroke={chartColors.tertiary}
                      strokeWidth={2}
                      name="Agility"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Stat Distribution Radar */}
            {userStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Current Stat Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={[
                      {
                        stat: 'Strength',
                        value: userStats.strength,
                        fullMark: Math.max(userStats.strength, userStats.stamina, userStats.agility) + 10
                      },
                      {
                        stat: 'Stamina',
                        value: userStats.stamina,
                        fullMark: Math.max(userStats.strength, userStats.stamina, userStats.agility) + 10
                      },
                      {
                        stat: 'Agility',
                        value: userStats.agility,
                        fullMark: Math.max(userStats.strength, userStats.stamina, userStats.agility) + 10
                      }
                    ]}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="stat" stroke="#9CA3AF" fontSize={12} />
                      <PolarRadiusAxis stroke="#9CA3AF" fontSize={10} />
                      <Radar
                        name="Stats"
                        dataKey="value"
                        stroke={chartColors.primary}
                        fill={chartColors.primary}
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Recent Stat Gains */}
            {insights && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Award className="h-4 w-4" />
                    <span>Recent Gains ({timeframe})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="text-sm">Strength</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${
                        insights.statGains.strength >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {insights.statGains.strength >= 0 ? '+' : ''}{insights.statGains.strength}
                      </span>
                      {insights.statGains.strength >= 0 ? 
                        <TrendingUp className="h-3 w-3 text-green-400" /> :
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      }
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-sm">Stamina</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${
                        insights.statGains.stamina >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {insights.statGains.stamina >= 0 ? '+' : ''}{insights.statGains.stamina}
                      </span>
                      {insights.statGains.stamina >= 0 ? 
                        <TrendingUp className="h-3 w-3 text-green-400" /> :
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      }
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm">Agility</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${
                        insights.statGains.agility >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {insights.statGains.agility >= 0 ? '+' : ''}{insights.statGains.agility}
                      </span>
                      {insights.statGains.agility >= 0 ? 
                        <TrendingUp className="h-3 w-3 text-green-400" /> :
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Workout Duration Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Avg Workout Duration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {Math.round(analyticsData.performanceMetrics.averageWorkoutDuration)}
                </div>
                <p className="text-sm text-muted-foreground">minutes</p>
                <p className="text-xs text-green-400 mt-2">
                  Optimal range: 30-60 min
                </p>
              </CardContent>
            </Card>

            {/* Weekly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>This Week</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {analyticsData.performanceMetrics.workoutsThisWeek}
                </div>
                <p className="text-sm text-muted-foreground">workouts</p>
                <Progress 
                  value={(analyticsData.performanceMetrics.workoutsThisWeek / 7) * 100}
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>

            {/* Monthly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>This Month</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {analyticsData.performanceMetrics.workoutsThisMonth}
                </div>
                <p className="text-sm text-muted-foreground">workouts</p>
                <Progress 
                  value={(analyticsData.performanceMetrics.workoutsThisMonth / 30) * 100}
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Peer Comparison */}
          {analyticsData.peerComparison && (
            <Card className="border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Community Ranking</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div>
                  <div className="text-4xl font-bold text-yellow-400">
                    #{analyticsData.peerComparison.rank}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    out of {analyticsData.peerComparison.totalUsers.toLocaleString()} users
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-400">
                    Top {100 - analyticsData.peerComparison.percentile}% of users
                  </p>
                  <Progress 
                    value={100 - analyticsData.peerComparison.percentile}
                    className="h-3 mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Predictions */}
          {insights && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-sm">Level Up Prediction</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {insights.predictions.nextLevelDays}
                  </div>
                  <p className="text-sm text-muted-foreground">days to next level</p>
                </CardContent>
              </Card>
              
              <Card className="border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-sm">Monthly XP Projection</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {insights.predictions.monthlyXpProjection}
                  </div>
                  <p className="text-sm text-muted-foreground">XP this month</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          {/* Active Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Active Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData.goals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No active goals. Set some goals to track your progress!
                </p>
              ) : (
                analyticsData.goals.map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{goal.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {new Date(goal.dueDate).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {goal.progress} / {goal.target}
                      </span>
                      <span className="text-green-400">
                        {Math.round((goal.progress / goal.target) * 100)}%
                      </span>
                    </div>
                    <Progress value={(goal.progress / goal.target) * 100} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Trophy className="h-4 w-4" />
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.achievements.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No recent achievements. Keep working out to unlock achievements!
                </p>
              ) : (
                <div className="space-y-3">
                  {analyticsData.achievements.slice(0, 5).map((achievement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                      <div className="flex items-center space-x-3">
                        <Trophy className={`h-4 w-4 ${
                          achievement.rarity === 'legendary' ? 'text-orange-400' :
                          achievement.rarity === 'epic' ? 'text-purple-400' :
                          achievement.rarity === 'rare' ? 'text-blue-400' :
                          'text-gray-400'
                        }`} />
                        <div>
                          <p className="font-medium">{achievement.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(achievement.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${
                        achievement.rarity === 'legendary' ? 'text-orange-400 border-orange-400' :
                        achievement.rarity === 'epic' ? 'text-purple-400 border-purple-400' :
                        achievement.rarity === 'rare' ? 'text-blue-400 border-blue-400' :
                        'text-gray-400 border-gray-400'
                      }`}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goal Suggestions */}
          <Card className="border-green-500/30">
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>Suggested Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="font-medium text-green-400">Consistency Challenge</p>
                <p className="text-sm text-muted-foreground">
                  Complete 5 workouts this week to maintain your streak
                </p>
                <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700">
                  Accept Goal
                </Button>
              </div>
              
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="font-medium text-blue-400">Strength Focus</p>
                <p className="text-sm text-muted-foreground">
                  Increase strength by 3 points this month
                </p>
                <Button size="sm" variant="outline" className="mt-2 border-blue-500/50">
                  Accept Goal
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

AdvancedAnalyticsDashboard.displayName = 'AdvancedAnalyticsDashboard';