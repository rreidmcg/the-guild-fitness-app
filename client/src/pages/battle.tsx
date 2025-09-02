import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/ui/bottom-nav";
import { BattleLoadingState } from "@/components/ui/loading-spinner";
import { hpRegenService } from "@/services/hp-regen-service";
import { 
  Sword, 
  Users,
  Lock,
  Trophy,
  ChevronRight,
  Crown
} from "lucide-react";
import dungeonsTitle from "@assets/9DCDA11D-2AD4-4DF9-AC4D-62C0709560C2_1753842591713.png";
import arenaTitle from "@assets/68542DD6-45F1-4C55-B33F-CC59C71FE8FA_1754018912124.png";

// Import battle system defensive styles
import "../styles/battle-system.css";

// User stats type to match the API response
interface UserStats {
  level: number;
  experience: number;
  strength: number;
  stamina: number;
  agility: number;
  gold: number;
  battlesWon: number;
  currentTier: string;
  currentTitle: string;
  currentHp: number;
  maxHp: number;
  username: string;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
  skinColor?: string;
  hairColor?: string;
  gender?: string;
  measurementUnit?: string;
}

export default function BattlePage() {
  const navigate = useNavigate();
  
  // BATTLE PAGE COMPONENT - Isolated state management
  const [battlePageState, setBattlePageState] = useState({
    scrollY: 0,
    isLoading: false
  });

  // Battle page scroll handler - namespaced to prevent conflicts
  useEffect(() => {
    const battlePage_handleScroll = () => {
      setBattlePageState(prev => ({
        ...prev,
        scrollY: window.scrollY
      }));
    };
    
    window.addEventListener('scroll', battlePage_handleScroll);
    return () => window.removeEventListener('scroll', battlePage_handleScroll);
  }, []);

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Sync HP regeneration service when user stats are loaded
  useEffect(() => {
    if (userStats && typeof userStats === 'object' && 'currentHp' in userStats && 'maxHp' in userStats) {
      const stats = userStats as UserStats;
      if (stats.currentHp !== undefined && stats.maxHp !== undefined) {
        hpRegenService.updatePlayerState(stats.currentHp, stats.maxHp);
      }
    }
  }, [userStats]);

  if (!userStats) {
    return <BattleLoadingState />;
  }

  const userLevel = (userStats as UserStats)?.level || 1;
  const stats = userStats as UserStats;
  
  // Check if user has battle access (Zero or G.M. title)
  const hasBattleAccess = stats.username === 'Zero' || stats.currentTitle === '<G.M.>';

  return (
    <div className="battle-page relative min-h-screen overflow-hidden">
      {/* BATTLE PAGE PARALLAX BACKGROUNDS - Isolated to prevent conflicts */}
      <div className="battle-page__parallax-container fixed inset-0 z-0">
        {/* Far Background Layer - Slowest */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            transform: `translateY(${battlePageState.scrollY * 0.1}px)`,
            background: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)'
          }}
        />
        
        {/* Mid Background Layer - Medium Speed */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            transform: `translateY(${battlePageState.scrollY * 0.2}px)`,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 40%, rgba(239, 68, 68, 0.1) 100%)'
          }}
        />
        
        {/* Near Background Layer - Faster */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            transform: `translateY(${battlePageState.scrollY * 0.3}px)`,
            background: 'conic-gradient(from 45deg at 50% 50%, rgba(168, 85, 247, 0.05) 0deg, rgba(59, 130, 246, 0.05) 120deg, rgba(34, 197, 94, 0.05) 240deg, rgba(168, 85, 247, 0.05) 360deg)'
          }}
        />
      </div>

      {/* BATTLE PAGE MAIN CONTENT - Component isolation */}
      <div className="battle-page__content-wrapper relative z-10 min-h-screen bg-background text-foreground pb-20">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Battle Arena</h1>
                <p className="text-muted-foreground mt-0.5 text-sm">Choose your battle mode and test your strength</p>
              </div>
              <Sword className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Battle Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* BATTLE MODE: PVE DUNGEONS - Defensive component structure */}
        <Card 
          className={`battle-page__mode-card ${
            hasBattleAccess 
              ? "battle-page__mode-card--accessible cursor-pointer transition-all duration-300 hover:scale-105 border-2 border-green-500/50 bg-gradient-to-br from-green-900/20 to-emerald-900/20 hover:border-green-400"
              : "battle-page__mode-card--restricted border-2 border-gray-500/50 bg-gradient-to-br from-gray-900/20 to-gray-800/20 opacity-60"
          }`}
          onClick={hasBattleAccess ? () => navigate("/pve-dungeons") : undefined}
        >
          <CardHeader className="text-center -mt-20 pb-6">
            <CardTitle className="text-2xl text-green-400 flex items-center justify-center">
              <img 
                src={dungeonsTitle} 
                alt="PvE Dungeons" 
                className="h-80 object-contain"
                style={{ 
                  imageRendering: 'pixelated',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
                }}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center -mt-24">
            <div className="space-y-4">
              {hasBattleAccess ? (
                <>
                  <div className="bg-green-500/10 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-400 mb-2">E-Rank Available</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Slime Caverns</span>
                        <span className="text-green-400">Levels 1-6</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rat Warrens</span>
                        <span className="text-green-400">Levels 2-7</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Goblin Outpost</span>
                        <span className="text-green-400">Levels 4-8</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Spider's Nest</span>
                        <span className="text-green-400">Levels 6-10</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Your Level</div>
                      <div className="text-xl font-bold text-green-400">{userLevel}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-red-500/10 p-4 rounded-lg">
                  <div className="flex items-center justify-center mb-3">
                    <Lock className="h-8 w-8 text-red-400 mr-2" />
                    <h4 className="font-semibold text-red-400">Access Restricted</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    PvE Dungeons are currently in private beta testing.
                  </p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>• Limited to beta testers only</div>
                    <div>• Full release coming soon</div>
                    <div>• Focus on workouts to level up!</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* BATTLE MODE: PVP ARENA - Defensive component structure */}
        <Card className="battle-page__mode-card battle-page__mode-card--restricted border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-pink-900/20 opacity-60">
          <CardHeader className="text-center -mt-10 -mb-12">
            <CardTitle className="text-2xl text-purple-400 flex items-center justify-center">
              <img 
                src={arenaTitle} 
                alt="PvP Arena" 
                className="h-80 object-contain"
                style={{ 
                  imageRendering: 'pixelated',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
                }}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="bg-purple-500/10 p-4 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <Lock className="h-8 w-8 text-purple-400 mr-2" />
                  <h4 className="font-semibold text-purple-400">In Development</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Real-time battles against other players are coming soon!
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div>• Ranked competitive matches</div>
                  <div>• Real-time combat system</div>
                  <div>• Leaderboard integration</div>
                  <div>• Seasonal tournaments</div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                disabled
                className="border-purple-500 text-purple-400 opacity-50 cursor-not-allowed"
              >
                Coming Soon
                <Lock className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}