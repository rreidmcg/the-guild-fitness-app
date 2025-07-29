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
  Settings,
  Coins
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

  const { 
    data: users, 
    isLoading: usersLoading, 
    error: usersError,
    refetch: refetchUsers
  } = useApiQuery({
    queryKey: ['/api/admin/users'],
    endpoint: '/api/admin/users',
    enabled: activeTab === 'users'
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your RPG fitness application</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="analytics" className="flex items-center space-x-1 px-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="text-sm truncate">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center space-x-1 px-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Settings className="w-4 h-4 shrink-0" />
            <span className="text-sm truncate">Content</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-1 px-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Users className="w-4 h-4 shrink-0" />
            <span className="text-sm truncate">Users</span>
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
          <UserManagement 
            users={users} 
            usersLoading={usersLoading} 
            usersError={usersError}
            refetchUsers={refetchUsers}
          />
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
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.userEngagement.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users (24h)</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.userEngagement.activeUsers24h}</div>
            <p className="text-xs text-muted-foreground">Daily active users</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Retention Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.userEngagement.retentionRate}%</div>
            <p className="text-xs text-muted-foreground">30-day retention</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workouts</CardTitle>
            <Activity className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.workoutStats.totalWorkouts}</div>
            <p className="text-xs text-muted-foreground">Completed sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>Top Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.achievementStats.topAchievements.map((achievement: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{achievement.name}</span>
                  <div className="text-right">
                    <div className="text-foreground font-semibold">{achievement.unlocks} unlocks</div>
                    <div className="text-xs text-muted-foreground">{achievement.percentage}% of users</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <Sword className="w-5 h-5 text-red-400" />
              <span>Battle Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Battles</span>
                <span className="text-foreground font-semibold">{data.battleStats.totalBattles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg per User</span>
                <span className="text-foreground font-semibold">{data.battleStats.averageBattlesPerUser}</span>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Most Defeated Monsters</h4>
                <div className="space-y-2">
                  {data.battleStats.topMonsters.slice(0, 3).map((monster: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{monster.name}</span>
                      <span className="text-foreground">{monster.defeatedCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Progression */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">User Progression Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{data.userProgression.averageLevel}</div>
              <div className="text-sm text-muted-foreground">Average Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{data.userProgression.averageStrength}</div>
              <div className="text-sm text-muted-foreground">Average Strength</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{data.userProgression.averageStamina}</div>
              <div className="text-sm text-muted-foreground">Average Stamina</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{data.userProgression.averageAgility}</div>
              <div className="text-sm text-muted-foreground">Average Agility</div>
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
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Exercise Management</CardTitle>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
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
                  <div key={exercise.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div>
                      <div className="font-medium text-foreground">{exercise.name}</div>
                      <div className="text-sm text-muted-foreground">{exercise.category}</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-400 border-red-400 hover:bg-red-500/10">
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
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Monster Management</CardTitle>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
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
                  <div key={monster.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div>
                      <div className="font-medium text-foreground">{monster.name}</div>
                      <div className="text-sm text-muted-foreground">Level {monster.level} • {monster.tier}-rank</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-400 border-red-400 hover:bg-red-500/10">
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

function UserManagement({ users, usersLoading, usersError, refetchUsers }: any) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const updateUserMutation = useMutation({
    mutationFn: async (data: { userId: string; updates: any }) => {
      return await useApiMutation({ 
        endpoint: `/api/admin/users/${data.userId}`, 
        method: 'PATCH' 
      }).mutateAsync(data.updates);
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User has been successfully updated.",
      });
      setEditDialogOpen(false);
      setSelectedUser(null);
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  });

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleUpdateUser = (updates: any) => {
    if (selectedUser) {
      updateUserMutation.mutate({ userId: selectedUser.id, updates });
    }
  };

  if (usersLoading) {
    return <LoadingState>Loading users...</LoadingState>;
  }

  if (usersError) {
    return <ApiError error={usersError} onRetry={refetchUsers} />;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center justify-between">
          <span>User Management</span>
          <span className="text-sm text-muted-foreground font-normal">
            {users?.length || 0} users
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* User Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">{users?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {users?.filter((u: any) => u.emailVerified).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round((users?.reduce((acc: number, u: any) => acc + u.level, 0) || 0) / (users?.length || 1))}
              </div>
              <div className="text-sm text-muted-foreground">Avg Level</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                {users?.filter((u: any) => u.currentTitle?.includes('G.M.')).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {users?.map((user: any) => (
              <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted rounded-lg space-y-3 md:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{user.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.email} • Level {user.level} • {user.experience} XP
                    </div>
                    {user.currentTitle && (
                      <div className="text-xs text-purple-400">{user.currentTitle}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3">
                  <div className="text-left md:text-right text-sm">
                    <div className="text-foreground">
                      {user.emailVerified ? (
                        <span className="text-green-400">✓ Verified</span>
                      ) : (
                        <span className="text-red-400">Not Verified</span>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      STR: {user.strength} STA: {user.stamina} AGI: {user.agility}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const newLevel = Math.min(user.level + 5, 100);
                        const newXP = user.experience + 500;
                        handleUpdateUser({ 
                          level: newLevel, 
                          experience: newXP,
                          strength: user.strength + 2,
                          stamina: user.stamina + 2,
                          agility: user.agility + 2
                        });
                      }}
                      className="text-green-400 border-green-400 hover:bg-green-500/10"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpdateUser({ gold: user.gold + 1000 })}
                      className="text-yellow-400 border-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Coins className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!users || users.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* User Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserEditForm 
              user={selectedUser} 
              onSubmit={handleUpdateUser}
              isLoading={updateUserMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function UserEditForm({ user, onSubmit, isLoading }: { user: any; onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    level: user.level,
    experience: user.experience,
    strength: user.strength,
    stamina: user.stamina,
    agility: user.agility,
    gold: user.gold,
    gems: user.gems || 0,
    currentTitle: user.currentTitle || "",
    emailVerified: user.emailVerified
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="level">Level</Label>
          <Input
            id="level"
            type="number"
            min="1"
            max="100"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="experience">Experience</Label>
          <Input
            id="experience"
            type="number"
            min="0"
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="strength">Strength</Label>
          <Input
            id="strength"
            type="number"
            min="1"
            value={formData.strength}
            onChange={(e) => setFormData({ ...formData, strength: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="stamina">Stamina</Label>
          <Input
            id="stamina"
            type="number"
            min="1"
            value={formData.stamina}
            onChange={(e) => setFormData({ ...formData, stamina: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="agility">Agility</Label>
          <Input
            id="agility"
            type="number"
            min="1"
            value={formData.agility}
            onChange={(e) => setFormData({ ...formData, agility: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gold">Gold</Label>
          <Input
            id="gold"
            type="number"
            min="0"
            value={formData.gold}
            onChange={(e) => setFormData({ ...formData, gold: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="gems">Gems</Label>
          <Input
            id="gems"
            type="number"
            min="0"
            value={formData.gems}
            onChange={(e) => setFormData({ ...formData, gems: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="currentTitle">Current Title</Label>
        <Input
          id="currentTitle"
          value={formData.currentTitle}
          onChange={(e) => setFormData({ ...formData, currentTitle: e.target.value })}
          placeholder="Enter user title (e.g., <G.M.>, Dragon Vanquisher)"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="emailVerified"
          checked={formData.emailVerified}
          onChange={(e) => setFormData({ ...formData, emailVerified: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="emailVerified">Email Verified</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update User"}
        </Button>
      </div>
    </form>
  );
}