import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Progress component will be styled manually since it might not exist
import { useToast } from "@/hooks/use-toast";
import { 
  Sword, 
  Shield, 
  Heart, 
  Zap, 
  Trophy,
  ArrowLeft,
  Skull,
  ChevronDown,
  ChevronRight,
  Coins,
  X,
  Clock,
  Volume2,
  VolumeX
} from "lucide-react";
import greenSlimeImage from "@assets/IMG_3665_1753055571089.png";
import caveRatImage from "@assets/IMG_3670_1753151064629.png";
import wildGoblinImage from "@assets/0F1ED511-7E0E-4062-A429-FB8B7BC6B4FE_1753151490494.png";
import forestSpiderImage from "@assets/1B395958-75E1-4297-8F5E-27BED5DC1608_1753196270170.png";
import battlePlayerImage from "@assets/IMG_3682_1753213695174.png";
import forestBackgroundImage from "@assets/AD897CD2-5CB0-475D-B782-E09FD8D98DF7_1753153903824.png";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { queryClient } from "@/lib/queryClient";
import { useBackgroundMusic } from "@/hooks/use-background-music";

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
  lastDefeatedAt?: number; // Timestamp when monster was last defeated
}

interface BattleState {
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  monster: Monster;
  battleLog: string[];
  isPlayerTurn: boolean;
  battleResult: 'ongoing' | 'victory' | 'defeat';
}

// E-rank dungeon monsters (levels 1-10) - HP increased by 5%
const ERANK_MONSTERS: Monster[] = [
  { id: 1, name: "Green Slime", level: 1, maxHp: 13, currentHp: 13, attack: 2, goldReward: 2, description: "A gelatinous blob that bounces menacingly", image: greenSlimeImage },
  { id: 2, name: "Cave Rat", level: 2, maxHp: 19, currentHp: 19, attack: 3, goldReward: 3, description: "A mangy rodent with sharp teeth", image: caveRatImage },
  { id: 3, name: "Wild Goblin", level: 3, maxHp: 26, currentHp: 26, attack: 4, goldReward: 4, description: "A mischievous creature wielding a rusty dagger", image: wildGoblinImage },
  { id: 4, name: "Forest Spider", level: 4, maxHp: 32, currentHp: 32, attack: 5, goldReward: 5, description: "An eight-legged predator with venomous fangs", image: forestSpiderImage },
  { id: 5, name: "Skeleton Warrior", level: 5, maxHp: 42, currentHp: 42, attack: 7, goldReward: 6, description: "Animated bones wielding ancient weapons" },
  { id: 6, name: "Stone Golem", level: 6, maxHp: 58, currentHp: 58, attack: 8, goldReward: 7, description: "A sturdy construct of animated rock" },
  { id: 7, name: "Shadow Wolf", level: 7, maxHp: 50, currentHp: 50, attack: 10, goldReward: 8, description: "A spectral predator that hunts in darkness" },
  { id: 8, name: "Fire Elemental", level: 8, maxHp: 63, currentHp: 63, attack: 12, goldReward: 9, description: "A being of pure flame and fury" },
  { id: 9, name: "Orc Berserker", level: 9, maxHp: 79, currentHp: 79, attack: 14, goldReward: 10, description: "A brutal warrior lost to bloodlust" },
  { id: 10, name: "Lesser Dragon", level: 10, maxHp: 105, currentHp: 105, attack: 18, goldReward: 10, description: "A young but fierce draconic beast" },
];

