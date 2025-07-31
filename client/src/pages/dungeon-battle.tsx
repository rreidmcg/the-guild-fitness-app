import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Sword, 
  Shield, 
  Heart, 
  Zap, 
  ArrowLeft,
  Skull,
  Coins,
  Clock,
  Trophy,
  Star,
  Package,
  Play,
  LogOut
} from "lucide-react";
import { ParallaxBackground } from "@/components/ui/parallax-background";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Import monster images
import greenSlimeImage from "@assets/IMG_3665_1753055571089.png";
import caveRatImage from "@assets/IMG_3670_1753151064629.png";
import wildGoblinImage from "@assets/0F1ED511-7E0E-4062-A429-FB8B7BC6B4FE_1753151490494.png";
import forestSpiderImage from "@assets/1B395958-75E1-4297-8F5E-27BED5DC1608_1753196270170.png";
import slimeKingImage from "@assets/BA7F4BEB-8274-40C6-8CB1-398C9BBD1581_1753841529625.png";
import ratChieftainImage from "@assets/D974E952-8A54-4037-AC48-754ACAA0F285_1753839669430.png";
import goblinWarlordImage from "@assets/36CF820D-0CC0-4C99-A780-79B6D125B307_1753844608679.png";
import broodmotherImage from "@assets/CE5B8D2E-90AF-4DC0-A904-EDB98089C00A_1753845237897.png";
import forestBackgroundImage from "@assets/AD897CD2-5CB0-475D-B782-E09FD8D98DF7_1753153903824.png";

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
  skinColor?: string;
  hairColor?: string;
  gender?: string;
}

interface Monster {
  id: number;
  name: string;
  level: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  goldReward: number;
  description: string;
  image?: string;
}

interface DungeonZone {
  id: string;
  name: string;
  description: string;
  background: string;
  monsters: Monster[];
  storyIntro: string;
  completionStory: string;
}

// Define the dungeon zones data
const ERANK_DUNGEON_ZONES: DungeonZone[] = [
  {
    id: "slime_caverns",
    name: "The Slime Caverns",
    description: "A damp cave system filled with bouncing green slimes",
    background: "#2d5016",
    storyIntro: "You descend into the damp, echoing caverns where the walls glisten with slime trails. The air is thick and humid...",
    completionStory: "The caverns fall silent as the last slime dissolves. You notice strange crystals embedded in the walls.",
    monsters: [
      { id: 1, name: "Green Slime", level: 1, maxHp: 15, currentHp: 15, attack: 3, goldReward: 2, description: "A bouncing ball of green goo", image: greenSlimeImage },
      { id: 2, name: "Blue Slime", level: 2, maxHp: 18, currentHp: 18, attack: 4, goldReward: 3, description: "A slightly tougher slime with blue coloring", image: greenSlimeImage },
      { id: 3, name: "Red Slime", level: 3, maxHp: 21, currentHp: 21, attack: 5, goldReward: 4, description: "An aggressive red slime that burns to the touch", image: greenSlimeImage },
      { id: 4, name: "Crystal Slime", level: 4, maxHp: 24, currentHp: 24, attack: 6, goldReward: 5, description: "A translucent slime infused with magical crystals", image: greenSlimeImage },
      { id: 5, name: "Giant Slime", level: 5, maxHp: 27, currentHp: 27, attack: 7, goldReward: 6, description: "A massive slime that towers above the rest", image: greenSlimeImage },
      { id: 6, name: "Slime King", level: 6, maxHp: 45, currentHp: 45, attack: 8, goldReward: 12, description: "🏆 BOSS: The ruler of all slimes in the caverns", image: slimeKingImage }
    ]
  },
  {
    id: "rat_warrens",
    name: "The Rat Warrens",
    description: "Underground tunnels infested with oversized rats",
    background: "#4a3728",
    storyIntro: "You squeeze through narrow tunnels as the sound of scurrying echoes around you. Red eyes gleam in the darkness...",
    completionStory: "The tunnels grow quiet as you defeat the last of the rat pack. You discover hidden passages leading deeper underground.",
    monsters: [
      { id: 7, name: "Cave Rat", level: 2, maxHp: 18, currentHp: 18, attack: 4, goldReward: 3, description: "A mangy rat with sharp teeth", image: caveRatImage },
      { id: 8, name: "Dire Rat", level: 3, maxHp: 21, currentHp: 21, attack: 5, goldReward: 4, description: "A larger, more aggressive rat", image: caveRatImage },
      { id: 9, name: "Rat Scout", level: 4, maxHp: 24, currentHp: 24, attack: 6, goldReward: 5, description: "A nimble rat that strikes quickly", image: caveRatImage },
      { id: 10, name: "Rat Warrior", level: 5, maxHp: 27, currentHp: 27, attack: 7, goldReward: 6, description: "A battle-hardened rat with scars", image: caveRatImage },
      { id: 11, name: "Giant Rat", level: 6, maxHp: 30, currentHp: 30, attack: 8, goldReward: 7, description: "A massive rat the size of a dog", image: caveRatImage },
      { id: 12, name: "Rat Chieftain", level: 7, maxHp: 49, currentHp: 49, attack: 9, goldReward: 14, description: "🏆 BOSS: The alpha rat ruling the warrens", image: ratChieftainImage }
    ]
  }
];

