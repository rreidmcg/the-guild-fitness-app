import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Crown, Zap, Target, Heart, Coins, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { AchievementDetailModal } from "@/components/ui/achievement-detail-modal";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Achievement {
  id: number;
  name: string;
  description: string;
  type: string;
  requirement: number;
  goldReward: number;
  title?: string | null;
}

interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  unlockedAt: string;
  isViewed?: boolean;
}

interface CompactAchievementCardProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  userStats: {
    level: number;
    strength: number;
    stamina: number;
    agility: number;
    currentStreak: number;
    totalWorkouts: number;
    gold: number;
  };
}

const getAchievementIcon = (type: string) => {
  switch (type) {
    case 'workout_count':
    case 'workout_streak':
      return <Zap className="h-4 w-4" />;
    case 'strength_level':
      return <Target className="h-4 w-4" />;
    case 'stamina_level':
      return <Heart className="h-4 w-4" />;
    case 'agility_level':
      return <Star className="h-4 w-4" />;
    case 'character_level':
      return <Crown className="h-4 w-4" />;
    case 'gold_earned':
      return <Coins className="h-4 w-4" />;
    default:
      return <Trophy className="h-4 w-4" />;
  }
};

const getProgressValue = (achievement: Achievement, userStats: any): number => {
  switch (achievement.type) {
    case 'workout_count':
      return userStats.totalWorkouts || 0;
    case 'workout_streak':
      return userStats.currentStreak || 0;
    case 'strength_level':
      return userStats.strength || 0;
    case 'stamina_level':
      return userStats.stamina || 0;
    case 'agility_level':
      return userStats.agility || 0;
    case 'character_level':
      return userStats.level || 0;
    case 'gold_earned':
      return userStats.gold || 0;
    default:
      return 0;
  }
};

export function CompactAchievementCard({ achievements, userAchievements, userStats }: CompactAchievementCardProps) {
  const [, setLocation] = useLocation();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedUserAchievement, setSelectedUserAchievement] = useState<UserAchievement | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const markAsViewedMutation = useMutation({
    mutationFn: async (achievementId: number) => {
      return apiRequest(`/api/user-achievements/${achievementId}/mark-viewed`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-achievements"] });
    }
  });

  // Sort achievements: unlocked first, then by difficulty (requirement)
  const sortedAchievements = [...achievements].sort((a, b) => {
    const aUnlocked = userAchievements.find(ua => ua.achievementId === a.id);
    const bUnlocked = userAchievements.find(ua => ua.achievementId === b.id);
    
    // Unlocked achievements first
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    
    // Within same unlock status, sort by requirement (easiest first)
    return a.requirement - b.requirement;
  });

  // Show only first 3 achievements
  const displayedAchievements = sortedAchievements.slice(0, 3);
  
  // Count new (unviewed) achievements
  const newAchievements = userAchievements.filter(ua => !ua.isViewed).length;

  const handleViewAll = () => {
    setLocation('/achievements');
  };

  const handleAchievementClick = (achievement: Achievement, userAchievement?: UserAchievement) => {
    setSelectedAchievement(achievement);
    setSelectedUserAchievement(userAchievement);
    setIsModalOpen(true);
    
    // Mark as viewed if it's a new achievement
    if (userAchievement && !userAchievement.isViewed) {
      markAsViewedMutation.mutate(userAchievement.achievementId);
    }
  };

  return (
    <Card className="bg-slate-800/90 border-slate-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold text-foreground">Achievements</CardTitle>
            <Trophy className="w-4 h-4 text-yellow-500" />
            {newAchievements > 0 && (
              <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title={`${newAchievements} new achievement${newAchievements > 1 ? 's' : ''}`} />
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="text-muted-foreground hover:text-foreground"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedAchievements.map((achievement) => {
          const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
          const isUnlocked = !!userAchievement;
          const currentProgress = getProgressValue(achievement, userStats);
          const progressPercentage = Math.min((currentProgress / achievement.requirement) * 100, 100);
          const isNew = userAchievement && !userAchievement.isViewed;

          return (
            <div
              key={achievement.id}
              onClick={() => handleAchievementClick(achievement, userAchievement)}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                isUnlocked 
                  ? 'bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200/50 dark:border-yellow-800/50 hover:from-yellow-100/50 hover:to-orange-100/50' 
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="relative">
                <div className={`p-2 rounded-lg ${
                  isUnlocked 
                    ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {getAchievementIcon(achievement.type)}
                </div>
                {isNew && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium text-sm truncate ${
                    isUnlocked ? 'text-yellow-800 dark:text-yellow-200' : 'text-foreground'
                  }`}>
                    {achievement.name}
                  </h4>
                  {isUnlocked && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                      <Trophy className="w-3 h-3" />
                      <span className="hidden sm:inline">Unlocked</span>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground truncate mb-1">
                  {achievement.description}
                </p>
                
                {!isUnlocked && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{currentProgress} / {achievement.requirement}</span>
                      <span>{progressPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {achievement.goldReward > 0 && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    <Coins className="w-3 h-3" />
                    <span>{achievement.goldReward} Gold</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {achievements.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No achievements available yet.</p>
          </div>
        )}
      </CardContent>
      
      <AchievementDetailModal
        achievement={selectedAchievement}
        userAchievement={selectedUserAchievement}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Card>
  );
}