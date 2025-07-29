import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Crown, Zap, Target, Heart, Coins, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AchievementDetailModal } from "@/components/ui/achievement-detail-modal";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

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

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  userStats?: {
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
      return <Zap className="h-5 w-5" />;
    case 'strength_level':
      return <Target className="h-5 w-5" />;
    case 'stamina_level':
      return <Heart className="h-5 w-5" />;
    case 'agility_level':
      return <Star className="h-5 w-5" />;
    case 'character_level':
      return <Crown className="h-5 w-5" />;
    case 'gold_earned':
      return <Coins className="h-5 w-5" />;
    default:
      return <Trophy className="h-5 w-5" />;
  }
};

const getProgressValue = (achievement: Achievement, userStats?: any): number => {
  if (!userStats) return 0;
  
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

export function AchievementCard({ achievement, userAchievement, userStats }: AchievementCardProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isUnlocked = !!userAchievement;
  const currentProgress = getProgressValue(achievement, userStats);
  const progressPercentage = Math.min((currentProgress / achievement.requirement) * 100, 100);
  const isNew = userAchievement && !userAchievement.isViewed;

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

  const handleCardClick = () => {
    setIsModalOpen(true);
    
    // Mark as viewed if it's a new achievement
    if (userAchievement && !userAchievement.isViewed) {
      markAsViewedMutation.mutate(userAchievement.achievementId);
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch("/api/social-shares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shareType: "achievement",
          title: `🏆 Achievement Unlocked: ${achievement.name}`,
          description: `I just unlocked the "${achievement.name}" achievement! ${achievement.description}`,
          shareData: {
            achievementName: achievement.name,
            achievementDescription: achievement.description,
            goldReward: achievement.goldReward,
            unlockedAt: userAchievement?.unlockedAt,
            userLevel: userStats?.level
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to share achievement');
      }

      toast({
        title: "Achievement Shared!",
        description: "Your achievement has been shared with the community!",
      });
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Could not share achievement. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card 
        onClick={handleCardClick}
        className={`transition-all duration-300 cursor-pointer hover:shadow-md ${
          isUnlocked 
            ? 'bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-800' 
            : 'bg-slate-800/90 border-slate-600'
        }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`p-2 rounded-lg ${
                isUnlocked 
                  ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {getAchievementIcon(achievement.type)}
              </div>
              {isNew && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <CardTitle className={`text-lg ${
                isUnlocked ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {achievement.name}
              </CardTitle>
              {achievement.title && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Title: {achievement.title}
                </Badge>
              )}
            </div>
          </div>
          
          {isUnlocked && (
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                <Trophy className="h-3 w-3 mr-1" />
                Unlocked
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="border-yellow-300 hover:bg-yellow-50 dark:border-yellow-700 dark:hover:bg-yellow-900/20"
              >
                <Share2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {achievement.description}
        </p>
        
        <div className="space-y-2">
          {/* Progress Bar */}
          {!isUnlocked && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{currentProgress} / {achievement.requirement}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Rewards */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {achievement.goldReward > 0 && (
                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                  <Coins className="h-4 w-4" />
                  <span>{achievement.goldReward} Gold</span>
                </div>
              )}
            </div>
            
            {isUnlocked && userAchievement && (
              <span className="text-xs text-gray-500">
                Unlocked {new Date(userAchievement.unlockedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    
    <AchievementDetailModal
      achievement={achievement}
      userAchievement={userAchievement}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
    </>
  );
}