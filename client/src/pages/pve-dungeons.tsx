import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BottomNav } from "@/components/ui/bottom-nav";
import { EnhancedBattleSystem } from "@/components/ui/enhanced-battle-system";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Sword, 
  Crown,
  Trophy,
  Coins,
  ShieldCheck,
  Zap,
  Target
} from "lucide-react";

// Dungeon data
const DUNGEONS = [
  {
    id: "slime-caverns",
    name: "Slime Caverns",
    description: "A damp underground cavern filled with gelatinous slimes",
    minLevel: 1,
    maxLevel: 6,
    rank: "E",
    monsters: [
      { id: "green-slime", name: "Green Slime", level: 1, hp: 120, attack: 8, goldReward: 15 },
      { id: "blue-slime", name: "Blue Slime", level: 2, hp: 150, attack: 12, goldReward: 20 },
      { id: "slime-king", name: "Slime King", level: 4, hp: 350, attack: 20, goldReward: 50 }
    ],
    background: "from-green-900/20 to-emerald-900/20",
    borderColor: "border-green-500/50"
  },
  {
    id: "rat-warrens",
    name: "Rat Warrens",
    description: "Twisting tunnels infested with oversized rats",
    minLevel: 2,
    maxLevel: 7,
    rank: "E",
    monsters: [
      { id: "giant-rat", name: "Giant Rat", level: 2, hp: 140, attack: 10, goldReward: 18 },
      { id: "rat-warrior", name: "Rat Warrior", level: 4, hp: 200, attack: 16, goldReward: 35 },
      { id: "rat-chieftain", name: "Rat Chieftain", level: 6, hp: 400, attack: 25, goldReward: 60 }
    ],
    background: "from-gray-900/20 to-stone-900/20",
    borderColor: "border-gray-500/50"
  },
  {
    id: "goblin-outpost",
    name: "Goblin Outpost",
    description: "A fortified camp of cunning goblins",
    minLevel: 4,
    maxLevel: 8,
    rank: "E",
    monsters: [
      { id: "goblin-scout", name: "Goblin Scout", level: 4, hp: 180, attack: 14, goldReward: 25 },
      { id: "goblin-warrior", name: "Goblin Warrior", level: 6, hp: 250, attack: 20, goldReward: 40 },
      { id: "goblin-champion", name: "Goblin Champion", level: 8, hp: 500, attack: 30, goldReward: 80 }
    ],
    background: "from-red-900/20 to-orange-900/20",
    borderColor: "border-red-500/50"
  },
  {
    id: "spiders-nest",
    name: "Spider's Nest",
    description: "A web-covered lair of venomous arachnids",
    minLevel: 6,
    maxLevel: 10,
    rank: "E",
    monsters: [
      { id: "web-spider", name: "Web Spider", level: 6, hp: 220, attack: 18, goldReward: 30 },
      { id: "poison-spider", name: "Poison Spider", level: 8, hp: 300, attack: 24, goldReward: 45 },
      { id: "spider-queen", name: "Spider Queen", level: 10, hp: 600, attack: 35, goldReward: 100 }
    ],
    background: "from-purple-900/20 to-violet-900/20",
    borderColor: "border-purple-500/50"
  }
];

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
}

