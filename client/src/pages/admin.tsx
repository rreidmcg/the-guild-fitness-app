import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AdminAvatarManager } from "@/components/ui/admin-avatar-manager";
import { Users, TrendingUp, Activity, Settings, Palette } from "lucide-react";

interface SystemStats {
  totalUsers: number;
  activeToday: number;
  totalWorkouts: number;
  averageLevel: number;
}

export default function AdminPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<SystemStats>({
    queryKey: ["/api/admin/system-stats"],
    staleTime: 60000, // 1 minute
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    staleTime: 30000, // 30 seconds
  });

  return (
    <div className="admin-page container mx-auto px-4 py-8">
      <div className="admin-page__header mb-8">
        <h1 className="admin-page__title text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="admin-page__subtitle text-muted-foreground">
          Manage users, system settings, and content
        </p>
      </div>

      <Tabs defaultValue="overview" className="admin-page__tabs">
        <TabsList className="admin-page__tab-list grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="admin-page__tab-trigger">
            <TrendingUp className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="admin-page__tab-trigger">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="avatars" className="admin-page__tab-trigger">
            <Palette className="h-4 w-4 mr-2" />
            Avatars
          </TabsTrigger>
          <TabsTrigger value="analytics" className="admin-page__tab-trigger">
            <Activity className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="admin-page__tab-trigger">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="admin-page__overview">
          <div className="admin-page__stats-grid grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="admin-page__stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.totalUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered players
                </p>
              </CardContent>
            </Card>

            <Card className="admin-page__stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.activeToday || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Players active today
                </p>
              </CardContent>
            </Card>

            <Card className="admin-page__stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.totalWorkouts || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Workouts completed
                </p>
              </CardContent>
            </Card>

            <Card className="admin-page__stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Level</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : Math.round(stats?.averageLevel || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Player progression
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="admin-page__recent-activity">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health and activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Status</span>
                  <Badge variant="default">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Object Storage</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Server Status</span>
                  <Badge variant="default">Running</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="admin-page__users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage registered users and their accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="admin-page__loading">Loading users...</div>
              ) : (
                <div className="admin-page__user-list space-y-4">
                  {allUsers.length === 0 ? (
                    <p className="text-muted-foreground">No users found</p>
                  ) : (
                    allUsers.slice(0, 10).map((user: any) => (
                      <div key={user.id} className="admin-page__user-row flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{user.username}</h4>
                          <p className="text-sm text-muted-foreground">
                            Level {user.level} • {user.email || "No email"}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={user.currentTitle === "<G.M.>" ? "default" : "secondary"}>
                            {user.currentTitle || "Recruit"}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {user.experience} XP
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {allUsers.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Showing first 10 users of {allUsers.length} total
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avatars" className="admin-page__avatars">
          <AdminAvatarManager />
        </TabsContent>

        <TabsContent value="analytics" className="admin-page__analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                User engagement and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="admin-page__analytics-placeholder text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced analytics and reporting features will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="admin-page__settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="admin-page__settings-placeholder text-center py-12">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Settings Panel</h3>
                <p className="text-muted-foreground">
                  System configuration options will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}