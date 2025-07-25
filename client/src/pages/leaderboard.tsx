import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Crown, Star, Dumbbell, Heart, Zap } from "lucide-react";
import { CurrencyHeader } from "@/components/ui/currency-header";
import { getTitleComponent } from "@/lib/title-rarity";

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-100" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <Trophy className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30";
      default:
        return "bg-card border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <CurrencyHeader />
      
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Top adventurers ranked by experience</p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.isArray(leaderboard) && leaderboard.map((player: any, index: number) => {
              const rank = index + 1;
              return (
                <div
                  key={player.id}
                  className={`border rounded-lg p-4 transition-all hover:shadow-md ${getRankBg(rank)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getRankIcon(rank)}
                        <span className={`font-bold text-lg ${
                          rank <= 3 ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          #{rank}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-foreground">{player.username}</h3>
                          {player.title && (
                            <span className={getTitleComponent(player.title, "sm").className}>
                              {player.title}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            Level {player.level}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-sm text-muted-foreground">
                              {player.experience} XP
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Dumbbell className="w-3 h-3 text-red-400" />
                            <span className="text-xs text-muted-foreground">
                              {player.strength || 0}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">
                              {player.stamina || 0}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Zap className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-muted-foreground">
                              {player.agility || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">
                        {player.experience.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Experience Points
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {leaderboard && Array.isArray(leaderboard) && leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Rankings Yet</h3>
            <p className="text-muted-foreground">
              Complete workouts to earn XP and appear on the leaderboard!
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}