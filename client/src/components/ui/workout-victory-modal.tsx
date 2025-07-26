import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Zap, TrendingUp, Coins } from "lucide-react";

interface WorkoutVictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutName: string;
  xpGained: number;
  statsGained: {
    strength?: number;
    stamina?: number;
    agility?: number;
  };
  duration: number;
  totalVolume?: number;
  validation?: {
    multiplier: number;
    suspicious: string[];
    confidence: "high" | "medium" | "low";
  };
  newAchievements?: any[];
}

export function WorkoutVictoryModal({
  isOpen,
  onClose,
  workoutName,
  xpGained,
  statsGained,
  duration,
  totalVolume,
  validation,
  newAchievements = []
}: WorkoutVictoryModalProps) {
  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-900/90 to-emerald-800/90 border-2 border-green-400 text-center">
        <div className="space-y-6 p-4">
          {/* Victory Header */}
          <div className="mb-6">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold text-green-100 mb-2">WORKOUT COMPLETE!</h2>
            <p className="text-green-200 text-lg">{workoutName}</p>
          </div>

          {/* XP Gained Section */}
          <div className="bg-black/30 rounded-lg p-4 border border-green-400/30">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Star className="w-6 h-6 text-yellow-400" />
              <span className="text-xl font-bold text-green-100">Experience Gained</span>
            </div>
            <div className="text-4xl font-bold text-yellow-400">+{xpGained} XP</div>
          </div>

          {/* Stats Gained */}
          {(statsGained.strength || statsGained.stamina || statsGained.agility) && (
            <div className="bg-black/30 rounded-lg p-4 border border-green-400/30">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-bold text-green-100">Stats Improved</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {statsGained.strength && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-400">+{statsGained.strength} XP</div>
                    <div className="text-xs text-red-300">Strength</div>
                  </div>
                )}
                {statsGained.stamina && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">+{statsGained.stamina} XP</div>
                    <div className="text-xs text-green-300">Stamina</div>
                  </div>
                )}
                {statsGained.agility && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-400">+{statsGained.agility} XP</div>
                    <div className="text-xs text-blue-300">Agility</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workout Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-100">{formatDuration(duration)}</div>
              <div className="text-xs text-green-300">Duration</div>
            </div>
            {totalVolume && totalVolume > 0 && (
              <div className="bg-black/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-100">{totalVolume.toLocaleString()}</div>
                <div className="text-xs text-green-300">Total Volume</div>
              </div>
            )}
          </div>

          {/* Validation Info */}
          {validation && (
            <div className="bg-black/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-green-300 text-sm">XP Confidence:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    validation.confidence === "high" ? "bg-green-400" : 
                    validation.confidence === "medium" ? "bg-yellow-400" : "bg-orange-400"
                  }`} />
                  <span className={`text-xs font-medium ${
                    validation.confidence === "high" ? "text-green-400" : 
                    validation.confidence === "medium" ? "text-yellow-400" : "text-orange-400"
                  }`}>
                    {validation.confidence.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {validation.multiplier !== 1.0 && (
                <div className="text-xs text-green-200">
                  XP Multiplier: {validation.multiplier.toFixed(2)}x
                </div>
              )}
              
              {validation.suspicious.length > 0 && (
                <div className="text-xs text-yellow-300">
                  Note: {validation.suspicious[0]}
                </div>
              )}
            </div>
          )}

          {/* New Achievements Section */}
          {newAchievements && newAchievements.length > 0 && (
            <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-400/50">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-lg font-bold text-yellow-100">Achievement Unlocked!</span>
              </div>
              <div className="space-y-2">
                {newAchievements.map((achievement, index) => (
                  <div key={index} className="text-center p-2 bg-yellow-800/20 rounded">
                    <div className="font-semibold text-yellow-200">{achievement.name || 'Achievement'}</div>
                    <div className="text-xs text-yellow-300">{achievement.description || 'Great job!'}</div>
                    {achievement.goldReward > 0 && (
                      <div className="text-xs text-yellow-400 mt-1">
                        <Coins className="w-3 h-3 inline mr-1" />
                        +{achievement.goldReward} gold
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivational Message */}
          <div className="text-green-200 text-sm italic">
            "Every workout brings you closer to your fitness goals!"
          </div>

          {/* Action Button */}
          <Button 
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-lg"
          >
            CONTINUE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}