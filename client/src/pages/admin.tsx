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
  Coins,
  UserX,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [addMonsterOpen, setAddMonsterOpen] = useState(false);
  const { toast } = useToast();

  const addExerciseMutation = useApiMutation({
    endpoint: '/api/admin/exercises',
    method: 'POST',
    onSuccess: () => {
      toast({
        title: "Exercise Added",
        description: "New exercise has been successfully created.",
      });
      setAddExerciseOpen(false);
      // Refresh exercises list
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Exercise",
        description: error.message || "Failed to create exercise",
        variant: "destructive",
      });
    }
  });

  const addMonsterMutation = useApiMutation({
    endpoint: '/api/admin/monsters',  
    method: 'POST',
    onSuccess: () => {
      toast({
        title: "Monster Added",
        description: "New monster has been successfully created.",
      });
      setAddMonsterOpen(false);
      // Refresh monsters list
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Monster",
        description: error.message || "Failed to create monster",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exercise Management */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Exercise Management</CardTitle>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setAddExerciseOpen(true)}
            >
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
            <Button 
              size="sm" 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setAddMonsterOpen(true)}
            >
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {monsters?.map((monster: any) => (
                  <MonsterListItem 
                    key={monster.id} 
                    monster={monster} 
                    onUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/admin/monsters'] });
                    }} 
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Exercise Dialog */}
      <Dialog open={addExerciseOpen} onOpenChange={setAddExerciseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Exercise</DialogTitle>
          </DialogHeader>
          <AddExerciseForm 
            onSubmit={(data) => addExerciseMutation.mutate(data)}
            isLoading={addExerciseMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Add Monster Dialog */}
      <Dialog open={addMonsterOpen} onOpenChange={setAddMonsterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Monster</DialogTitle>
          </DialogHeader>
          <AddMonsterForm 
            onSubmit={(data) => addMonsterMutation.mutate(data)}
            isLoading={addMonsterMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserManagement({ users, usersLoading, usersError, refetchUsers }: any) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const { toast } = useToast();

  const updateUserMutation = useMutation({
    mutationFn: async (data: { userId: string; updates: any }) => {
      const response = await fetch(`/api/admin/users/${data.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates)
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
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

  const banUserMutation = useMutation({
    mutationFn: async (data: { userId: string; banData: any }) => {
      const response = await apiRequest(`/api/admin/users/${data.userId}/ban`, {
        method: 'POST',
        body: data.banData
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "User Banned",
        description: "User has been successfully banned.",
      });
      setBanDialogOpen(false);
      setSelectedUser(null);
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Ban Failed",
        description: error.message || "Failed to ban user",
        variant: "destructive",
      });
    }
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "User Removed",
        description: "User has been permanently removed from the system.",
      });
      setRemoveDialogOpen(false);
      setSelectedUser(null);
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Remove Failed",
        description: error.message || "Failed to remove user",
        variant: "destructive",
      });
    }
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(`/api/admin/users/${userId}/unban`, {
        method: 'POST'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "User Unbanned",
        description: "User has been successfully unbanned.",
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Unban Failed",
        description: error.message || "Failed to unban user",
        variant: "destructive",
      });
    }
  });

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleBanUser = (user: any) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleRemoveUser = (user: any) => {
    setSelectedUser(user);
    setRemoveDialogOpen(true);
  };

  const handleUpdateUser = (updates: any) => {
    if (selectedUser) {
      updateUserMutation.mutate({ userId: selectedUser.id, updates });
    }
  };

  const handleBanSubmit = (banData: any) => {
    if (selectedUser) {
      banUserMutation.mutate({ userId: selectedUser.id, banData });
    }
  };

  const handleRemoveSubmit = () => {
    if (selectedUser) {
      removeUserMutation.mutate(selectedUser.id);
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
                      {user.isBanned ? (
                        <span className="text-red-400">🚫 BANNED</span>
                      ) : user.emailVerified ? (
                        <span className="text-green-400">✓ Verified</span>
                      ) : (
                        <span className="text-yellow-400">Not Verified</span>
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
                      title="Edit User"
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
                      title="Level Up (+5 levels, +500 XP, +2 all stats)"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpdateUser({ gold: user.gold + 1000 })}
                      className="text-yellow-400 border-yellow-400 hover:bg-yellow-500/10"
                      title="Add 1000 Gold"
                    >
                      <Coins className="w-4 h-4" />
                    </Button>
                    {user.isBanned ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => unbanUserMutation.mutate(user.id)}
                        className="text-green-400 border-green-400 hover:bg-green-500/10"
                        title="Unban User"
                        disabled={unbanUserMutation.isPending}
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBanUser(user)}
                        className="text-orange-400 border-orange-400 hover:bg-orange-500/10"
                        title="Ban User"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRemoveUser(user)}
                      className="text-red-400 border-red-400 hover:bg-red-500/10"
                      title="Permanently Remove User"
                    >
                      <Trash2 className="w-4 h-4" />
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

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-400">
              <UserX className="w-5 h-5" />
              Ban User: {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <BanUserForm 
              user={selectedUser} 
              onSubmit={handleBanSubmit}
              isLoading={banUserMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Remove User Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Remove User: {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <RemoveUserForm 
              user={selectedUser} 
              onSubmit={handleRemoveSubmit}
              isLoading={removeUserMutation.isPending}
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

function AddExerciseForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    muscleGroups: "",
    description: "",
    statTypes: JSON.stringify({ strength: 70, stamina: 20, agility: 10 })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse statTypes back to JSON
    let statTypesObject;
    try {
      statTypesObject = JSON.parse(formData.statTypes);
    } catch {
      statTypesObject = { strength: 70, stamina: 20, agility: 10 };
    }

    onSubmit({
      ...formData,
      muscleGroups: formData.muscleGroups.split(',').map(mg => mg.trim()).filter(mg => mg),
      statTypes: statTypesObject
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="exerciseName">Exercise Name</Label>
        <Input
          id="exerciseName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Push-up, Squat, Bench Press"
          required
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="e.g., Upper Body, Lower Body, Cardio"
          required
        />
      </div>

      <div>
        <Label htmlFor="muscleGroups">Muscle Groups (comma-separated)</Label>
        <Input
          id="muscleGroups"
          value={formData.muscleGroups}
          onChange={(e) => setFormData({ ...formData, muscleGroups: e.target.value })}
          placeholder="e.g., Chest, Shoulders, Triceps"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the exercise"
        />
      </div>

      <div>
        <Label htmlFor="statTypes">Stat Distribution (JSON)</Label>
        <Input
          id="statTypes"
          value={formData.statTypes}
          onChange={(e) => setFormData({ ...formData, statTypes: e.target.value })}
          placeholder='{"strength": 70, "stamina": 20, "agility": 10}'
        />
        <p className="text-xs text-muted-foreground mt-1">Total should equal 100</p>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Exercise"}
        </Button>
      </div>
    </form>
  );
}

function AddMonsterForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    name: "",
    level: 1,
    hp: 100,
    damage: 10,
    tier: "E",
    zone: "",
    goldReward: 50,
    description: "",
    avatar: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      level: parseInt(formData.level.toString()),
      hp: parseInt(formData.hp.toString()),
      damage: parseInt(formData.damage.toString()),
      goldReward: parseInt(formData.goldReward.toString())
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="monsterName">Monster Name</Label>
        <Input
          id="monsterName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Goblin Warrior, Ancient Dragon"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="level">Level</Label>
          <Input
            id="level"
            type="number"
            min="1"
            max="50"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="tier">Tier</Label>
          <select
            id="tier"
            value={formData.tier}
            onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            required
          >
            <option value="E">E-rank</option>
            <option value="D">D-rank</option>
            <option value="C">C-rank</option>
            <option value="B">B-rank</option>
            <option value="A">A-rank</option>
            <option value="S">S-rank</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hp">HP</Label>
          <Input
            id="hp"
            type="number"
            min="1"
            value={formData.hp}
            onChange={(e) => setFormData({ ...formData, hp: parseInt(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="damage">Damage</Label>
          <Input
            id="damage"
            type="number"
            min="1"
            value={formData.damage}
            onChange={(e) => setFormData({ ...formData, damage: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="zone">Zone</Label>
          <Input
            id="zone"
            value={formData.zone}
            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            placeholder="e.g., Goblin Caves, Dragon's Lair"
            required
          />
        </div>
        <div>
          <Label htmlFor="goldReward">Gold Reward</Label>
          <Input
            id="goldReward"
            type="number"
            min="1"
            value={formData.goldReward}
            onChange={(e) => setFormData({ ...formData, goldReward: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="monsterDescription">Description</Label>
        <Input
          id="monsterDescription"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the monster"
        />
      </div>

      <div>
        <Label htmlFor="avatar">Avatar URL</Label>
        <Input
          id="avatar"
          value={formData.avatar}
          onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
          placeholder="Enter image URL for monster avatar"
        />
        {formData.avatar && (
          <div className="mt-2 flex items-center space-x-2">
            <img 
              src={formData.avatar} 
              alt="Avatar preview"
              className="w-12 h-12 object-contain border rounded"
              style={{ imageRendering: 'pixelated' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-xs text-muted-foreground">Preview</span>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Monster"}
        </Button>
      </div>
    </form>
  );
}

function MonsterListItem({ monster, onUpdate }: { monster: any; onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(monster.avatar || '');
  const { toast } = useToast();

  const updateMonsterMutation = useMutation({
    mutationFn: async (data: { id: number; avatar: string }) => {
      const response = await fetch(`/api/admin/monsters/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: data.avatar })
      });
      if (!response.ok) throw new Error('Failed to update monster');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Monster Updated",
        description: "Monster avatar has been successfully updated.",
      });
      setIsEditing(false);
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Monster",
        description: error.message || "Failed to update monster",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    updateMonsterMutation.mutate({ id: monster.id, avatar: avatarUrl });
  };

  const handleCancel = () => {
    setAvatarUrl(monster.avatar || '');
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-muted rounded-lg border">
      <div className="flex items-center space-x-4 flex-1">
        {/* Monster Avatar */}
        <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center flex-shrink-0">
          {(isEditing ? avatarUrl : monster.avatar) ? (
            <img 
              src={isEditing ? avatarUrl : monster.avatar} 
              alt={monster.name}
              className="w-full h-full object-contain rounded"
              style={{ imageRendering: 'pixelated' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ display: (isEditing ? avatarUrl : monster.avatar) ? 'none' : 'flex' }}>
            <Sword className="w-8 h-8" />
          </div>
        </div>

        {/* Monster Info */}
        <div className="flex-1">
          <div className="font-medium text-foreground">{monster.name}</div>
          <div className="text-sm text-muted-foreground">
            Level {monster.level} • {monster.tier}-rank • HP: {monster.maxHp} • ATK: {monster.attack}
          </div>
          <div className="text-xs text-yellow-400">
            Gold Reward: {monster.goldReward}
          </div>
          
          {isEditing && (
            <div className="mt-2">
              <Label htmlFor={`avatar-${monster.id}`} className="text-xs">Avatar URL</Label>
              <Input
                id={`avatar-${monster.id}`}
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Enter image URL"
                className="mt-1 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 ml-4">
        {isEditing ? (
          <>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={updateMonsterMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updateMonsterMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
              disabled={updateMonsterMutation.isPending}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsEditing(true)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit Avatar
          </Button>
        )}
      </div>
    </div>
  );
}

function BanUserForm({ user, onSubmit, isLoading }: { user: any; onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    reason: "",
    duration: "permanent"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      return;
    }
    
    const banData = {
      reason: formData.reason.trim(),
      duration: formData.duration === "permanent" ? "permanent" : formData.duration
    };
    
    onSubmit(banData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
        <div className="flex items-start space-x-3">
          <UserX className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-orange-800 dark:text-orange-200">Ban User Account</h4>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              This will prevent <strong>{user.username}</strong> from logging in or accessing the application.
            </p>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="banReason">Reason for Ban *</Label>
        <Textarea
          id="banReason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Enter the reason for banning this user (e.g., violation of terms of service, inappropriate behavior, spam, etc.)"
          rows={3}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="banDuration">Ban Duration</Label>
        <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select ban duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="permanent">Permanent Ban</SelectItem>
            <SelectItem value="2025-02-28">1 Month (until Feb 28, 2025)</SelectItem>
            <SelectItem value="2025-03-31">2 Months (until Mar 31, 2025)</SelectItem>
            <SelectItem value="2025-06-30">6 Months (until Jun 30, 2025)</SelectItem>
            <SelectItem value="2025-12-31">1 Year (until Dec 31, 2025)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.reason.trim()}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isLoading ? "Banning..." : "Ban User"}
        </Button>
      </div>
    </form>
  );
}

function RemoveUserForm({ user, onSubmit, isLoading }: { user: any; onSubmit: () => void; isLoading: boolean }) {
  const [confirmText, setConfirmText] = useState("");
  const confirmPhrase = `DELETE ${user.username}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText === confirmPhrase) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800 dark:text-red-200">Permanently Remove User</h4>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              This action is <strong>irreversible</strong>. It will permanently delete:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 mt-2 list-disc list-inside space-y-1">
              <li>User account and profile data</li>
              <li>All workout sessions and progress</li>
              <li>Battle history and achievements</li>
              <li>Character stats and progression</li>
              <li>Purchase history and subscriptions</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">User Details:</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <div><strong>Username:</strong> {user.username}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Level:</strong> {user.level}</div>
            <div><strong>Total XP:</strong> {user.experience}</div>
            <div><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="confirmText">
          Type <code className="bg-muted px-2 py-1 rounded text-red-600">{confirmPhrase}</code> to confirm deletion
        </Label>
        <Input
          id="confirmText"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={confirmPhrase}
          className="mt-1 font-mono"
          autoComplete="off"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || confirmText !== confirmPhrase}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isLoading ? "Removing..." : "Permanently Delete User"}
        </Button>
      </div>
    </form>
  );
}