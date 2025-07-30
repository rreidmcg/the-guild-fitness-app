import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-spinner';
import { ApiError } from '@/components/ui/api-error';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
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
  Ban,
  Shield,
  AlertTriangle,
  Search,
  Calendar,
  Clock,
  UserX,
  Eye,
  Mail,
  Send,
  Gift,
  Coins,
  Star,
  Crown,
  Newspaper
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
        <h1 className="text-4xl font-bold text-white mb-2">Administrative Control Panel</h1>
        <p className="text-gray-400">Comprehensive management suite for The Guild: Gamified Fitness platform</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-game-slate">
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Content Manager</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>User Administration</span>
          </TabsTrigger>
          <TabsTrigger value="mailbox" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Admin Mailbox</span>
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

        <TabsContent value="mailbox" className="space-y-6">
          <AdminMailbox />
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
              <span>Achievement Analytics</span>
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
              <span>Combat Analytics</span>
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
          <CardTitle>Character Progression Analytics</CardTitle>
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
            <CardTitle>Exercise Library Management</CardTitle>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Exercise
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
                      <Button size="sm" variant="outline" title="Edit Exercise Details">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-400 border-red-400" title="Remove Exercise">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
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
            <CardTitle>Battle Monster Management</CardTitle>
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Monster
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
                      <Button size="sm" variant="outline" title="Edit Monster Properties">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-400 border-red-400" title="Remove Monster">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
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
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<'ban' | 'remove' | null>(null);
  const [banDuration, setBanDuration] = useState('');
  const [banReason, setBanReason] = useState('');
  const [removeReason, setRemoveReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Ban user mutation
  const banUserMutation = useApiMutation({
    endpoint: '/api/admin/ban-user',
    method: 'POST',
    onSuccess: () => {
      toast({
        title: "User Banned Successfully",
        description: `${selectedUser?.username} has been banned.`,
      });
      refetchUsers();
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Ban User",
        description: error.message || "Unable to ban user",
        variant: "destructive",
      });
    },
  });

  // Remove user mutation
  const removeUserMutation = useApiMutation({
    endpoint: '/api/admin/remove-user',
    method: 'POST',
    onSuccess: () => {
      toast({
        title: "User Removed Successfully",
        description: `${selectedUser?.username} has been permanently removed.`,
      });
      refetchUsers();
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove User",
        description: error.message || "Unable to remove user",
        variant: "destructive",
      });
    },
  });

  // Unban user mutation
  const unbanUserMutation = useApiMutation({
    endpoint: '/api/admin/unban-user',
    method: 'POST',
    onSuccess: () => {
      toast({
        title: "User Unbanned Successfully",
        description: "User has been restored and can access the platform again.",
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Unban User",
        description: error.message || "Unable to unban user",
        variant: "destructive",
      });
    },
  });

  const closeDialog = () => {
    setShowConfirmDialog(false);
    setSelectedUser(null);
    setActionType(null);
    setBanDuration('');
    setBanReason('');
    setRemoveReason('');
  };

  const handleBanUser = (user: any) => {
    setSelectedUser(user);
    setActionType('ban');
    setShowConfirmDialog(true);
  };

  const handleRemoveUser = (user: any) => {
    setSelectedUser(user);
    setActionType('remove');
    setShowConfirmDialog(true);
  };

  const confirmAction = () => {
    if (actionType === 'ban') {
      const banData = {
        userId: selectedUser.id,
        reason: banReason,
        duration: banDuration || null, // null = permanent
      };
      banUserMutation.mutate(banData);
    } else if (actionType === 'remove') {
      const removeData = {
        userId: selectedUser.id,
        reason: removeReason,
      };
      removeUserMutation.mutate(removeData);
    }
  };

  const getUserStatusBadge = (user: any) => {
    if (user.isDeleted) {
      return <Badge variant="destructive" className="text-xs">Deleted</Badge>;
    }
    if (user.isBanned) {
      const isTemporary = user.bannedUntil && new Date(user.bannedUntil) > new Date();
      return (
        <Badge variant="destructive" className="text-xs">
          {isTemporary ? 'Temp Banned' : 'Banned'}
        </Badge>
      );
    }
    return <Badge variant="secondary" className="text-xs bg-green-600">Active</Badge>;
  };

  const filteredUsers = users?.filter((user: any) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (usersLoading) {
    return <LoadingState>Loading user accounts...</LoadingState>;
  }

  if (usersError) {
    return <ApiError error={usersError} onRetry={refetchUsers} />;
  }

  return (
    <>
      <Card className="bg-game-slate border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Account Management</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Administrator
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-xl font-bold text-white">{users?.length || 0}</div>
                      <div className="text-sm text-gray-400">Total Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-xl font-bold text-white">
                        {users?.filter((u: any) => !u.isBanned && !u.isDeleted).length || 0}
                      </div>
                      <div className="text-sm text-gray-400">Active Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Ban className="w-5 h-5 text-red-400" />
                    <div>
                      <div className="text-xl font-bold text-white">
                        {users?.filter((u: any) => u.isBanned).length || 0}
                      </div>
                      <div className="text-sm text-gray-400">Banned Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <UserX className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-xl font-bold text-white">
                        {users?.filter((u: any) => u.isDeleted).length || 0}
                      </div>
                      <div className="text-sm text-gray-400">Deleted Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUsers.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white">{user.username}</span>
                        {getUserStatusBadge(user)}
                        {user.currentTitle && (
                          <Badge variant="outline" className="text-xs">
                            {user.currentTitle}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {user.email} • Level {user.level} • Joined {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      {user.isBanned && (
                        <div className="text-xs text-red-400 mt-1">
                          Banned: {user.banReason} 
                          {user.bannedUntil && (
                            <span> (until {new Date(user.bannedUntil).toLocaleDateString()})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" title="View User Details">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {user.isBanned ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-green-400 border-green-400"
                        onClick={() => unbanUserMutation.mutate({ userId: user.id })}
                        disabled={unbanUserMutation.isPending}
                        title="Unban User"
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Unban
                      </Button>
                    ) : !user.isDeleted ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-yellow-400 border-yellow-400"
                          onClick={() => handleBanUser(user)}
                          title="Ban User"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Ban
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-400 border-red-400"
                          onClick={() => handleRemoveUser(user)}
                          title="Permanently Remove User"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        Deleted
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {actionType === 'ban' ? (
                <>
                  <Ban className="w-5 h-5 text-yellow-400" />
                  <span>Ban User Account</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span>Remove User Account</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="font-medium text-white">Target User: {selectedUser?.username}</div>
              <div className="text-sm text-gray-400">Email: {selectedUser?.email}</div>
              <div className="text-sm text-gray-400">Level: {selectedUser?.level}</div>
            </div>

            {actionType === 'ban' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="banDuration">Ban Duration</Label>
                  <Select value={banDuration} onValueChange={setBanDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ban duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Permanent Ban</SelectItem>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="7">1 Week</SelectItem>
                      <SelectItem value="14">2 Weeks</SelectItem>
                      <SelectItem value="30">1 Month</SelectItem>
                      <SelectItem value="90">3 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banReason">Reason for Ban *</Label>
                  <Textarea
                    id="banReason"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Provide a detailed reason for banning this user..."
                    className="min-h-20"
                  />
                </div>
              </>
            )}

            {actionType === 'remove' && (
              <div className="space-y-2">
                <Label htmlFor="removeReason">Reason for Removal *</Label>
                <Textarea
                  id="removeReason"
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  placeholder="Provide a detailed reason for permanently removing this user account..."
                  className="min-h-20"
                />
                <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Warning: This action is irreversible</span>
                  </div>
                  <div className="text-sm text-red-300 mt-1">
                    The user account and all associated data will be permanently deleted.
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={
                (actionType === 'ban' && !banReason.trim()) ||
                (actionType === 'remove' && !removeReason.trim()) ||
                banUserMutation.isPending ||
                removeUserMutation.isPending
              }
              className={actionType === 'ban' ? "bg-yellow-600 hover:bg-yellow-700" : "bg-red-600 hover:bg-red-700"}
            >
              {banUserMutation.isPending || removeUserMutation.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  {actionType === 'ban' ? (
                    <>
                      <Ban className="w-4 h-4 mr-2" />
                      Confirm Ban
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Confirm Removal
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminMailbox() {
  const { toast } = useToast();
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [mailSubject, setMailSubject] = useState('');
  const [mailContent, setMailContent] = useState('');
  const [mailType, setMailType] = useState('announcement');
  const [includeRewards, setIncludeRewards] = useState(false);
  const [goldReward, setGoldReward] = useState('');
  const [xpReward, setXpReward] = useState('');
  const [streakFreezeReward, setStreakFreezeReward] = useState('');
  const [potionReward, setPotionReward] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Send mail mutation
  const sendMailMutation = useApiMutation({
    endpoint: '/api/admin/send-mail',
    method: 'POST',
    onSuccess: (response: any) => {
      toast({
        title: "Mail Sent Successfully",
        description: `Notification sent to ${response.sentCount} users.`,
      });
      closeComposeDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Mail",
        description: error.message || "Unable to send notification",
        variant: "destructive",
      });
    },
  });

  const closeComposeDialog = () => {
    setShowComposeDialog(false);
    setMailSubject('');
    setMailContent('');
    setMailType('announcement');
    setIncludeRewards(false);
    setGoldReward('');
    setXpReward('');
    setStreakFreezeReward('');
    setPotionReward('');
    setExpiryDate('');
  };

  const handleSendMail = () => {
    if (!mailSubject.trim() || !mailContent.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Subject and content are required",
        variant: "destructive",
      });
      return;
    }

    const rewards = includeRewards ? {
      gold: goldReward ? parseInt(goldReward) : undefined,
      xp: xpReward ? parseInt(xpReward) : undefined,
      items: [
        ...(streakFreezeReward && parseInt(streakFreezeReward) > 0 ? [{
          itemType: 'consumable',
          itemName: 'Streak Freeze',
          quantity: parseInt(streakFreezeReward)
        }] : []),
        ...(potionReward && parseInt(potionReward) > 0 ? [{
          itemType: 'consumable',
          itemName: 'Health Potion',
          quantity: parseInt(potionReward)
        }] : [])
      ].filter(item => item.quantity > 0)
    } : undefined;

    const mailData = {
      subject: mailSubject,
      content: mailContent,
      mailType,
      rewards: Object.keys(rewards || {}).length > 0 ? rewards : undefined,
      expiresAt: expiryDate ? new Date(expiryDate).toISOString() : undefined
    };

    sendMailMutation.mutate(mailData);
  };

  const getMailTypeIcon = (type: string) => {
    switch (type) {
      case 'news': return <Newspaper className="w-4 h-4 text-blue-400" />;
      case 'reward': return <Gift className="w-4 h-4 text-purple-400" />;
      case 'announcement': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'event': return <Star className="w-4 h-4 text-green-400" />;
      default: return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <>
      <Card className="bg-game-slate border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <span>Admin Notification Center</span>
          </CardTitle>
          <Button 
            onClick={() => setShowComposeDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Compose Global Notification
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Newspaper className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">News Update</div>
                      <div className="text-sm text-gray-400">Platform announcements</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Gift className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Reward Mail</div>
                      <div className="text-sm text-gray-400">Send gifts to users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <Crown className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Announcement</div>
                      <div className="text-sm text-gray-400">Important notices</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Star className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Event Notice</div>
                      <div className="text-sm text-gray-400">Special events</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Information Panel */}
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h3 className="font-semibold text-white mb-3 flex items-center space-x-2">
                <Send className="w-5 h-5 text-blue-400" />
                <span>Global Notification System</span>
              </h3>
              <div className="text-gray-300 space-y-2">
                <p>Send notifications to all active users in the platform. You can include various types of rewards and set expiry dates for time-sensitive content.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <h4 className="font-medium text-white mb-2">Notification Types:</h4>
                    <ul className="space-y-1 text-gray-400">
                      <li>• <span className="text-blue-400">News:</span> Platform updates and announcements</li>
                      <li>• <span className="text-purple-400">Rewards:</span> Send gold, XP, or items to users</li>
                      <li>• <span className="text-yellow-400">Announcements:</span> Important system notices</li>
                      <li>• <span className="text-green-400">Events:</span> Special events and competitions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">Available Rewards:</h4>
                    <ul className="space-y-1 text-gray-400">
                      <li>• <span className="text-yellow-400">Gold Coins:</span> In-game currency</li>
                      <li>• <span className="text-blue-400">Experience Points:</span> Character progression</li>
                      <li>• <span className="text-purple-400">Streak Freezes:</span> Protect daily streaks</li>
                      <li>• <span className="text-green-400">Health Potions:</span> Restore HP instantly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compose Mail Dialog */}
      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Send className="w-5 h-5 text-blue-400" />
              <span>Compose Global Notification</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Mail Type */}
            <div className="space-y-2">
              <Label htmlFor="mailType">Notification Type</Label>
              <Select value={mailType} onValueChange={setMailType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">
                    <div className="flex items-center space-x-2">
                      <Newspaper className="w-4 h-4 text-blue-400" />
                      <span>News Update</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="reward">
                    <div className="flex items-center space-x-2">
                      <Gift className="w-4 h-4 text-purple-400" />
                      <span>Reward Mail</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="announcement">
                    <div className="flex items-center space-x-2">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span>Announcement</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="event">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-green-400" />
                      <span>Event Notice</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={mailSubject}
                onChange={(e) => setMailSubject(e.target.value)}
                placeholder="Enter notification subject..."
                className="w-full"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Message Content *</Label>
              <Textarea
                id="content"
                value={mailContent}
                onChange={(e) => setMailContent(e.target.value)}
                placeholder="Enter your message content here..."
                className="min-h-24 resize-none"
              />
            </div>

            {/* Include Rewards Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeRewards"
                checked={includeRewards}
                onChange={(e) => setIncludeRewards(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <Label htmlFor="includeRewards" className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-purple-400" />
                <span>Include Rewards & Attachments</span>
              </Label>
            </div>

            {/* Rewards Section */}
            {includeRewards && (
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h4 className="font-medium text-white flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span>Reward Attachments</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goldReward">Gold Coins</Label>
                    <Input
                      id="goldReward"
                      type="number"
                      value={goldReward}
                      onChange={(e) => setGoldReward(e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="xpReward">Experience Points</Label>
                    <Input
                      id="xpReward"
                      type="number"
                      value={xpReward}
                      onChange={(e) => setXpReward(e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="streakFreezeReward">Streak Freezes</Label>
                    <Input
                      id="streakFreezeReward"
                      type="number"
                      value={streakFreezeReward}
                      onChange={(e) => setStreakFreezeReward(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="5"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="potionReward">Health Potions</Label>
                    <Input
                      id="potionReward"
                      type="number"
                      value={potionReward}
                      onChange={(e) => setPotionReward(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
                Leave empty for permanent notifications
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeComposeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSendMail}
              disabled={!mailSubject.trim() || !mailContent.trim() || sendMailMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendMailMutation.isPending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to All Users
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}