interface BattleState {
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  monster: Monster | null;
  battleLog: string[];
  isPlayerTurn: boolean;
  battleResult: 'ongoing' | 'victory' | 'defeat';
  currentMonsterIndex: number;
  totalGoldEarned: number;
  zone: DungeonZone | null;
  showActionModal: boolean;
  actionMode?: 'main' | 'fight' | 'item';
}

// Inline item menu component for battle usage
function InlineItemMenu({ setBattleState }: { setBattleState: any }) {
  const { toast } = useToast();
  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const usePotionMutation = useMutation({
    mutationFn: async (potionType: string) => {
      return apiRequest("/api/use-potion", {
        method: "POST",
        body: { potionType }
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      // No success toast - only show errors
    },
    onError: (error: any) => {
      toast({
        title: "Cannot Use Potion",
        description: error.message || "You don't have this potion or are already at full capacity",
        variant: "destructive",
      });
    },
  });

  const potions = Array.isArray(inventory) ? inventory.filter((item: any) => item.itemType === 'potion') : [];

  return (
    <div className="space-y-0.5 text-left">
      {potions.length === 0 ? (
        <div className="text-cyan-300 text-xs">No items</div>
      ) : (
        potions.slice(0, 3).map((potion: any) => (
          <button
            key={potion.id}
            className="block w-full text-cyan-300 hover:text-cyan-200 text-xs font-semibold text-left"
            onClick={() => usePotionMutation.mutate(potion.itemId)}
            disabled={usePotionMutation.isPending}
          >
            {potion.itemId.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} x{potion.quantity}
          </button>
        ))
      )}
      <button 
        className="block w-full text-cyan-300 hover:text-cyan-200 text-xs text-left"
        onClick={() => setBattleState(prev => ({ ...prev, actionMode: 'main' }))}
      >
        ← Back
      </button>
    </div>
  );
}

export default function DungeonBattlePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const params = useParams();
  const zoneId = params.id;

  const [battleState, setBattleState] = useState<BattleState>({
    playerHp: 0,
    playerMaxHp: 0,
    playerMp: 0,
    playerMaxMp: 0,
    monster: null,
    battleLog: [],
    isPlayerTurn: true,
    battleResult: 'ongoing',
    currentMonsterIndex: 0,
    totalGoldEarned: 0,
    zone: null,
    showActionModal: false,
    actionMode: 'main'
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  // Initialize battle when component loads
  useEffect(() => {
    if (userStats && zoneId) {
      const zone = ERANK_DUNGEON_ZONES.find(z => z.id === zoneId);
      if (zone) {
        initializeBattle(zone);
      } else {
        toast({
          title: "Zone Not Found",
          description: "The requested dungeon zone could not be found.",
          variant: "destructive",
        });
        navigate("/pve-dungeons");
      }
    }
  }, [userStats, zoneId]);

  // Reset action mode when it's the player's turn
  useEffect(() => {
    if (battleState.isPlayerTurn && battleState.battleResult === 'ongoing') {
      setBattleState(prev => ({ ...prev, actionMode: 'main' }));
    }
  }, [battleState.isPlayerTurn, battleState.battleResult]);

  const initializeBattle = (zone: DungeonZone) => {
    const firstMonster = zone.monsters[0];
    setBattleState({
      playerHp: userStats!.currentHp,
      playerMaxHp: userStats!.maxHp,
      playerMp: userStats!.currentMp,
      playerMaxMp: userStats!.maxMp,
      monster: { ...firstMonster, currentHp: firstMonster.maxHp },
      battleLog: [`You enter ${zone.name}...`, `A wild ${firstMonster.name} appears!`],
      isPlayerTurn: true,
      battleResult: 'ongoing',
      currentMonsterIndex: 0,
      totalGoldEarned: 0,
      zone
    });
  };

  const attackMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/battle/attack", {
        method: "POST",
        body: JSON.stringify({
          monsterId: battleState.monster?.id,
          zoneId: battleState.zone?.id
        })
      });
    },
    onSuccess: (data) => {
      handleBattleResult(data);
    },
    onError: () => {
      toast({
        title: "Battle Error",
        description: "Something went wrong during battle.",
        variant: "destructive",
      });
    },
  });

  const handleBattleResult = (data: any) => {
    setBattleState(prev => ({
      ...prev,
      playerHp: data.playerHp,
      playerMp: data.playerMp,
      monster: data.monster,
      battleLog: [...prev.battleLog, ...data.battleLog],
      battleResult: data.battleResult,
      totalGoldEarned: prev.totalGoldEarned + (data.goldEarned || 0)
    }));

    if (data.battleResult === 'victory') {
      // Move to next monster or complete dungeon
      const nextIndex = battleState.currentMonsterIndex + 1;
      if (nextIndex < battleState.zone!.monsters.length) {
        // Next monster
        setTimeout(() => {
          const nextMonster = battleState.zone!.monsters[nextIndex];
          setBattleState(prev => ({
            ...prev,
            monster: { ...nextMonster, currentHp: nextMonster.maxHp },
            currentMonsterIndex: nextIndex,
            battleResult: 'ongoing',
            isPlayerTurn: true,
            battleLog: [...prev.battleLog, `A wild ${nextMonster.name} appears!`]
          }));
        }, 2000);
      } else {
        // Dungeon complete
        toast({
          title: "Dungeon Complete!",
          description: `You earned ${battleState.totalGoldEarned + (data.goldEarned || 0)} gold total!`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      }
    }
  };

  const handleAttack = () => {
    if (battleState.isPlayerTurn && battleState.battleResult === 'ongoing') {
      attackMutation.mutate();
    }
  };

  const handleRetreat = () => {
    navigate("/pve-dungeons");
  };

  if (!userStats || !battleState.zone) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="text-center text-muted-foreground">Loading battle...</div>
      </div>
    );
  }

  const progressPercent = ((battleState.currentMonsterIndex + (battleState.battleResult === 'victory' ? 1 : 0)) / battleState.zone.monsters.length) * 100;

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Forest Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${forestBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
        }}
      />
      


      {/* Battle Scene */}
      <div className="relative z-10 flex-1 flex flex-col justify-center min-h-[calc(100vh-80px)]">
        {/* Character Sprites - Battle Field */}
        <div className="flex-1 flex items-end justify-between px-4 md:px-8 pb-32 relative">
          {/* Player Character */}
          <div className="flex flex-col items-center relative" style={{ transform: 'translateY(-20px)' }}>
            <Avatar2D 
              playerStats={userStats}
              className="w-24 h-24 md:w-40 md:h-40"
            />
          </div>
          
          {/* Monster Sprite */}
          {battleState.monster && battleState.monster.image && (
            <div className="flex flex-col items-center relative">
              <img 
                src={battleState.monster.image} 
                alt={battleState.monster.name}
                className="w-24 h-24 md:w-40 md:h-40 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Battle UI - 3 Column Layout */}
      <div className="fixed bottom-16 left-0 right-0 z-20 bg-gray-900/80 backdrop-blur-md border-t-2 border-blue-500/60 shadow-lg shadow-blue-500/20">
        <div className="flex h-20">
          {/* Player Stats (Left - Larger) */}
          <div className="w-2/5 p-3 pt-2 border-r border-blue-500/60">
            <div className="flex items-center space-x-3 mb-1">
              <div className="text-sm font-bold text-yellow-200">{userStats.username} <span className="text-xs text-blue-300">Lv.{userStats.level}</span></div>
              {/* HP Bar */}
              <div className="w-16">
                <div className="bg-gray-700 rounded-full h-2 relative overflow-hidden border border-gray-500">
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                    style={{ width: `${(battleState.playerHp / battleState.playerMaxHp) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-green-200 mt-0.5 font-medium">HP: {battleState.playerHp}/{battleState.playerMaxHp}</div>
              </div>
              {/* MP Bar */}
              <div className="w-16">
                <div className="bg-gray-700 rounded-full h-2 relative overflow-hidden border border-gray-500">
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
                    style={{ width: `${(battleState.playerMp / battleState.playerMaxMp) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-blue-200 mt-0.5 font-medium">MP: {battleState.playerMp}/{battleState.playerMaxMp}</div>
              </div>
            </div>
          </div>

          {/* Action Menu (Center - Smaller) */}
          <div className="w-1/5 p-2 pt-1 border-r border-blue-500/60 bg-blue-900/20 backdrop-blur-sm">
            {battleState.isPlayerTurn && battleState.battleResult === 'ongoing' ? (
              <div className="space-y-0.5 text-left">
                {battleState.actionMode === 'main' ? (
                  <>
                    <button 
                      className="block w-full text-cyan-300 hover:text-cyan-200 text-xs font-semibold text-left"
                      onClick={() => setBattleState(prev => ({ ...prev, actionMode: 'fight' }))}
                    >
                      Fight
                    </button>
                    <button 
                      className="block w-full text-cyan-300 hover:text-cyan-200 text-xs font-semibold text-left"
                      onClick={() => setBattleState(prev => ({ ...prev, actionMode: 'item' }))}
                    >
                      Item
                    </button>
                    <button 
                      className="block w-full text-cyan-300 hover:text-cyan-200 text-xs font-semibold text-left"
                      onClick={handleRetreat}
                    >
                      Run
                    </button>
                  </>
                ) : battleState.actionMode === 'fight' ? (
                  <>
                    <button 
                      className="block w-full text-cyan-300 hover:text-cyan-200 text-xs font-semibold text-left"
                      onClick={handleAttack}
                      disabled={attackMutation.isPending}
                    >
                      {attackMutation.isPending ? "Attacking..." : "Attack"}
                    </button>
                    <button 
                      className="block w-full text-cyan-300 hover:text-cyan-200 text-xs font-semibold text-left"
                      onClick={() => {
                        setBattleState(prev => ({ ...prev, actionMode: 'main' }));
                        toast({ title: "Defense", description: "You brace for the enemy's attack!" });
                      }}
                    >
                      Defend
                    </button>
                    <button 
                      className="block w-full text-cyan-300 hover:text-cyan-200 text-xs text-left"
                      onClick={() => setBattleState(prev => ({ ...prev, actionMode: 'main' }))}
                    >
                      ← Back
                    </button>
                  </>
                ) : (
                  <InlineItemMenu setBattleState={setBattleState} />
                )}
              </div>
            ) : (
              <div className="text-cyan-300 text-xs font-semibold pt-3 text-left">Enemy Turn</div>
            )}
          </div>

          {/* Monster Stats (Right - Larger) */}
          {battleState.monster && (
            <div className="w-2/5 p-3 pt-2 text-right">
              <div className="flex items-center justify-end space-x-3 mb-1">
                <div className="w-20">
                  <div className="bg-gray-700 rounded-full h-2 relative overflow-hidden border border-gray-500">
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
                      style={{ width: `${(battleState.monster.currentHp / battleState.monster.maxHp) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-red-200 mt-0.5 font-medium">HP: {battleState.monster.currentHp}/{battleState.monster.maxHp}</div>
                </div>
                <div className="text-sm font-bold text-red-200"><span className="text-xs text-blue-300">Lv.{battleState.monster.level}</span> {battleState.monster.name}</div>
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}

