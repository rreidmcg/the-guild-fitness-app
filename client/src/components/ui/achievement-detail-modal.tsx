import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Crown, Zap, Target, Heart, Coins, Calendar, X } from "lucide-react";

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

interface AchievementDetailModalProps {
  achievement: Achievement | null;
  userAchievement?: UserAchievement;
  isOpen: boolean;
  onClose: () => void;
}

const getAchievementIcon = (type: string) => {
  switch (type) {
    case 'workout_count':
    case 'workout_streak':
      return <Zap className="h-6 w-6" />;
    case 'strength_level':
      return <Target className="h-6 w-6" />;
    case 'stamina_level':
      return <Heart className="h-6 w-6" />;
    case 'agility_level':
      return <Star className="h-6 w-6" />;
    case 'character_level':
      return <Crown className="h-6 w-6" />;
    case 'gold_earned':
      return <Coins className="h-6 w-6" />;
    default:
      return <Trophy className="h-6 w-6" />;
  }
};

const getAchievementTypeLabel = (type: string): string => {
  switch (type) {
    case 'workout_count':
      return 'Workout Completion';
    case 'workout_streak':
      return 'Consistency';
    case 'strength_level':
      return 'Strength Training';
    case 'stamina_level':
      return 'Endurance';
    case 'agility_level':
      return 'Agility';
    case 'character_level':
      return 'Character Development';
    case 'gold_earned':
      return 'Wealth Accumulation';
    default:
      return 'General Achievement';
  }
};

const getExtendedDescription = (achievement: Achievement): string => {
  switch (achievement.type) {
    case 'workout_count':
      return `This achievement recognizes your dedication to consistent training. You've successfully completed ${achievement.requirement} workout sessions, demonstrating your commitment to building healthy habits and improving your fitness level.`;
    case 'workout_streak':
      return `Consistency is key to lasting fitness results. This achievement celebrates your ability to maintain a workout streak of ${achievement.requirement} consecutive days, showing your discipline and determination.`;
    case 'strength_level':
      return `Your strength training efforts have paid off! Reaching level ${achievement.requirement} in strength demonstrates your progress in building muscle power and enhancing your physical capabilities.`;
    case 'stamina_level':
      return `Your cardiovascular endurance has improved significantly. Achieving level ${achievement.requirement} in stamina shows your enhanced ability to sustain physical activity and improved overall fitness.`;
    case 'agility_level':
      return `Your agility and coordination have reached new heights. Level ${achievement.requirement} in agility reflects your improved balance, flexibility, and quick movement capabilities.`;
    case 'character_level':
      return `Your overall character development has reached level ${achievement.requirement}! This represents your balanced growth across all fitness attributes and your journey as a complete fitness warrior.`;
    case 'gold_earned':
      return `Your battles and achievements have earned you ${achievement.requirement} gold coins. This wealth represents your victory over challenges and your growing status as a successful fitness adventurer.`;
    default:
      return achievement.description;
  }
};

export function AchievementDetailModal({ achievement, userAchievement, isOpen, onClose }: AchievementDetailModalProps) {
  if (!achievement) return null;

  const isUnlocked = !!userAchievement;
  const unlockedDate = userAchievement ? new Date(userAchievement.unlockedAt) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                isUnlocked 
                  ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {getAchievementIcon(achievement.type)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{achievement.name}</h2>
                <Badge variant="secondary" className="text-xs mt-1">
                  {getAchievementTypeLabel(achievement.type)}
                </Badge>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Achievement Status */}
          {isUnlocked && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">Achievement Unlocked!</span>
              </div>
              {unlockedDate && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Unlocked on {unlockedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Extended Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {getExtendedDescription(achievement)}
            </p>
          </div>

          {/* Requirements */}
          <div>
            <h3 className="font-semibold mb-2">Requirements</h3>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm">
                {achievement.type === 'workout_count' && `Complete ${achievement.requirement} workout sessions`}
                {achievement.type === 'workout_streak' && `Maintain a ${achievement.requirement}-day workout streak`}
                {achievement.type === 'strength_level' && `Reach level ${achievement.requirement} in Strength`}
                {achievement.type === 'stamina_level' && `Reach level ${achievement.requirement} in Stamina`}
                {achievement.type === 'agility_level' && `Reach level ${achievement.requirement} in Agility`}
                {achievement.type === 'character_level' && `Reach character level ${achievement.requirement}`}
                {achievement.type === 'gold_earned' && `Earn ${achievement.requirement} gold coins`}
              </p>
            </div>
          </div>

          {/* Rewards */}
          {achievement.goldReward > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Rewards</h3>
              <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium">{achievement.goldReward} Gold Coins</span>
              </div>
            </div>
          )}

          {/* Title Reward */}
          {achievement.title && (
            <div>
              <h3 className="font-semibold mb-2">Title Unlocked</h3>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <Badge variant="secondary" className="text-purple-800 dark:text-purple-200">
                  {achievement.title}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}