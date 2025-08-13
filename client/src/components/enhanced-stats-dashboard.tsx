/**
 * Enhanced Stats Dashboard for Day 3 Frontend Modernization
 * 
 * Simplified version that demonstrates enhanced UI patterns
 * while maintaining compatibility with existing systems
 */

import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar2D } from '@/components/ui/avatar-2d';
import { getTitleComponent } from '@/lib/title-rarity';
import { 
  Dumbbell, 
  Heart, 
  Zap, 
  Shield, 
  Trophy, 
  Target,
  Calendar,
  Flame,
  Coins,
  Star,
  TrendingUp,
  Shirt
} from 'lucide-react';

interface UserStats {
  id: number;
  username: string;
  level: number;
  experience: number;
  strength: number;
  stamina: number;
  agility: number;
  gold: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  currentTitle: string;
  currentStreak?: number;
  totalWorkouts?: number;
  achievementCount?: number;
}

interface EnhancedStatsDashboardProps {
  className?: string;
  showPerformanceMonitor?: boolean;
}

/**
 * Main Enhanced Stats Dashboard Component
 */
export const EnhancedStatsDashboard = memo(({ 
  className, 
  showPerformanceMonitor = false 
}: EnhancedStatsDashboardProps) => {
  const { data: userStats, isLoading } = useQuery<UserStats>({
    queryKey: ['/api/user/stats'],
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: recentAchievements } = useQuery({
    queryKey: ['/api/user-achievements'],
    staleTime: 60000, // Cache for 1 minute
  });

  // Calculate derived stats for enhanced display
  const enhancedStats = useMemo(() => {
    if (!userStats) return null;

    const experienceToNext = Math.pow(userStats.level, 2) * 50;
    const experienceProgress = userStats.experience % experienceToNext;
    const experienceNeeded = experienceToNext - experienceProgress;
    
    return {
      ...userStats,
      experienceProgress,
      experienceNeeded,
      experienceToNext,
      hpPercentage: Math.round((userStats.hp / userStats.maxHp) * 100),
      mpPercentage: Math.round((userStats.mp / userStats.maxMp) * 100),
      overallPower: Math.round((userStats.strength + userStats.stamina + userStats.agility) / 3)
    };
  }, [userStats]);

  if (isLoading || !enhancedStats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-stats-dashboard space-y-6 ${className || ''}`}>

      {/* Character Overview Card */}
      <Card className="character-overview bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Avatar2D className="h-12 w-12" />
            <div>
              <h2 className="text-xl font-bold">{enhancedStats.username}</h2>
              <div className="flex items-center space-x-2">
                {getTitleComponent(enhancedStats.currentTitle)}
                <span className="text-sm text-muted-foreground">Level {enhancedStats.level}</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Experience</span>
                <span>{enhancedStats.experienceProgress.toLocaleString()} / {enhancedStats.experienceToNext.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(enhancedStats.experienceProgress / enhancedStats.experienceToNext) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-400">{enhancedStats.gold.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-end space-x-1">
                <Coins className="h-3 w-3" />
                <span>Gold</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Stats Grid - Enhanced Design */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Heart className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm text-muted-foreground">Health</p>
            <div className="text-2xl font-bold">{enhancedStats.hp}</div>
            <div className="text-xs text-muted-foreground">/ {enhancedStats.maxHp}</div>
            <Progress value={(enhancedStats.hp / enhancedStats.maxHp) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-6 w-6 text-blue-400" />
            </div>
            <p className="text-sm text-muted-foreground">Magic</p>
            <div className="text-2xl font-bold">{enhancedStats.mp}</div>
            <div className="text-xs text-muted-foreground">/ {enhancedStats.maxMp}</div>
            <Progress value={(enhancedStats.mp / enhancedStats.maxMp) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Dumbbell className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm text-muted-foreground">Strength</p>
            <div className="text-2xl font-bold">{enhancedStats.strength}</div>
            <Badge variant="outline" className="text-green-400 border-green-400 mt-1">↗</Badge>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Heart className="h-6 w-6 text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">Stamina</p>
            <div className="text-2xl font-bold">{enhancedStats.stamina}</div>
            <Badge variant="outline" className="text-green-400 border-green-400 mt-1">↗</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats - Enhanced Layout */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
          <CardContent className="p-3 text-center">
            <Zap className="h-5 w-5 text-purple-400 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Agility</p>
            <div className="text-xl font-bold">{enhancedStats.agility}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
          <CardContent className="p-3 text-center">
            <Shield className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Power</p>
            <div className="text-xl font-bold">{enhancedStats.overallPower}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30">
          <CardContent className="p-3 text-center">
            <Flame className="h-5 w-5 text-orange-400 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Streak</p>
            <div className="text-xl font-bold">{enhancedStats.currentStreak || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Enhanced Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button 
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={() => window.location.href = '/workouts'}
        >
          <Dumbbell className="h-4 w-4 mr-2" />
          Workout
        </Button>
        
        <Button 
          variant="outline"
          className="border-yellow-500/30 hover:bg-yellow-500/10"
          onClick={() => window.location.href = '/battle'}
        >
          <Trophy className="h-4 w-4 mr-2" />
          Battle
        </Button>
        
        <Button 
          variant="outline"
          className="border-green-500/30 hover:bg-green-500/10"
          onClick={() => window.location.href = '/shop'}
        >
          <Coins className="h-4 w-4 mr-2" />
          Shop
        </Button>
        
        <Button 
          variant="outline"
          className="border-purple-500/30 hover:bg-purple-500/10"
          onClick={() => window.location.href = '/wardrobe'}
        >
          <Shirt className="h-4 w-4 mr-2" />
          Style
        </Button>
      </div>

      {/* Recent Achievements */}
      {recentAchievements && recentAchievements.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span>Recent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentAchievements.slice(0, 4).map((achievement: any) => (
                <Card key={achievement.id} className="border-yellow-500/30">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <div>
                        <p className="text-sm font-medium">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

EnhancedStatsDashboard.displayName = 'EnhancedStatsDashboard';