export default function Battle() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [isMonsterListOpen, setIsMonsterListOpen] = useState(true);
  const [monsterCooldowns, setMonsterCooldowns] = useState<{[key: number]: number}>({});
  
  // Background music
  const { isPlaying, isMuted, toggleMusic } = useBackgroundMusic();

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  // Initialize battle state
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  const startBattle = (monster: Monster) => {
    // Check if monster is on cooldown
    const currentTime = Date.now();
    const cooldownTime = monsterCooldowns[monster.id];
    
    if (cooldownTime && currentTime < cooldownTime) {
      const remainingMinutes = Math.ceil((cooldownTime - currentTime) / (1000 * 60));
      toast({
        title: "Monster on Cooldown",
        description: `${monster.name} is resting. Try again in ${remainingMinutes} minute(s).`,
        variant: "destructive",
      });
      return;
    }

    // Calculate player's max HP and MP based on stats
    const playerMaxHp = Math.max(10, 10 + (userStats?.stamina || 0) * 3);
    const playerMaxMp = Math.max(5, (userStats?.stamina || 0) * 2 + (userStats?.agility || 0) * 1);
    const battleMonster = { ...monster, currentHp: monster.maxHp };
    
    setBattleState({
      playerHp: playerMaxHp,
      playerMaxHp,
      playerMp: playerMaxMp,
      playerMaxMp,
      monster: battleMonster,
      battleLog: [`A wild ${monster.name} appears!`],
      isPlayerTurn: true,
      battleResult: 'ongoing'
    });
    setSelectedMonster(null);
  };

  // Update player HP when stats load
  useEffect(() => {
    if (userStats && battleState && battleState.battleResult === 'ongoing') {
      const newMaxHp = Math.max(10, 10 + userStats.stamina * 3);
      setBattleState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          playerMaxHp: newMaxHp,
          playerHp: Math.min(prev.playerHp, newMaxHp)
        };
      });
    }
  }, [userStats, battleState]);

  const updateStatsMutation = useMutation({
    mutationFn: async (params: { goldGain: number; battleWon?: boolean }) => {
      const response = await fetch('/api/user/stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error('Failed to update stats');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
    }
  });

  const playerAttack = () => {
    if (!battleState || !battleState.isPlayerTurn || battleState.battleResult !== 'ongoing') return;
    
    // Check if player has enough MP (2 MP per attack)
    if (battleState.playerMp < 2) {
      setBattleState(prev => ({
        ...prev!,
        battleLog: [...prev!.battleLog, "Not enough MP to attack!"]
      }));
      return;
    }

    // Strength modifies damage (base 3 damage + strength bonus)
    const playerStrength = userStats?.strength || 5;
    const baseDamage = 3 + Math.floor(playerStrength / 2);
    const damage = baseDamage + Math.floor(Math.random() * 3); // 1-3 random bonus

    const newMonsterHp = Math.max(0, battleState.monster.currentHp - damage);
    const isMonsterDefeated = newMonsterHp === 0;

    setBattleState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        monster: { ...prev.monster, currentHp: newMonsterHp },
        playerMp: prev.playerMp - 2, // Consume 2 MP per attack
        battleLog: [...prev.battleLog, `You strike for ${damage} damage! (-2 MP)`],
        isPlayerTurn: false,
        battleResult: isMonsterDefeated ? 'victory' : 'ongoing'
      };
    });

    if (isMonsterDefeated) {
      // Set 10-minute cooldown for defeated monster
      const cooldownEndTime = Date.now() + (10 * 60 * 1000); // 10 minutes
      setMonsterCooldowns(prev => ({
        ...prev,
        [battleState.monster.id]: cooldownEndTime
      }));

      setTimeout(() => {
        setBattleState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            battleLog: [...prev.battleLog, `${prev.monster.name} is defeated!`, `You gain ${prev.monster.goldReward} gold coins!`]
          };
        });
        
        updateStatsMutation.mutate({ 
          goldGain: battleState.monster.goldReward, 
          battleWon: true 
        });
        
        toast({
          title: "Victory!",
          description: `You defeated the ${battleState.monster.name} and gained ${battleState.monster.goldReward} gold!`,
        });
      }, 1000);
    } else {
      setTimeout(() => monsterAttack(), 1500);
    }
  };

  const monsterAttack = () => {
    if (!battleState || battleState.battleResult !== 'ongoing') return;

    // Agility determines evasion chance (5% per agility point, max 90%)
    const playerAgility = userStats?.agility || 5;
    const evasionChance = Math.min(0.9, (playerAgility * 0.05));
    const isEvaded = Math.random() < evasionChance;

    if (isEvaded) {
      setBattleState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          battleLog: [...prev.battleLog, `You dodge the ${prev.monster.name}'s attack!`],
          isPlayerTurn: true
        };
      });
      return;
    }

    const damage = battleState.monster.attack;
    const newPlayerHp = Math.max(0, battleState.playerHp - damage);
    const isPlayerDefeated = newPlayerHp === 0;

    setBattleState(prev => {
      if (!prev) return prev;
      // Player regenerates 1 MP per turn (max of playerMaxMp)
      const mpRegen = Math.min(1, prev.playerMaxMp - prev.playerMp);
      return {
        ...prev,
        playerHp: newPlayerHp,
        playerMp: prev.playerMp + mpRegen,
        battleLog: [...prev.battleLog, `${prev.monster.name} attacks for ${damage} damage!`, ...(mpRegen > 0 ? [`You recover ${mpRegen} MP`] : [])],
        isPlayerTurn: true,
        battleResult: isPlayerDefeated ? 'defeat' : 'ongoing'
      };
    });

    if (isPlayerDefeated) {
      toast({
        title: "Defeat",
        description: "You have been defeated! Train harder and come back stronger!",
        variant: "destructive"
      });
    }
  };

  const returnToMonsterList = () => {
    setBattleState(null);
  };

  // Helper function to check if monster is on cooldown
  const isMonsterOnCooldown = (monsterId: number) => {
    const cooldownTime = monsterCooldowns[monsterId];
    return cooldownTime && Date.now() < cooldownTime;
  };

  // Helper function to get remaining cooldown time in minutes
  const getRemainingCooldown = (monsterId: number) => {
    const cooldownTime = monsterCooldowns[monsterId];
    if (!cooldownTime) return 0;
    const remaining = cooldownTime - Date.now();
    return Math.max(0, Math.ceil(remaining / (1000 * 60)));
  };

  // Update cooldown display every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setMonsterCooldowns(prev => {
        const now = Date.now();
        const updated = { ...prev };
        let hasChanges = false;
        
        // Remove expired cooldowns
        Object.keys(updated).forEach(key => {
          const monsterId = parseInt(key);
          if (updated[monsterId] && now >= updated[monsterId]) {
            delete updated[monsterId];
            hasChanges = true;
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Monster Selection View
  if (!battleState) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Battle Arena</h1>
              <p className="text-muted-foreground mt-1">Choose your opponent and fight for gold coins</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Combat Stats Info */}
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-foreground">Combat Mechanics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Sword className="w-4 h-4 text-red-400" />
                    <span className="font-semibold text-red-300">Strength</span>
                  </div>
                  <p className="text-muted-foreground">Increases your damage output. Higher strength means stronger attacks against monsters.</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Heart className="w-4 h-4 text-green-400" />
                    <span className="font-semibold text-green-300">Stamina</span>
                  </div>
                  <p className="text-muted-foreground">Determines your health points. More stamina means you can take more damage in battle.</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-purple-300">Agility</span>
                  </div>
                  <p className="text-muted-foreground">Affects evasion chance. Higher agility helps you dodge monster attacks.</p>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* E-rank Dungeon */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsMonsterListOpen(!isMonsterListOpen)}
              >
                <div className="flex items-center space-x-2">
                  <Skull className="w-6 h-6 text-red-400" />
                  <span>E-rank Dungeon</span>
                  <span className="text-sm text-muted-foreground">(Levels 1-10)</span>
                </div>
                {isMonsterListOpen ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </CardTitle>
            </CardHeader>
            {isMonsterListOpen && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ERANK_MONSTERS.map((monster) => {
                    const onCooldown = isMonsterOnCooldown(monster.id);
                    const remainingTime = getRemainingCooldown(monster.id);
                    
                    return (
                      <Card 
                        key={monster.id}
                        className={`transition-all duration-200 ${
                          onCooldown 
                            ? 'opacity-40 cursor-not-allowed bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500 shadow-none' 
                            : 'bg-card border-border hover:border-primary hover:shadow-lg hover:scale-105 cursor-pointer'
                        }`}
                        onClick={() => !onCooldown && startBattle(monster)}
                      >
                        <CardContent className={`p-4 ${onCooldown ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>
                          <div className="flex items-start space-x-4">
                            {/* Monster Image */}
                            {monster.image && (
                              <div className="flex-shrink-0 relative">
                                <img 
                                  src={monster.image} 
                                  alt={monster.name}
                                  className={`w-16 h-16 object-contain rounded-lg border border-border bg-transparent ${
                                    onCooldown ? 'grayscale' : ''
                                  }`}
                                  style={{ backgroundColor: 'transparent' }}
                                />
                                {onCooldown && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Monster Info */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className={`font-bold ${onCooldown ? 'text-gray-400' : 'text-foreground'}`}>
                                  {monster.name}
                                </h3>
                                <span className={`text-sm px-2 py-1 rounded ${
                                  onCooldown 
                                    ? 'bg-gray-500 text-gray-300 border border-gray-400' 
                                    : 'bg-red-700 text-white'
                                }`}>
                                  Lv.{monster.level}
                                </span>
                              </div>
                              
                              {onCooldown ? (
                                <div className="text-orange-400 text-sm mb-3 flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  Resting for {remainingTime} minute(s)
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-sm mb-3">{monster.description}</p>
                              )}
                              
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="flex items-center space-x-1">
                                  <Heart className={`w-3 h-3 ${onCooldown ? 'text-gray-400' : 'text-red-400'}`} />
                                  <span className={onCooldown ? 'text-gray-400' : ''}>{monster.maxHp}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Sword className={`w-3 h-3 ${onCooldown ? 'text-gray-400' : 'text-orange-400'}`} />
                                  <span className={onCooldown ? 'text-gray-400' : ''}>{monster.attack}</span>
                                </div>
                                <div className={`flex items-center space-x-1 ${onCooldown ? 'text-gray-400' : 'text-yellow-400'}`}>
                                  <Coins className="w-3 h-3" />
                                  <span>{monster.goldReward}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    );
  }

  const playerHpPercentage = (battleState.playerHp / battleState.playerMaxHp) * 100;
  const monsterHpPercentage = (battleState.monster.currentHp / battleState.monster.maxHp) * 100;

  // Battle View - Classic RPG Style
  return (
    <div 
      className="h-screen bg-cover bg-center bg-no-repeat text-black flex flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${forestBackgroundImage})`
      }}
    >
      {/* Header with Player and Monster Stats */}
      <div className="bg-black/70 text-white px-4 py-3 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          {/* Player Info - Top Left */}
          <div className="flex flex-col">
            <div className="font-bold text-lg text-yellow-200 mb-2">
              {userStats?.username || 'Player'} (Lv.{userStats?.level || 1})
            </div>
            <div className="w-40 space-y-1">
              {/* HP Bar */}
              <div className="relative">
                <div className="w-full bg-gray-800 rounded-full h-4 border border-gray-400 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-600 to-green-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${playerHpPercentage}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                  HP: {battleState.playerHp}/{battleState.playerMaxHp}
                </div>
              </div>
              
              {/* MP Bar */}
              <div className="relative">
                <div className="w-full bg-gray-800 rounded-full h-4 border border-gray-400 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-blue-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${(battleState.playerMp / battleState.playerMaxMp) * 100}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                  MP: {battleState.playerMp}/{battleState.playerMaxMp}
                </div>
              </div>
            </div>
          </div>

          {/* Back Button - Center */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={returnToMonsterList}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dungeon
          </Button>

          {/* Monster Info - Top Right */}
          <div className="flex flex-col items-end">
            <div className="font-bold text-lg text-red-200 mb-2">
              {battleState.monster.name} (Lv.{battleState.monster.level})
            </div>
            <div className="w-40 space-y-1">
              {/* HP Bar */}
              <div className="relative">
                <div className="w-full bg-gray-800 rounded-full h-4 border border-gray-400 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${monsterHpPercentage}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                  HP: {battleState.monster.currentHp}/{battleState.monster.maxHp}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Battle Area */}
      <div className="flex-1 flex flex-col">
        {/* Combatants Area */}
        <div className="flex-1 flex items-center justify-between px-8">
          {/* Player Avatar (Left) */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 flex items-end justify-center">
              <img 
                src={battlePlayerImage} 
                alt="Player Character"
                className="w-28 h-28 object-contain"
                style={{ 
                  imageRendering: 'pixelated',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
                }}
              />
            </div>
          </div>

          {/* VS Indicator */}
          <div className="text-2xl font-bold text-yellow-200 bg-black/90 px-3 py-1 rounded-full border-2 border-yellow-400/50 shadow-lg">
            VS
          </div>

          {/* Monster (Right) */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 flex items-end justify-center">
              {battleState.monster.image ? (
                <img 
                  src={battleState.monster.image} 
                  alt={battleState.monster.name}
                  className="w-28 h-28 object-contain"
                  style={{ 
                    imageRendering: 'pixelated',
                    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
                  }}
                />
              ) : (
                <Skull className="w-20 h-20 text-red-600" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))' }} />
              )}
            </div>
          </div>
        </div>

        {/* Battle Log Area */}
        <div className="bg-black/80 border-t-2 border-gray-500 p-2 min-h-[40px] max-h-[40px] overflow-y-auto backdrop-blur-sm">
          <div className="text-xs text-white">
            {battleState.battleLog.length === 0 ? (
              <div className="text-gray-300 italic">Battle begins...</div>
            ) : (
              battleState.battleLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Compact RPG Action Menu */}
        <div className="bg-black/90 text-white p-2 border-t-4 border-gray-600 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            {battleState.battleResult === 'ongoing' && (
              <div className="grid grid-cols-4 gap-1">
                <Button
                  onClick={playerAttack}
                  disabled={!battleState.isPlayerTurn || battleState.playerMp < 2}
                  className="bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white border border-red-500 py-1 px-2 text-xs font-bold h-8"
                >
                  <Sword className="w-3 h-3 mr-1" />
                  ATTACK
                </Button>
                <Button
                  variant="outline"
                  disabled
                  className="bg-gray-600 text-gray-400 border border-gray-500 py-1 px-2 text-xs font-bold cursor-not-allowed h-8"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  DEFEND
                </Button>
                <Button
                  variant="outline"
                  disabled
                  className="bg-gray-600 text-gray-400 border border-gray-500 py-1 px-2 text-xs font-bold cursor-not-allowed h-8"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  MAGIC
                </Button>
                <Button
                  variant="outline"
                  disabled
                  className="bg-gray-600 text-gray-400 border border-gray-500 py-1 px-2 text-xs font-bold cursor-not-allowed h-8"
                >
                  <Heart className="w-3 h-3 mr-1" />
                  ITEMS
                </Button>
              </div>
            )}

            {battleState.battleResult === 'victory' && (
              <div className="text-center space-y-2">
                <div className="text-lg font-bold text-yellow-400 mb-2">
                  <Trophy className="w-5 h-5 inline mr-2" />
                  VICTORY!
                </div>
                <div className="text-sm text-yellow-300 mb-2">
                  You earned {battleState.monster.goldReward} gold!
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={returnToMonsterList} className="bg-green-700 hover:bg-green-600 text-white border border-green-500 py-1 px-2 text-sm font-bold h-8">
                    FIGHT AGAIN
                  </Button>
                  <Button onClick={() => setLocation("/")} className="bg-blue-700 hover:bg-blue-600 text-white border border-blue-500 py-1 px-2 text-sm font-bold h-8">
                    RETURN HOME
                  </Button>
                </div>
              </div>
            )}

            {battleState.battleResult === 'defeat' && (
              <div className="text-center space-y-2">
                <div className="text-lg font-bold text-red-400 mb-2">
                  <Skull className="w-5 h-5 inline mr-2" />
                  DEFEAT!
                </div>
                <div className="text-sm text-red-300 mb-2">
                  You were defeated by {battleState.monster.name}...
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={returnToMonsterList} className="bg-red-700 hover:bg-red-600 text-white border border-red-500 py-1 px-2 text-sm font-bold h-8">
                    TRY AGAIN
                  </Button>
                  <Button onClick={() => setLocation("/")} className="bg-blue-700 hover:bg-blue-600 text-white border border-blue-500 py-1 px-2 text-sm font-bold h-8">
                    RETURN HOME
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}