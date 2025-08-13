/**
 * Enhanced Stats Dashboard for Day 3 Frontend Modernization
 * 
 * Replaces the traditional stats display with an optimized, mobile-first
 * design using the new enhanced UI primitives and performance optimizations
 */

import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  EnhancedStatCard, 
  EnhancedActionButton, 
  EnhancedAchievement,
  EnhancedLoading 
} from '@/components/enhanced-ui-primitives';
import { PerformanceMonitor } from '@/components/performance-monitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar2D } from '@/components/ui/avatar-2d';
import { getTitleComponent } from '@/lib/title-rarity';
import { useNavigate } from '@/hooks/use-navigate';
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
  streakCount: number;
  totalWorkouts: number;
  achievementCount: number;
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
  const navigate = useNavigate();

  const { data: userStats, isLoading } = useQuery<UserStats>({
    queryKey: ['/api/user/stats'],
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: recentAchievements } = useQuery({
    queryKey: ['/api/user-achievements'],
    staleTime: 60000, // Cache for 1 minute
  });

  const { data: dailyProgress } = useQuery({
    queryKey: ['/api/daily-progress'],
    staleTime: 30000,
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
        <EnhancedLoading variant="skeleton" size="lg" text="Loading your character..." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <EnhancedLoading key={i} variant="skeleton" size="md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-stats-dashboard space-y-6 ${className || ''}`}>
      {/* Performance Monitor (Dev Mode) */}
      {showPerformanceMonitor && import.meta.env.DEV && (
        <PerformanceMonitor enabled className="md:max-w-sm md:absolute md:top-4 md:right-4" />
      )}

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

      {/* Core Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <EnhancedStatCard
          title="Health"
          value={enhancedStats.hp}
          maxValue={enhancedStats.maxHp}
          icon={Heart}
          color="red"
          size="md"
        />
        
        <EnhancedStatCard
          title="Magic"
          value={enhancedStats.mp}
          maxValue={enhancedStats.maxMp}
          icon={Zap}
          color="blue"
          size="md"
        />
        
        <EnhancedStatCard
          title="Strength"
          value={enhancedStats.strength}
          icon={Dumbbell}
          color="red"
          trend="up"
          size="md"
        />
        
        <EnhancedStatCard
          title="Stamina"
          value={enhancedStats.stamina}
          icon={Heart}
          color="green"
          trend="up"
          size="md"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <EnhancedStatCard
          title="Agility"
          value={enhancedStats.agility}
          icon={Zap}
          color="purple"
          trend="stable"
          size="sm"
        />
        
        <EnhancedStatCard
          title="Overall Power"
          value={enhancedStats.overallPower}
          icon={Shield}
          color="gold"
          trend="up"
          size="sm"
        />
        
        <EnhancedStatCard
          title="Streak"
          value={enhancedStats.streakCount}
          icon={Flame}
          color="red"
          size="sm"
        />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions grid grid-cols-2 md:grid-cols-4 gap-4">
        <EnhancedActionButton
          icon={Dumbbell}
          variant="primary"
          onClick={() => navigate('/workouts')}
          fullWidth
        >
          Start Workout
        </EnhancedActionButton>
        
        <EnhancedActionButton
          icon={Trophy}
          variant="secondary"
          onClick={() => navigate('/battle')}
          fullWidth
        >
          Battle
        </EnhancedActionButton>
        
        <EnhancedActionButton
          icon={Coins}
          variant="warning"
          onClick={() => navigate('/shop')}
          fullWidth
        >
          Shop
        </EnhancedActionButton>
        
        <EnhancedActionButton
          icon={Shirt}
          variant="success"
          onClick={() => navigate('/wardrobe')}
          fullWidth
        >
          Wardrobe
        </EnhancedActionButton>
      </div>

      {/* Daily Progress Section */}
      {dailyProgress && (
        <Card className="daily-progress">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Daily Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className={`text-lg font-bold ${dailyProgress.waterIntake ? 'text-blue-400' : 'text-muted-foreground'}`}>
                  {dailyProgress.waterIntake ? '✓' : '○'}
                </div>
                <p className="text-xs text-muted-foreground">Water</p>
              </div>
              <div className="space-y-1">
                <div className={`text-lg font-bold ${dailyProgress.sleep ? 'text-purple-400' : 'text-muted-foreground'}`}>
                  {dailyProgress.sleep ? '✓' : '○'}
                </div>
                <p className="text-xs text-muted-foreground">Sleep</p>
              </div>
              <div className="space-y-1">
                <div className={`text-lg font-bold ${dailyProgress.stretching ? 'text-green-400' : 'text-muted-foreground'}`}>
                  {dailyProgress.stretching ? '✓' : '○'}
                </div>
                <p className="text-xs text-muted-foreground">Stretch</p>
              </div>
              <div className="space-y-1">
                <div className={`text-lg font-bold ${dailyProgress.vitamins ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                  {dailyProgress.vitamins ? '✓' : '○'}
                </div>
                <p className="text-xs text-muted-foreground">Vitamins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Achievements */}
      {recentAchievements && recentAchievements.length > 0 && (
        <Card className="recent-achievements">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span>Recent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentAchievements.slice(0, 4).map((achievement: any) => (
                <EnhancedAchievement
                  key={achievement.id}
                  name={achievement.name}
                  description={achievement.description}
                  isUnlocked={true}
                  rarity={achievement.rarity || 'common'}
                  icon={achievement.icon}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

EnhancedStatsDashboard.displayName = 'EnhancedStatsDashboard';