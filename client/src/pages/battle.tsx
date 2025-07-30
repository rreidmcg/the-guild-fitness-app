import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sword, 
  Users,
  Lock,
  Trophy,
  ChevronRight,
  Crown
} from "lucide-react";
import dungeonsTitle from "@assets/9DCDA11D-2AD4-4DF9-AC4D-62C0709560C2_1753842591713.png";
import arenaTitle from "@assets/8766C8BA-47EA-492D-89E1-F4B7417B2A77_1753842660569.png";

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
  currentMp: number;
  maxMp: number;
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
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  if (!userStats) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const userLevel = (userStats as UserStats)?.level || 1;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Parallax Background Layers */}
      <div className="fixed inset-0 z-0">
        {/* Far Background Layer - Slowest */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`,
            background: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)'
          }}
        />
        
        {/* Mid Background Layer - Medium Speed */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 40%, rgba(239, 68, 68, 0.1) 100%)'
          }}
        />
        
        {/* Near Background Layer - Faster */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
            background: 'conic-gradient(from 45deg at 50% 50%, rgba(168, 85, 247, 0.05) 0deg, rgba(59, 130, 246, 0.05) 120deg, rgba(34, 197, 94, 0.05) 240deg, rgba(168, 85, 247, 0.05) 360deg)'
          }}
        />
      </div>

      {/* Main Content with Backdrop */}
      <div className="relative z-10 container mx-auto p-4 max-w-4xl backdrop-blur-sm">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Battle Arena
        </h1>
        <p className="text-muted-foreground">
          Choose your battle mode and test your strength
        </p>
      </div>

      {/* Battle Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* PvE Card */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:scale-105 border-2 border-green-500/50 bg-gradient-to-br from-green-900/20 to-emerald-900/20 hover:border-green-400"
          onClick={() => navigate("/pve-dungeons")}
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
              
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">Your Level</div>
                  <div className="text-xl font-bold text-green-400">{userLevel}</div>
                </div>
                <Button 
                  variant="outline" 
                  className="border-green-500 text-green-400 hover:bg-green-500/20"
                >
                  Enter Dungeons
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PvP Card */}
        <Card className="border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-pink-900/20 opacity-60">
          <CardHeader className="text-center -mt-10 -mb-5">
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
  );
}