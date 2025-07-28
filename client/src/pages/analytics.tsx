import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Users, UserPlus, TrendingUp, DollarSign, 
  Activity, Target, Award, Calendar 
} from "lucide-react";

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  averageLevel: number;
  totalWorkoutsSessions: number;
  averageSessionsPerUser: number;
}

interface RetentionMetrics {
  dailyRetention: { date: string; users: number }[];
  weeklyRetention: { week: string; users: number }[];
  monthlyRetention: { month: string; users: number }[];
  cohortRetention: {
    cohort: string;
    day1: number;
    day7: number;
    day30: number;
  }[];
}

interface EngagementMetrics {
  workoutCompletionRate: number;
  averageSessionDuration: number;
  battlesPerUser: number;
  averageXpPerUser: number;
  mostPopularExercises: { name: string; count: number }[];
  levelDistribution: { level: number; count: number }[];
}

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  subscriptionConversionRate: number;
  churnRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function MetricCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <p className="text-xs text-green-600 mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { data: userMetrics, isLoading: userLoading } = useQuery<UserMetrics>({
    queryKey: ['/api/analytics/users'],
  });

  const { data: retentionMetrics, isLoading: retentionLoading } = useQuery<RetentionMetrics>({
    queryKey: ['/api/analytics/retention'],
  });

  const { data: engagementMetrics, isLoading: engagementLoading } = useQuery<EngagementMetrics>({
    queryKey: ['/api/analytics/engagement'],
  });

  const { data: revenueMetrics, isLoading: revenueLoading } = useQuery<RevenueMetrics>({
    queryKey: ['/api/analytics/revenue'],
  });

  if (userLoading || retentionLoading || engagementLoading || revenueLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into user engagement and business metrics
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Users"
              value={userMetrics?.totalUsers || 0}
              subtitle="Registered users"
              icon={Users}
              trend="+12% from last month"
            />
            <MetricCard
              title="Active Users"
              value={userMetrics?.activeUsers || 0}
              subtitle="Active in last 7 days"
              icon={Activity}
              trend="+8% from last week"
            />
            <MetricCard
              title="Total Revenue"
              value={`$${revenueMetrics?.totalRevenue?.toFixed(2) || '0.00'}`}
              subtitle="All time revenue"
              icon={DollarSign}
              trend="+15% from last month"
            />
            <MetricCard
              title="Avg Session Duration"
              value={`${engagementMetrics?.averageSessionDuration || 0}min`}
              subtitle="Per workout session"
              icon={Target}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
                <CardDescription>User activity over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={retentionMetrics?.dailyRetention || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="users" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Level Distribution</CardTitle>
                <CardDescription>Distribution of user levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementMetrics?.levelDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="New Users Today"
              value={userMetrics?.newUsersToday || 0}
              icon={UserPlus}
            />
            <MetricCard
              title="New Users This Week"
              value={userMetrics?.newUsersThisWeek || 0}
              icon={UserPlus}
            />
            <MetricCard
              title="New Users This Month"
              value={userMetrics?.newUsersThisMonth || 0}
              icon={UserPlus}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly User Growth</CardTitle>
                <CardDescription>Active users by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={retentionMetrics?.monthlyRetention || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cohort Retention</CardTitle>
                <CardDescription>User retention by signup cohort</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={retentionMetrics?.cohortRetention || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="day1" fill="#8884d8" name="Day 1" />
                    <Bar dataKey="day7" fill="#82ca9d" name="Day 7" />
                    <Bar dataKey="day30" fill="#ffc658" name="Day 30" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Workout Completion Rate"
              value={`${engagementMetrics?.workoutCompletionRate || 0}%`}
              icon={Target}
            />
            <MetricCard
              title="Avg XP Per User"
              value={engagementMetrics?.averageXpPerUser || 0}
              icon={Award}
            />
            <MetricCard
              title="Battles Per User"
              value={engagementMetrics?.battlesPerUser || 0}
              icon={Activity}
            />
            <MetricCard
              title="Avg Level"
              value={userMetrics?.averageLevel || 0}
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Exercises</CardTitle>
                <CardDescription>Exercises used most frequently</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementMetrics?.mostPopularExercises || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Retention</CardTitle>
                <CardDescription>Active users by week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={retentionMetrics?.weeklyRetention || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="week" 
                      tickFormatter={(value) => value.split(' ')[2]} // Show just the date
                    />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Monthly Recurring Revenue"
              value={`$${revenueMetrics?.monthlyRecurringRevenue?.toFixed(2) || '0.00'}`}
              subtitle="MRR"
              icon={DollarSign}
              trend="+8% from last month"
            />
            <MetricCard
              title="Average Revenue Per User"
              value={`$${revenueMetrics?.averageRevenuePerUser?.toFixed(2) || '0.00'}`}
              subtitle="ARPU"
              icon={Users}
            />
            <MetricCard
              title="Customer Lifetime Value"
              value={`$${revenueMetrics?.lifetimeValue?.toFixed(2) || '0.00'}`}
              subtitle="LTV"
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Metrics</CardTitle>
                <CardDescription>Conversion and churn rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <span className="text-2xl font-bold text-green-600">
                    {revenueMetrics?.subscriptionConversionRate?.toFixed(1) || '0.0'}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Churn Rate</span>
                  <span className="text-2xl font-bold text-red-600">
                    {revenueMetrics?.churnRate?.toFixed(1) || '0.0'}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Workouts</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {userMetrics?.totalWorkoutsSessions || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Projections</CardTitle>
                <CardDescription>Based on current metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Projected Annual Revenue</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${((revenueMetrics?.monthlyRecurringRevenue || 0) * 12).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Break-even Users</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {Math.ceil(1000 / (revenueMetrics?.averageRevenuePerUser || 1))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Growth Rate Needed</span>
                  <span className="text-2xl font-bold text-orange-600">15%/month</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}