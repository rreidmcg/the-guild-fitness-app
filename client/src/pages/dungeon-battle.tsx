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

// Import background images for different environments
import forestBackgroundImage from "@assets/AD897CD2-5CB0-475D-B782-E09FD8D98DF7_1753153903824.png";
import sunsetForestBg from "@assets/38F18B04-AA5B-42A3-9A39-BAB6798C8D7B_1753887273683.png";
import battleArenaReference from "@assets/IMG_3695_1753992393781.png";
import attackButtonIcon from "@assets/IMG_3799_1754013496468.png";

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
function InlineItemMenu({ setBattleState, isMobile = false }: { setBattleState: any, isMobile?: boolean }) {
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

  if (isMobile) {
    return (
      <div className="flex space-x-2 w-full">
        {potions.length === 0 ? (
          <div className="flex-1 text-xs tracking-wider uppercase battle-menu-text text-center">NO ITEMS</div>
        ) : (
          potions.slice(0, 2).map((potion: any) => (
            <button
              key={potion.id}
              className="flex-1 text-xs font-semibold text-center tracking-wider uppercase battle-menu-text hover:bg-white/10 rounded transition-colors"
              onClick={() => usePotionMutation.mutate(potion.itemId)}
              disabled={usePotionMutation.isPending}
            >
              {potion.itemId.split('_')[0].toUpperCase()} x{potion.quantity}
            </button>
          ))
        )}
        <button 
          className="flex-1 text-xs text-center tracking-wider uppercase battle-menu-text hover:bg-white/10 rounded transition-colors"
          onClick={() => setBattleState((prev: any) => ({ ...prev, actionMode: 'main' }))}
        >
          ← BACK
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 text-center">
      {potions.length === 0 ? (
        <div className="text-xs tracking-wider uppercase battle-menu-text">NO ITEMS</div>
      ) : (
        potions.slice(0, 3).map((potion: any) => (
          <button
            key={potion.id}
            className="block w-full text-xs font-semibold text-center tracking-wider uppercase battle-menu-text"
            onClick={() => usePotionMutation.mutate(potion.itemId)}
            disabled={usePotionMutation.isPending}
          >
            {potion.itemId.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} x{potion.quantity}
          </button>
        ))
      )}
      <button 
        className="block w-full text-xs text-center tracking-wider uppercase battle-menu-text"
        onClick={() => setBattleState((prev: any) => ({ ...prev, actionMode: 'main' }))}
      >
        ← BACK
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

  // Prevent scrolling on battle page
  useEffect(() => {
    // Save current body styles
    const originalStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      height: document.body.style.height,
    };
    
    // Apply scroll lock
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.height = '100vh';
    document.body.style.width = '100%';
    
    // Cleanup function to restore original styles
    return () => {
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.position = originalStyle.position;
      document.body.style.height = originalStyle.height;
      document.body.style.width = '';
    };
  }, []);

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
      zone,
      showActionModal: false,
      actionMode: 'main'
    });
  };

  const attackMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/battle/attack", {
        method: "POST",
        body: {
          monsterId: battleState.monster?.id,
          zoneId: battleState.zone?.id
        }
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
    <div className="relative h-screen overflow-hidden" style={{ touchAction: 'none', overscrollBehavior: 'none' }}>
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
      
      {/* Atmospheric overlay for depth */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-transparent via-transparent to-black/20" />

      {/* Battle Scene */}
      <div className="relative z-10 flex-1 flex flex-col justify-center min-h-[calc(100vh-80px)]" style={{ touchAction: 'none' }}>
        {/* Enhanced HP/MP Display - Floating above characters */}
        <div className="absolute top-20 left-0 right-0 z-20 px-4 md:px-8">
          <div className="flex justify-between items-start">
            {/* Player Health Display */}
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-green-500/30">
              <div className="text-sm font-bold text-yellow-200 mb-2">
                {userStats.username} <span className="text-xs text-blue-300">Lv.{userStats.level}</span>
              </div>
              <div className="space-y-2">
                {/* HP Bar with glow effect */}
                <div className="relative">
                  <div className="bg-black/50 rounded-full h-3 w-40 border border-green-500/50 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-300 transition-all duration-500 shadow-inner"
                      style={{ 
                        width: `${(battleState.playerHp / battleState.playerMaxHp) * 100}%`,
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(34, 197, 94, 0.4)'
                      }}
                    />
                  </div>
                  <div className="text-xs text-green-200 mt-1 font-medium text-center">
                    HP: {battleState.playerHp}/{battleState.playerMaxHp}
                  </div>
                </div>
                {/* MP Bar with glow effect */}
                <div className="relative">
                  <div className="bg-black/50 rounded-full h-3 w-32 border border-blue-500/50 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-300 transition-all duration-500 shadow-inner"
                      style={{ 
                        width: `${(battleState.playerMp / battleState.playerMaxMp) * 100}%`,
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(59, 130, 246, 0.4)'
                      }}
                    />
                  </div>
                  <div className="text-xs text-blue-200 mt-1 font-medium text-center">
                    MP: {battleState.playerMp}/{battleState.playerMaxMp}
                  </div>
                </div>
              </div>
            </div>

            {/* Monster Health Display */}
            {battleState.monster && (
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-red-500/30">
                <div className="text-sm font-bold text-red-200 mb-2 text-right">
                  <span className="text-xs text-blue-300">Lv.{battleState.monster.level}</span> {battleState.monster.name}
                </div>
                <div className="relative">
                  <div className="bg-black/50 rounded-full h-3 w-40 border border-red-500/50 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 to-red-300 transition-all duration-500 shadow-inner"
                      style={{ 
                        width: `${(battleState.monster.currentHp / battleState.monster.maxHp) * 100}%`,
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(239, 68, 68, 0.4)'
                      }}
                    />
                  </div>
                  <div className="text-xs text-red-200 mt-1 font-medium text-center">
                    HP: {battleState.monster.currentHp}/{battleState.monster.maxHp}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Character Sprites - Battle Field with enhanced positioning */}
        <div className="flex-1 flex items-end justify-between px-8 md:px-16 pb-24 md:pb-32 relative mt-32" style={{ touchAction: 'none', userSelect: 'none' }}>
          {/* Player Character with shadow and positioning */}
          <div className="flex flex-col items-center relative" style={{ transform: 'translateY(-20px)' }}>
            {/* Character shadow */}
            <div 
              className="absolute bottom-0 w-16 h-4 bg-black/30 rounded-full blur-sm"
              style={{ transform: 'translateY(10px)' }}
            />
            <Avatar2D 
              playerStats={userStats}
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 relative z-10"
            />
          </div>
          
          {/* Monster Sprite with shadow and positioning */}
          {battleState.monster && battleState.monster.image && (
            <div className="flex flex-col items-center relative" style={{ transform: 'translateY(-20px)' }}>
              {/* Monster shadow */}
              <div 
                className="absolute bottom-0 w-16 h-4 bg-black/30 rounded-full blur-sm"
                style={{ transform: 'translateY(10px)' }}
              />
              <img 
                src={battleState.monster.image} 
                alt={battleState.monster.name}
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 object-contain relative z-10"
                style={{ 
                  imageRendering: 'pixelated',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Circular Icon Battle Interface - Transparent */}
      <div className="fixed bottom-16 left-0 right-0 z-30">
        {/* Mobile & Desktop Layout - Circular buttons */}
        <div className="p-4 md:p-6">
          {battleState.isPlayerTurn && battleState.battleResult === 'ongoing' ? (
            <div className="flex justify-center items-center space-x-4 md:space-x-6">
              {battleState.actionMode === 'main' ? (
                <>
                  {/* Fight Button */}
                  <button 
                    className="w-16 h-16 md:w-20 md:h-20 bg-blue-600/80 hover:bg-blue-500 border-2 border-blue-400/50 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                    onClick={() => setBattleState((prev: any) => ({ ...prev, actionMode: 'fight' }))}
                    style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 2px 4px rgba(255,255,255,0.1)' }}
                  >
                    <Sword className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </button>
                  
                  {/* Items Button */}
                  <button 
                    className="w-16 h-16 md:w-20 md:h-20 bg-green-600/80 hover:bg-green-500 border-2 border-green-400/50 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                    onClick={() => setBattleState((prev: any) => ({ ...prev, actionMode: 'item' }))}
                    style={{ boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4), inset 0 2px 4px rgba(255,255,255,0.1)' }}
                  >
                    <Package className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </button>
                  
                  {/* Flee Button */}
                  <button 
                    className="w-16 h-16 md:w-20 md:h-20 bg-gray-600/80 hover:bg-gray-500 border-2 border-gray-400/50 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to flee from battle?")) {
                        handleRetreat();
                      }
                    }}
                    style={{ boxShadow: '0 4px 12px rgba(75, 85, 99, 0.4), inset 0 2px 4px rgba(255,255,255,0.1)' }}
                  >
                    <ArrowLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </button>
                </>
              ) : battleState.actionMode === 'fight' ? (
                <>
                  {/* Attack Button */}
                  <button 
                    className="w-16 h-16 md:w-20 md:h-20 bg-transparent rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    onClick={handleAttack}
                    disabled={attackMutation.isPending}
                  >
                    {attackMutation.isPending ? (
                      <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-white"></div>
                    ) : (
                      <img 
                        src={attackButtonIcon} 
                        alt="Attack" 
                        className="w-16 h-16 md:w-20 md:h-20 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    )}
                  </button>
                  
                  {/* Defend Button */}
                  <button 
                    className="w-16 h-16 md:w-20 md:h-20 bg-yellow-600/80 hover:bg-yellow-500 border-2 border-yellow-400/50 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                    onClick={() => {
                      setBattleState((prev: any) => ({ ...prev, actionMode: 'main' }));
                      toast({ title: "Defense", description: "You brace for the enemy's attack!" });
                    }}
                    style={{ boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(255,255,255,0.1)' }}
                  >
                    <Shield className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </button>
                  
                  {/* Back Button */}
                  <button 
                    className="w-16 h-16 md:w-20 md:h-20 bg-gray-600/80 hover:bg-gray-500 border-2 border-gray-400/50 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                    onClick={() => setBattleState((prev: any) => ({ ...prev, actionMode: 'main' }))}
                    style={{ boxShadow: '0 4px 12px rgba(75, 85, 99, 0.4), inset 0 2px 4px rgba(255,255,255,0.1)' }}
                  >
                    <ArrowLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <InlineItemMenu setBattleState={setBattleState} />
                  <button 
                    className="w-16 h-16 md:w-20 md:h-20 bg-gray-600/80 hover:bg-gray-500 border-2 border-gray-400/50 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                    onClick={() => setBattleState((prev: any) => ({ ...prev, actionMode: 'main' }))}
                    style={{ boxShadow: '0 4px 12px rgba(75, 85, 99, 0.4), inset 0 2px 4px rgba(255,255,255,0.1)' }}
                  >
                    <ArrowLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-lg md:text-xl font-bold text-yellow-200 tracking-wider uppercase py-4 bg-red-900/50 rounded-lg border-2 border-red-400/50">
              ⏳ ENEMY TURN
            </div>
          )}
        </div>
      </div>


    </div>
  );
}

