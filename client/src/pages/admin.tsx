import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/ui/loading-spinner';
import { ApiError } from '@/components/ui/api-error';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { 
  Users, 
  Activity, 
  Trophy, 
  Sword, 
  TrendingUp, 
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Settings
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  
  const { 
    data: analytics, 
    isLoading: analyticsLoading, 
    error: analyticsError,
    refetch: refetchAnalytics
  } = useApiQuery({
    queryKey: ['/api/admin/analytics'],
    endpoint: '/api/admin/analytics',
    enabled: activeTab === 'analytics'
  });

  const { 
    data: exercises, 
    isLoading: exercisesLoading, 
    error: exercisesError 
  } = useApiQuery({
    queryKey: ['/api/admin/exercises'],
    endpoint: '/api/admin/exercises',
    enabled: activeTab === 'content'
  });

  const { 
    data: monsters, 
    isLoading: monstersLoading, 
    error: monstersError 
  } = useApiQuery({
    queryKey: ['/api/admin/monsters'],
    endpoint: '/api/admin/monsters',
    enabled: activeTab === 'content'
  });

  if (analyticsLoading && activeTab === 'analytics') {
    return <LoadingState>Loading analytics dashboard...</LoadingState>;
  }

  if (analyticsError && activeTab === 'analytics') {
    return <ApiError error={analyticsError} onRetry={refetchAnalytics} />;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Manage your RPG fitness application</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-game-slate">
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Content Management</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>User Management</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && <AnalyticsOverview data={analytics} />}
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentManagement 
            exercises={exercises} 
            monsters={monsters}
            exercisesLoading={exercisesLoading}
            monstersLoading={monstersLoading}
            exercisesError={exercisesError}
            monstersError={monstersError}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnalyticsOverview({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* User Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-game-slate border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.userEngagement.totalUsers}</div>
            <p className="text-xs text-gray-400">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-game-slate border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Users (24h)</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.userEngagement.activeUsers24h}</div>
            <p className="text-xs text-gray-400">Daily active users</p>
          </CardContent>
        </Card>

        <Card className="bg-game-slate border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Retention Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.userEngagement.retentionRate}%</div>
            <p className="text-xs text-gray-400">30-day retention</p>
          </CardContent>
        </Card>

        <Card className="bg-game-slate border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Workouts</CardTitle>
            <Activity className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.workoutStats.totalWorkouts}</div>
            <p className="text-xs text-gray-400">Completed sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-game-slate border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>Top Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.achievementStats.topAchievements.map((achievement: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-300">{achievement.name}</span>
                  <div className="text-right">
                    <div className="text-white font-semibold">{achievement.unlocks} unlocks</div>
                    <div className="text-xs text-gray-400">{achievement.percentage}% of users</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-game-slate border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sword className="w-5 h-5 text-red-400" />
              <span>Battle Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Battles</span>
                <span className="text-white font-semibold">{data.battleStats.totalBattles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Avg per User</span>
                <span className="text-white font-semibold">{data.battleStats.averageBattlesPerUser}</span>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Most Defeated Monsters</h4>
                <div className="space-y-2">
                  {data.battleStats.topMonsters.slice(0, 3).map((monster: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-400">{monster.name}</span>
                      <span className="text-white">{monster.defeatedCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Progression */}
      <Card className="bg-game-slate border-gray-700">
        <CardHeader>
          <CardTitle>User Progression Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{data.userProgression.averageLevel}</div>
              <div className="text-sm text-gray-400">Average Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{data.userProgression.averageStrength}</div>
              <div className="text-sm text-gray-400">Average Strength</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{data.userProgression.averageStamina}</div>
              <div className="text-sm text-gray-400">Average Stamina</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{data.userProgression.averageAgility}</div>
              <div className="text-sm text-gray-400">Average Agility</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContentManagement({ exercises, monsters, exercisesLoading, monstersLoading, exercisesError, monstersError }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exercise Management */}
        <Card className="bg-game-slate border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Exercise Management</CardTitle>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          </CardHeader>
          <CardContent>
            {exercisesLoading ? (
              <LoadingState>Loading exercises...</LoadingState>
            ) : exercisesError ? (
              <ApiError error={exercisesError} />
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {exercises?.map((exercise: any) => (
                  <div key={exercise.id} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <div>
                      <div className="font-medium text-white">{exercise.name}</div>
                      <div className="text-sm text-gray-400">{exercise.category}</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-400 border-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monster Management */}
        <Card className="bg-game-slate border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Monster Management</CardTitle>
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Monster
            </Button>
          </CardHeader>
          <CardContent>
            {monstersLoading ? (
              <LoadingState>Loading monsters...</LoadingState>
            ) : monstersError ? (
              <ApiError error={monstersError} />
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {monsters?.map((monster: any) => (
                  <div key={monster.id} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <div>
                      <div className="font-medium text-white">{monster.name}</div>
                      <div className="text-sm text-gray-400">Level {monster.level} • {monster.tier}-rank</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-400 border-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UserManagement() {
  return (
    <Card className="bg-game-slate border-gray-700">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>User management features coming soon</p>
          <p className="text-sm">Ability to view, edit, and moderate user accounts</p>
        </div>
      </CardContent>
    </Card>
  );
}