export default function PveDungeonsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDungeon, setSelectedDungeon] = useState<any>(null);
  const [selectedMonster, setSelectedMonster] = useState<any>(null);
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [currentBattle, setCurrentBattle] = useState<any>(null);

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const battleMutation = useMutation({
    mutationFn: async (battleData: any) => {
      return await apiRequest("/api/battle/start", {
        method: "POST",
        body: battleData,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Battle Started!",
        description: `Entering combat with ${selectedMonster?.name}`,
      });
    },
    onError: () => {
      toast({
        title: "Battle Error",
        description: "Failed to start battle",
        variant: "destructive",
      });
    },
  });

  if (!userStats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading dungeons...</p>
        </div>
      </div>
    );
  }

  const userLevel = userStats.level || 1;

  const startBattle = (dungeon: any, monster: any) => {
    setSelectedDungeon(dungeon);
    setSelectedMonster(monster);
    setCurrentBattle({ dungeon, monster });
    setShowBattleModal(true);
  };

  const handleBattleComplete = (result: any) => {
    setShowBattleModal(false);
    setCurrentBattle(null);
    
    if (result.battleResult === 'victory') {
      toast({
        title: "Victory!",
        description: `You defeated ${selectedMonster?.name} and earned ${result.goldEarned} gold!`,
      });
    } else if (result.battleResult === 'defeat') {
      toast({
        title: "Defeated",
        description: `${selectedMonster?.name} has bested you in combat.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/battle")}
                className="text-muted-foreground hover:text-foreground p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">PvE Dungeons</h1>
                <p className="text-muted-foreground mt-0.5 text-sm">Explore dangerous dungeons and battle monsters</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Your Level</div>
              <div className="text-xl font-bold text-green-400">{userLevel}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Player Stats Summary */}
        <Card className="mb-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">HP</div>
                <div className="text-lg font-bold text-red-400">
                  {userStats.currentHp}/{userStats.maxHp}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">MP</div>
                <div className="text-lg font-bold text-blue-400">
                  {userStats.currentMp}/{userStats.maxMp}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Gold</div>
                <div className="text-lg font-bold text-yellow-400 flex items-center justify-center gap-1">
                  <Coins className="w-4 h-4" />
                  {userStats.gold}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Battles Won</div>
                <div className="text-lg font-bold text-green-400 flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {userStats.battlesWon}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dungeons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DUNGEONS.map((dungeon) => {
            const isAccessible = userLevel >= dungeon.minLevel;
            const isRecommended = userLevel >= dungeon.minLevel && userLevel <= dungeon.maxLevel;
            
            return (
              <Card 
                key={dungeon.id}
                className={`transition-all duration-300 hover:scale-105 ${
                  isAccessible 
                    ? `bg-gradient-to-br ${dungeon.background} border-2 ${dungeon.borderColor}` 
                    : "bg-gradient-to-br from-gray-900/20 to-gray-800/20 border-2 border-gray-500/50 opacity-60"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        isRecommended ? 'bg-green-600 text-white' : 
                        isAccessible ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                      }`}>
                        {dungeon.rank}-Rank
                      </div>
                      <span className="text-lg">{dungeon.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Lv. {dungeon.minLevel}-{dungeon.maxLevel}
                    </div>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{dungeon.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Monsters:</h4>
                    {dungeon.monsters.map((monster: any) => (
                      <div 
                        key={monster.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isAccessible 
                            ? "bg-card/50 border-border hover:bg-card/80 cursor-pointer transition-all duration-200" 
                            : "bg-gray-800/30 border-gray-700 cursor-not-allowed"
                        }`}
                        onClick={isAccessible ? () => startBattle(dungeon, monster) : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Sword className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{monster.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Lv. {monster.level}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-red-400" />
                            <span>{monster.hp} HP</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-yellow-400" />
                            <span>{monster.attack} ATK</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-yellow-400" />
                            <span>{monster.goldReward}</span>
                          </div>
                          {isAccessible && (
                            <Button size="sm" variant="outline" className="ml-2">
                              <Target className="w-3 h-3 mr-1" />
                              Fight
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {!isAccessible && (
                      <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground">
                          Requires Level {dungeon.minLevel}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Battle Modal */}
      <Dialog open={showBattleModal} onOpenChange={setShowBattleModal}>
        <DialogContent className="sm:max-w-4xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
              <Sword className="w-6 h-6 text-red-400" />
              {selectedMonster?.name} Battle
            </DialogTitle>
            <p className="text-center text-muted-foreground">
              {selectedDungeon?.name} • Level {selectedMonster?.level}
            </p>
          </DialogHeader>
          
          <div className="p-4">
            {currentBattle && (
              <EnhancedBattleSystem
                monsterId={selectedMonster?.id}
                onBattleComplete={handleBattleComplete}
              />
            )}
          </div>
          
          <div className="flex justify-center p-4">
            <Button 
              variant="outline" 
              onClick={() => setShowBattleModal(false)}
            >
              Retreat from Battle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}