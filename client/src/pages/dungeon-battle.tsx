import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BattleLoadingState } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";

// Import battle system defensive styles
import "../styles/battle-system.css";
import { 
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
import swordIconImage from "@assets/IMG_3799_1754013496468.png";
import { ParallaxBackground } from "@/components/ui/parallax-background";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { BattleAvatar } from "@/components/ui/battle-avatar";
import { BattleAccessGuard } from "@/components/ui/battle-access-guard";
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
import fleeButtonIcon from "@assets/IMG_3802_1754019197198.png";

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
  },
  {
    id: "spider_forest",
    name: "The Spider Forest",
    description: "Dark woods where massive spiders weave deadly webs",
    background: "#1a3d1a",
    storyIntro: "You enter the shadowy forest where enormous webs block your path and eight-legged creatures lurk in the canopy...",
    completionStory: "The forest grows quiet as the last spider retreats. You notice rare herbs growing beneath the cleared webs.",
    monsters: [
      { id: 13, name: "Web Spinner", level: 3, maxHp: 21, currentHp: 21, attack: 5, goldReward: 4, description: "A nimble spider that sets traps", image: forestSpiderImage },
      { id: 14, name: "Venom Spider", level: 4, maxHp: 24, currentHp: 24, attack: 6, goldReward: 5, description: "A spider with deadly poison", image: forestSpiderImage },
      { id: 15, name: "Hunter Spider", level: 5, maxHp: 27, currentHp: 27, attack: 7, goldReward: 6, description: "An aggressive predator spider", image: forestSpiderImage },
      { id: 16, name: "Shadow Spider", level: 6, maxHp: 30, currentHp: 30, attack: 8, goldReward: 7, description: "A spider that strikes from darkness", image: forestSpiderImage },
      { id: 17, name: "Giant Spider", level: 7, maxHp: 33, currentHp: 33, attack: 9, goldReward: 8, description: "A massive arachnid with thick chitin", image: forestSpiderImage },
      { id: 18, name: "Broodmother", level: 8, maxHp: 56, currentHp: 56, attack: 10, goldReward: 16, description: "🏆 BOSS: The queen of all forest spiders", image: broodmotherImage }
    ]
  },
  {
    id: "goblin_camps",
    name: "The Goblin Camps",
    description: "Crude settlements where savage goblins plot their raids",
    background: "#3d2b1f",
    storyIntro: "You approach the chaotic goblin encampment where crude weapons glint in firelight and war drums echo...",
    completionStory: "The camps fall silent as goblin resistance crumbles. You discover stolen treasures and crude maps.",
    monsters: [
      { id: 19, name: "Goblin Scout", level: 4, maxHp: 24, currentHp: 24, attack: 6, goldReward: 5, description: "A sneaky goblin with a rusty blade", image: wildGoblinImage },
      { id: 20, name: "Forest Spider", level: 7, maxHp: 30, currentHp: 30, attack: 6, goldReward: 4, description: "A venomous hunter with razor-sharp fangs", image: forestSpiderImage },
      { id: 21, name: "Goblin Warrior", level: 5, maxHp: 27, currentHp: 27, attack: 7, goldReward: 6, description: "A battle-hardened goblin fighter", image: wildGoblinImage },
      { id: 22, name: "Goblin Shaman", level: 6, maxHp: 30, currentHp: 30, attack: 8, goldReward: 7, description: "A goblin wielding dark magic", image: wildGoblinImage },
      { id: 23, name: "Goblin Berserker", level: 7, maxHp: 33, currentHp: 33, attack: 9, goldReward: 8, description: "A frenzied goblin warrior", image: wildGoblinImage },
      { id: 24, name: "Goblin Warlord", level: 8, maxHp: 56, currentHp: 56, attack: 10, goldReward: 16, description: "🏆 BOSS: The brutal leader of the goblin horde", image: goblinWarlordImage }
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
  playerLunging: boolean;
  monsterLunging: boolean;
  playerDamage: number | null;
  monsterDamage: number | null;
  playerFlashing: boolean;
  monsterFlashing: boolean;
  screenShaking: boolean;
  playerCriticalHit: boolean;
  monsterCriticalHit: boolean;
  attacksRemaining: number;
  attackCount: number;
  lastAttackTime: number;
  isCombo: boolean;
  comboMultiplier: number;
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
    playerLunging: false,
    monsterLunging: false,
    playerDamage: null,
    monsterDamage: null,
    playerFlashing: false,
    monsterFlashing: false,
    screenShaking: false,
    playerCriticalHit: false,
    monsterCriticalHit: false,
    attacksRemaining: 4,
    attackCount: 0,
    lastAttackTime: 0,
    isCombo: false,
    comboMultiplier: 1.0
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
      playerLunging: false,
      monsterLunging: false,
      playerDamage: null,
      monsterDamage: null,
      playerFlashing: false,
      monsterFlashing: false,
      screenShaking: false,
      playerCriticalHit: false,
      monsterCriticalHit: false,
      attacksRemaining: 4,
      attackCount: 0,
      lastAttackTime: 0,
      isCombo: false,
      comboMultiplier: 1.0
    });
  };

  const attackMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/battle/attack", {
        method: "POST",
        body: {
          monster: battleState.monster,
          playerHp: battleState.playerHp,
          playerMp: battleState.playerMp,
          attackCount: battleState.attackCount,
          lastAttackTime: battleState.lastAttackTime
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
    // Extract damage numbers from battle log
    const playerDamageMatch = data.battleLog[0]?.match(/You deal (\d+) damage/);
    const monsterDamageMatch = data.battleLog[1]?.match(/attacks for (\d+) damage/);
    
    const playerDamage = playerDamageMatch ? parseInt(playerDamageMatch[1]) : null;
    const monsterDamage = monsterDamageMatch ? parseInt(monsterDamageMatch[1]) : null;

    // Start player lunge and monster flash (taking damage), and screen shake on hit
    setBattleState(prev => ({
      ...prev,
      playerLunging: true,
      playerDamage: playerDamage,
      monsterFlashing: playerDamage !== null,
      screenShaking: playerDamage !== null,
      playerCriticalHit: data.playerCriticalHit || false,
      attacksRemaining: data.attacksRemaining,
      attackCount: data.attackCount,
      lastAttackTime: data.lastAttackTime,
      isCombo: data.isCombo || false,
      comboMultiplier: data.comboMultiplier || 1.0,
      isPlayerTurn: data.attacksRemaining > 0 // Continue player turn if attacks remaining
    }));

    // After player lunge, clear player attack effects
    setTimeout(() => {
      setBattleState(prev => ({
        ...prev,
        playerLunging: false,
        playerDamage: null,
        monsterFlashing: false,
        screenShaking: false,
        playerCriticalHit: false
      }));

      // Handle monster counter-attack (only when player's turn is completely over)
      if (monsterDamage !== null && data.attacksRemaining === 0) {
        setTimeout(() => {
          setBattleState(prev => ({
            ...prev,
            playerHp: data.playerHp,
            playerMp: data.playerMp,
            monster: data.monster,
            battleLog: [...prev.battleLog, ...data.battleLog],
            battleResult: data.battleResult,
            totalGoldEarned: prev.totalGoldEarned + (data.goldEarned || 0),
            isPlayerTurn: false, // Monster's turn now
            monsterLunging: true,
            monsterDamage: monsterDamage,
            playerFlashing: true,
            screenShaking: monsterDamage !== null,
            monsterCriticalHit: data.monsterCriticalHit || false
          }));

          // Clear monster attack effects and reset player turn
          setTimeout(() => {
            setBattleState(prev => ({
              ...prev,
              monsterLunging: false,
              monsterDamage: null,
              playerFlashing: false,
              screenShaking: false,
              monsterCriticalHit: false,
              isPlayerTurn: true, // Reset to player turn
              attacksRemaining: 4, // Reset attacks for new turn
              attackCount: 0,
              lastAttackTime: 0
            }));
          }, 800);
        }, 600);
      } else if (data.attacksRemaining === 0 && monsterDamage === null) {
        // Player turn ended but no monster attack (monster defeated)
        setBattleState(prev => ({
          ...prev,
          playerHp: data.playerHp,
          playerMp: data.playerMp,
          monster: data.monster,
          battleLog: [...prev.battleLog, ...data.battleLog],
          battleResult: data.battleResult,
          totalGoldEarned: prev.totalGoldEarned + (data.goldEarned || 0),
          isPlayerTurn: false
        }));
      } else {
        // Continue player turn, just update state
        setBattleState(prev => ({
          ...prev,
          playerHp: data.playerHp,
          playerMp: data.playerMp,
          monster: data.monster,
          battleLog: [...prev.battleLog, ...data.battleLog],
          battleResult: data.battleResult,
          totalGoldEarned: prev.totalGoldEarned + (data.goldEarned || 0)
        }));
      }
    }, 800);

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
            attacksRemaining: 4,
            attackCount: 0,
            lastAttackTime: 0,
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
    } else if (data.battleResult === 'defeat') {
      // Player defeated
      setTimeout(() => {
        navigate("/pve-dungeons");
      }, 3000);
    }
  };

  const handleAttack = () => {
    if (battleState.isPlayerTurn && battleState.battleResult === 'ongoing') {
      attackMutation.mutate();
    }
  }



  const handleRetreat = () => {
    navigate("/pve-dungeons");
  };

  if (!userStats || !battleState.zone) {
    return <BattleLoadingState message="Initializing battle..." />;
  }

  const progressPercent = ((battleState.currentMonsterIndex + (battleState.battleResult === 'victory' ? 1 : 0)) / battleState.zone.monsters.length) * 100;

  return (
    <BattleAccessGuard>
      <div 
        className={`relative h-screen overflow-hidden ${battleState.screenShaking ? 'animate-pulse' : ''}`} 
        style={{ 
          touchAction: 'none', 
          overscrollBehavior: 'none',
          animation: battleState.screenShaking ? 'screen-shake 0.5s ease-in-out' : undefined
        }}
      >
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
      <div 
        className="relative z-10 flex-1 flex flex-col justify-center min-h-[calc(100vh-80px)] cursor-pointer" 
        style={{ touchAction: 'none' }}
        onClick={battleState.isPlayerTurn && !attackMutation.isPending && battleState.battleResult === 'ongoing' ? handleAttack : undefined}
      >
        {/* Monster HP Bar - Top Center Prominent (Invisible Card) */}
        <div className="absolute top-4 left-0 right-0 z-20 px-4 md:px-8">
          <div className="max-w-2xl mx-auto">
            {battleState.monster && (
              <div className="text-center">
                {/* Monster Name and Level - Same Row Centered with Lv. abbreviation */}
                <div className="mb-3 flex items-center justify-center gap-2">
                  <p 
                    className="text-sm md:text-base font-bold" 
                    style={{ 
                      color: '#7f1d1d', 
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      filter: 'none'
                    }}
                  >
                    Lv. {battleState.monster.level}
                  </p>
                  <h3 
                    style={{ 
                      color: '#7f1d1d !important', 
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8) !important',
                      fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
                      fontWeight: 'bold',
                      filter: 'none !important',
                      WebkitTextFillColor: '#7f1d1d !important'
                    }}
                  >
                    {battleState.monster.name}
                  </h3>
                </div>
                
                {/* Large Monster HP Bar with darker red and white text */}
                <div className="relative">
                  <div className="bg-black/50 rounded-full h-6 md:h-8 border-2 border-red-700/50 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-800 to-red-700 transition-all duration-500 shadow-inner"
                      style={{ 
                        width: `${(battleState.monster.currentHp / battleState.monster.maxHp) * 100}%`,
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(153, 27, 27, 0.4)'
                      }}
                    />
                  </div>
                  {/* HP Ratio Text Inside Bar - White */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white font-bold text-sm md:text-base drop-shadow-lg">
                      {battleState.monster.currentHp} / {battleState.monster.maxHp}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Character Sprites - Battle Field with enhanced positioning */}
        <div className="flex-1 flex items-end justify-between px-8 md:px-16 pb-24 md:pb-32 relative mt-32" style={{ touchAction: 'none', userSelect: 'none' }}>
          {/* Player Character with HP/MP bars above (Invisible Card) */}
          <div className="flex flex-col items-center relative" style={{ transform: 'translateY(-20px)' }}>
            {/* Player HP/MP Bars above character - No visible card */}
            <div className="mb-4 space-y-1">
              {/* HP Bar */}
              <div className="relative">
                <div className="bg-black/50 rounded-full h-3 w-32 border border-green-500/50 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-300 transition-all duration-500"
                    style={{ 
                      width: `${(battleState.playerHp / battleState.playerMaxHp) * 100}%`,
                      boxShadow: '0 0 6px rgba(34, 197, 94, 0.4)'
                    }}
                  />
                </div>
                {/* HP Ratio Text Inside Bar */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-white font-bold text-xs drop-shadow-lg">
                    {battleState.playerHp}/{battleState.playerMaxHp}
                  </span>
                </div>
              </div>
              {/* MP Bar */}
              <div className="relative">
                <div className="bg-black/50 rounded-full h-3 w-28 border border-blue-500/50 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-300 transition-all duration-500"
                    style={{ 
                      width: `${(battleState.playerMp / battleState.playerMaxMp) * 100}%`,
                      boxShadow: '0 0 6px rgba(59, 130, 246, 0.4)'
                    }}
                  />
                </div>
                {/* MP Ratio Text Inside Bar */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-white font-bold text-xs drop-shadow-lg">
                    {battleState.playerMp}/{battleState.playerMaxMp}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Character shadow */}
            <div 
              className="absolute bottom-0 w-16 h-4 bg-black/30 rounded-full blur-sm"
              style={{ transform: 'translateY(10px)' }}
            />
            <div className="relative">
              <div 
                className={`w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 relative z-10 transition-all duration-300 ${
                  battleState.playerLunging ? 'translate-x-8 scale-110' : ''
                } ${
                  battleState.playerFlashing ? 'brightness-150' : ''
                }`}
                style={{
                  filter: battleState.playerFlashing ? 'brightness(1.5) hue-rotate(0deg) saturate(2) sepia(1) contrast(1.2) drop-shadow(0 0 10px rgba(255,0,0,0.8))' : undefined
                }}
              >
                <BattleAvatar 
                  playerStats={userStats}
                  className="[&>div]:!bg-transparent [&>div]:!shadow-none [&>div]:!border-none [&>div]:!rounded-none"
                />
              </div>
              {/* Monster Damage to Player */}
              {battleState.monsterDamage && (
                <div 
                  className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 font-bold z-20 ${
                    battleState.monsterCriticalHit ? 'text-4xl' : 'text-2xl'
                  }`}
                  style={{ 
                    color: battleState.monsterCriticalHit ? '#ff4444' : '#ff6b6b',
                    textShadow: battleState.monsterCriticalHit 
                      ? '2px 2px 4px rgba(0,0,0,0.9), 0 0 12px rgba(255,68,68,0.8), 0 0 24px rgba(255,68,68,0.4)' 
                      : '2px 2px 4px rgba(0,0,0,0.8)',
                    animation: 'float-up 1s ease-out forwards',
                    transform: battleState.monsterCriticalHit ? 'translate(-50%, -8px) scale(1.2)' : 'translate(-50%, -4px)'
                  }}
                >
                  -{battleState.monsterDamage}
                  {battleState.monsterCriticalHit && <span className="text-sm ml-1">CRIT!</span>}
                </div>
              )}
            </div>
          </div>
          
          {/* Monster Sprite with shadow and positioning */}
          {battleState.monster && battleState.monster.image && (
            <div className="flex flex-col items-center relative" style={{ transform: 'translateY(-20px)' }}>
              {/* Monster shadow */}
              <div 
                className="absolute bottom-0 w-24 h-6 bg-black/30 rounded-full blur-sm"
                style={{ transform: 'translateY(-5px)' }}
              />
              <div className="relative">
                <img 
                  src={battleState.monster.image} 
                  alt={battleState.monster.name}
                  className={`w-36 h-36 sm:w-48 sm:h-48 md:w-72 md:h-72 object-contain relative z-10 transition-all duration-300 ${
                    battleState.monsterLunging ? '-translate-x-8 scale-110' : ''
                  } ${
                    battleState.monsterFlashing ? 'brightness-150' : ''
                  }`}
                  style={{ 
                    imageRendering: 'pixelated',
                    filter: battleState.monsterFlashing 
                      ? 'brightness(1.5) hue-rotate(0deg) saturate(2) sepia(1) contrast(1.2) drop-shadow(0 0 10px rgba(255,0,0,0.8))' 
                      : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                  }}
                />
                {/* Player Damage to Monster */}
                {battleState.playerDamage && (
                  <div 
                    className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 font-bold z-20 ${
                      battleState.playerCriticalHit ? 'text-4xl' : 'text-2xl'
                    }`}
                    style={{ 
                      color: battleState.playerCriticalHit ? '#ffd700' : '#ffffff',
                      textShadow: battleState.playerCriticalHit 
                        ? '2px 2px 4px rgba(0,0,0,0.9), 0 0 12px rgba(255,215,0,0.8), 0 0 24px rgba(255,215,0,0.4)' 
                        : '2px 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(255,255,255,0.5)',
                      animation: 'float-up 1s ease-out forwards',
                      transform: battleState.playerCriticalHit ? 'translate(-50%, -8px) scale(1.2)' : 'translate(-50%, -4px)'
                    }}
                  >
                    -{battleState.playerDamage}
                    {battleState.playerCriticalHit && <span className="text-sm ml-1">CRIT!</span>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flee Button - Bottom Left Corner */}
      <div className="fixed bottom-4 left-4 z-30">
        <button 
          className="w-16 h-16 md:w-20 md:h-20 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 border-2 border-red-400/50"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering the battle screen click
            if (window.confirm("Are you sure you want to flee from battle?")) {
              handleRetreat();
            }
          }}
        >
          <img 
            src={fleeButtonIcon} 
            alt="Flee" 
            className="w-12 h-12 md:w-16 md:h-16 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        </button>
      </div>

      {/* Attack Indicators - Bottom Center */}
      <div className="fixed bottom-16 left-0 right-0 z-30">
        <div className="flex justify-center">
          {battleState.battleResult === 'ongoing' && (
            <div className="flex gap-2 items-center">
              {/* Attack dots */}
              {[1, 2, 3].map((dotIndex) => (
                <div
                  key={dotIndex}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    dotIndex <= (3 - battleState.attacksRemaining)
                      ? 'bg-gray-600 border-gray-500' // Used attacks - dark
                      : battleState.isCombo && dotIndex === (3 - battleState.attacksRemaining + 1)
                      ? 'bg-orange-400 border-orange-300 animate-pulse' // Next attack in combo - orange glow
                      : 'bg-yellow-400 border-yellow-300' // Available attacks - bright yellow
                  }`}
                  style={{
                    boxShadow: dotIndex <= (3 - battleState.attacksRemaining)
                      ? 'none'
                      : battleState.isCombo && dotIndex === (3 - battleState.attacksRemaining + 1)
                      ? '0 0 8px rgba(251, 146, 60, 0.6)'
                      : '0 0 6px rgba(250, 204, 21, 0.4)'
                  }}
                />
              ))}
              {/* Combo indicator */}
              {battleState.isCombo && battleState.attackCount > 1 && (
                <div className="ml-2 text-orange-400 font-bold text-sm animate-pulse">
                  {battleState.attackCount}x COMBO!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Battle Status - Bottom Center */}
      <div className="fixed bottom-4 left-0 right-0 z-30">
        <div className="flex justify-center">
          {!battleState.isPlayerTurn && battleState.battleResult === 'ongoing' && (
            <div className="text-center text-lg md:text-xl font-bold text-yellow-200 tracking-wider uppercase py-4 bg-red-900/50 rounded-lg border-2 border-red-400/50 px-8">
              ⏳ ENEMY TURN
            </div>
          )}
          {attackMutation.isPending && (
            <div className="text-center text-lg md:text-xl font-bold text-white tracking-wider uppercase py-4 bg-blue-900/50 rounded-lg border-2 border-blue-400/50 px-8">
              ⚔️ ATTACKING...
            </div>
          )}
        </div>
      </div>

      </div>
    </BattleAccessGuard>
  );
}

