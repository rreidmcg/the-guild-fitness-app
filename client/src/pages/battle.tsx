import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Map,
  Lock,
  CheckCircle,
  Star
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import greenSlimeImage from "@assets/IMG_3665_1753055571089.png";
import caveRatImage from "@assets/IMG_3670_1753151064629.png";
import wildGoblinImage from "@assets/0F1ED511-7E0E-4062-A429-FB8B7BC6B4FE_1753151490494.png";
import forestSpiderImage from "@assets/1B395958-75E1-4297-8F5E-27BED5DC1608_1753196270170.png";
import battlePlayerImage from "@assets/IMG_3682_1753213695174.png";
import forestBackgroundImage from "@assets/AD897CD2-5CB0-475D-B782-E09FD8D98DF7_1753153903824.png";
import zoneMapImage from "@assets/7DCEA0C7-2CDB-488A-B077-B336CB5CE781_1753322118569.png";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { queryClient } from "@/lib/queryClient";

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

interface Dungeon {
  id: number;
  name: string;
  rank: string;
  order: number; // Must complete dungeons in order
  monsters: Monster[];
  isUnlocked: boolean;
  isCompleted: boolean;
  description: string;
  backgroundImage?: string;
  requiredLevel: number;
}

interface Rank {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  color: string;
}

interface ZoneLocation {
  id: number;
  name: string;
  description: string;
  position: { top: string; left: string };
  monsters: Monster[];
  isUnlocked: boolean;
  requiredLevel: number;
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
  remainingMonsters: Monster[];
  currentMonsterIndex: number;
  totalMonsters: number;
}

// Available ranks
const RANKS: Rank[] = [
  { id: "E", name: "E-Rank", description: "Novice dungeons for beginners", requiredLevel: 1, color: "bg-gray-600" },
  { id: "D", name: "D-Rank", description: "Intermediate challenges", requiredLevel: 5, color: "bg-green-600" },
  { id: "C", name: "C-Rank", description: "Advanced dungeons", requiredLevel: 10, color: "bg-blue-600" },
  { id: "B", name: "B-Rank", description: "Expert level trials", requiredLevel: 15, color: "bg-purple-600" },
  { id: "A", name: "A-Rank", description: "Master tier dungeons", requiredLevel: 20, color: "bg-red-600" },
  { id: "S", name: "S-Rank", description: "Legendary challenges", requiredLevel: 25, color: "bg-yellow-600" },
];

// Zone locations for E-rank Greenwood Valley
const E_RANK_ZONES: ZoneLocation[] = [
  {
    id: 1,
    name: "Village Outskirts",
    description: "Peaceful village area with friendly slimes",
    position: { top: "65%", left: "15%" }, // Bottom left - Village area
    isUnlocked: true,
    requiredLevel: 1,
    monsters: [
      { id: 1, name: "Green Slime", level: 1, maxHp: 13, currentHp: 13, attack: 2, goldReward: 2, description: "A gelatinous blob that bounces menacingly", image: greenSlimeImage },
      { id: 2, name: "Blue Slime", level: 2, maxHp: 16, currentHp: 16, attack: 3, goldReward: 3, description: "A slightly stronger slime variant" },
    ]
  },
  {
    id: 2,
    name: "Woodland House",
    description: "An abandoned house with rats in the cellar",
    position: { top: "20%", left: "20%" }, // Top left - House area
    isUnlocked: false,
    requiredLevel: 2,
    monsters: [
      { id: 3, name: "Cave Rat", level: 2, maxHp: 19, currentHp: 19, attack: 3, goldReward: 3, description: "A mangy rodent with sharp teeth", image: caveRatImage },
      { id: 4, name: "Giant Rat", level: 3, maxHp: 22, currentHp: 22, attack: 4, goldReward: 4, description: "A massive rodent with glowing red eyes" },
    ]
  },
  {
    id: 3,
    name: "Ancient Tower",
    description: "A mysterious tower overrun by goblins",
    position: { top: "15%", left: "75%" }, // Top right - Tower area
    isUnlocked: false,
    requiredLevel: 3,
    monsters: [
      { id: 5, name: "Wild Goblin", level: 3, maxHp: 26, currentHp: 26, attack: 4, goldReward: 4, description: "A mischievous creature wielding a rusty dagger", image: wildGoblinImage },
      { id: 6, name: "Goblin Warrior", level: 4, maxHp: 30, currentHp: 30, attack: 5, goldReward: 5, description: "A better equipped goblin fighter" },
    ]
  },
  {
    id: 4,
    name: "Campfire Grove",
    description: "A forest clearing where spiders have made their nest",
    position: { top: "70%", left: "70%" }, // Bottom right - Campfire area
    isUnlocked: false,
    requiredLevel: 4,
    monsters: [
      { id: 7, name: "Forest Spider", level: 4, maxHp: 32, currentHp: 32, attack: 5, goldReward: 5, description: "An eight-legged predator with venomous fangs", image: forestSpiderImage },
      { id: 8, name: "Brood Mother", level: 5, maxHp: 45, currentHp: 45, attack: 7, goldReward: 8, description: "The queen of the spider nest" },
    ]
  }
];

// Dungeon data organized by rank
const DUNGEONS: Record<string, Dungeon[]> = {
  "E": [
    {
      id: 1,
      name: "Greenwood Valley",
      rank: "E",
      order: 1,
      isUnlocked: true,
      isCompleted: false,
      requiredLevel: 1,
      description: "A peaceful valley with various monster zones to explore.",
      backgroundImage: zoneMapImage,
      monsters: [] // Monsters are in zones instead
    }
  ],
  "D": [
    {
      id: 6,
      name: "Golem Quarry",
      rank: "D",
      order: 1,
      isUnlocked: false,
      isCompleted: false,
      requiredLevel: 6,
      description: "Ancient stone constructs guard this abandoned mine.",
      monsters: [
        { id: 11, name: "Stone Golem", level: 6, maxHp: 58, currentHp: 58, attack: 8, goldReward: 7, description: "A sturdy construct of animated rock" },
        { id: 12, name: "Iron Golem", level: 7, maxHp: 65, currentHp: 65, attack: 10, goldReward: 9, description: "A more durable metallic guardian" },
      ]
    },
    {
      id: 7,
      name: "Shadow Woods",
      rank: "D",
      order: 2,
      isUnlocked: false,
      isCompleted: false,
      requiredLevel: 7,
      description: "Dark forest where shadows come alive.",
      monsters: [
        { id: 13, name: "Shadow Wolf", level: 7, maxHp: 50, currentHp: 50, attack: 10, goldReward: 8, description: "A spectral predator that hunts in darkness" },
        { id: 14, name: "Shadow Beast", level: 8, maxHp: 55, currentHp: 55, attack: 12, goldReward: 10, description: "A creature born from pure darkness" },
      ]
    }
  ]
};

export default function Battle() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Map state
  const [selectedRank, setSelectedRank] = useState<string>("E");
  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null);
  const [dungeonProgress, setDungeonProgress] = useState<{[key: string]: {[key: number]: boolean}}>({
    "E": { 1: false, 2: false, 3: false, 4: false, 5: false },
    "D": { 6: false, 7: false }
  });
  
  // Battle state
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [monsterCooldowns, setMonsterCooldowns] = useState<{[key: number]: number}>({});
  
  // Persistent health state (survives between battles)
  const [persistentPlayerHp, setPersistentPlayerHp] = useState<number | null>(null);
  const [lastRegenTime, setLastRegenTime] = useState<number>(Date.now());

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  // Get available ranks for the current user level
  const availableRanks = RANKS.filter(rank => (userStats?.level || 1) >= rank.requiredLevel);
  const currentRankDungeons = DUNGEONS[selectedRank] || [];
  
  // Update dungeon unlock status based on progression
  const updateDungeonUnlockStatus = () => {
    return currentRankDungeons.map((dungeon, index) => {
      const isUnlocked = index === 0 || dungeonProgress[selectedRank][currentRankDungeons[index - 1].id];
      return { ...dungeon, isUnlocked };
    });
  };

  const unlockedDungeons = updateDungeonUnlockStatus();

  // Health regeneration effect - 1% per minute
  useEffect(() => {
    if (!userStats) return;
    
    const playerMaxHp = Math.max(10, 10 + userStats.stamina * 3);
    
    // Initialize persistent HP to full if not set
    if (persistentPlayerHp === null) {
      setPersistentPlayerHp(playerMaxHp);
      return;
    }
    
    // Calculate regeneration
    const currentTime = Date.now();
    const timeDiff = currentTime - lastRegenTime;
    const minutesPassed = Math.floor(timeDiff / (60 * 1000));
    
    if (minutesPassed > 0 && persistentPlayerHp < playerMaxHp) {
      const regenAmount = Math.ceil(playerMaxHp * 0.01 * minutesPassed); // 1% per minute
      const newHp = Math.min(playerMaxHp, persistentPlayerHp + regenAmount);
      
      if (newHp > persistentPlayerHp) {
        setPersistentPlayerHp(newHp);
        setLastRegenTime(currentTime);
        
        // Show regeneration message if not in battle
        if (!battleState && newHp > persistentPlayerHp) {
          toast({
            title: "Health Regenerated",
            description: `You recovered ${newHp - persistentPlayerHp} HP (${newHp}/${playerMaxHp})`,
          });
        }
      }
    }
  }, [userStats, persistentPlayerHp, lastRegenTime, battleState]);

  // Enter a dungeon and show its monsters
  const enterDungeon = (dungeon: Dungeon) => {
    setSelectedDungeon(dungeon);
  };

  // Enter a zone (for E-rank dungeons)
  const enterZone = (zone: ZoneLocation) => {
    // Create a temporary dungeon structure for the zone
    const zoneDungeon: Dungeon = {
      id: zone.id,
      name: zone.name,
      rank: "E",
      order: zone.id,
      isUnlocked: true,
      isCompleted: false,
      requiredLevel: zone.requiredLevel,
      description: zone.description,
      backgroundImage: zoneMapImage,
      monsters: zone.monsters
    };
    setSelectedDungeon(zoneDungeon);
  };

  // Exit dungeon back to map
  const exitDungeon = () => {
    setSelectedDungeon(null);
    setBattleState(null);
    setSelectedMonster(null);
  };

  // Start battle with a monster from the dungeon
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
    
    // Use persistent HP instead of resetting to full
    const currentPlayerHp = persistentPlayerHp || playerMaxHp;
    
    const monsters = [{ ...monster, currentHp: monster.maxHp }];
    const battleLog = [`A wild ${monster.name} appears!`];
    
    setBattleState({
      playerHp: currentPlayerHp,
      playerMaxHp,
      playerMp: playerMaxMp,
      playerMaxMp,
      monster: monsters[0],
      battleLog,
      isPlayerTurn: true,
      battleResult: 'ongoing',
      remainingMonsters: monsters.slice(1),
      currentMonsterIndex: 0,
      totalMonsters: monsters.length
    });
    setSelectedMonster(null);
  };

  // Show dungeon selection or battle based on selected dungeon
  if (!selectedDungeon) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20 page-content">
        <PageHeader title="Adventure Map">
          {/* Player HP Status */}
          {userStats && (
            <div className="flex items-center space-x-2 text-sm">
              <Heart className="w-4 h-4 text-green-400" />
              <span className="text-foreground">
                {persistentPlayerHp || userStats.maxHp}/{userStats.maxHp} HP
              </span>
              {persistentPlayerHp && persistentPlayerHp < userStats.maxHp && (
                <span className="text-green-400 text-xs">(Regenerating)</span>
              )}
            </div>
          )}
        </PageHeader>

        <div className="max-w-6xl mx-auto p-4 space-y-6">
          {/* Rank Selection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Select Dungeon Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedRank} onValueChange={setSelectedRank}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a rank" />
                </SelectTrigger>
                <SelectContent>
                  {availableRanks.map((rank) => (
                    <SelectItem key={rank.id} value={rank.id}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded ${rank.color}`} />
                        <span>{rank.name}</span>
                        <span className="text-muted-foreground">- {rank.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Zone Map for E-Rank or Regular Dungeon List */}
          {selectedRank === "E" ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-gray-600" />
                  <span>Greenwood Valley - Zone Map</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full max-w-2xl mx-auto">
                  {/* Zone Map Background */}
                  <img 
                    src={zoneMapImage} 
                    alt="Greenwood Valley Map" 
                    className="w-full h-auto rounded-lg shadow-lg"
                    style={{ aspectRatio: '1:1' }}
                  />
                  
                  {/* Zone Buttons */}
                  {E_RANK_ZONES.map((zone) => {
                    const isUnlocked = zone.isUnlocked || (userStats?.level || 1) >= zone.requiredLevel;
                    const canEnter = isUnlocked;

                    return (
                      <Button
                        key={zone.id}
                        onClick={() => canEnter && enterZone(zone)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full ${
                          !canEnter
                            ? 'bg-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-primary hover:bg-primary/80 hover:scale-110 shadow-lg'
                        } transition-all duration-200`}
                        style={{
                          top: zone.position.top,
                          left: zone.position.left,
                        }}
                        disabled={!canEnter}
                      >
                        <div className="flex flex-col items-center text-xs">
                          <span className="text-white font-bold">{zone.id}</span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
                
                {/* Zone Legend */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {E_RANK_ZONES.map((zone) => {
                    const isUnlocked = zone.isUnlocked || (userStats?.level || 1) >= zone.requiredLevel;
                    
                    return (
                      <div 
                        key={zone.id}
                        className={`p-3 rounded-lg ${
                          !isUnlocked 
                            ? 'bg-gray-800 opacity-60' 
                            : 'bg-card border border-border hover:border-primary transition-colors'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            !isUnlocked ? 'bg-gray-600 text-gray-400' : 'bg-primary text-white'
                          }`}>
                            {zone.id}
                          </div>
                          <h4 className={`font-medium ${!isUnlocked ? 'text-gray-400' : 'text-foreground'}`}>
                            {zone.name}
                          </h4>
                        </div>
                        <p className={`text-sm ${!isUnlocked ? 'text-gray-500' : 'text-muted-foreground'}`}>
                          {zone.description}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className={`px-2 py-1 rounded ${
                            !isUnlocked ? 'bg-gray-600 text-gray-400' : 'bg-blue-700 text-white'
                          }`}>
                            Req. Lv.{zone.requiredLevel}
                          </span>
                          <span className={`${!isUnlocked ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            {zone.monsters.length} Monster{zone.monsters.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        {!isUnlocked && (
                          <div className="mt-2 text-xs text-orange-400">
                            Level {zone.requiredLevel} required
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${RANKS.find(r => r.id === selectedRank)?.color || 'bg-gray-600'}`} />
                  <span>{RANKS.find(r => r.id === selectedRank)?.name} Dungeons</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlockedDungeons.map((dungeon) => {
                    const isCompleted = dungeonProgress[selectedRank][dungeon.id];
                    const isUnlocked = dungeon.isUnlocked;
                    const canEnter = isUnlocked && (userStats?.level || 1) >= dungeon.requiredLevel;

                    return (
                      <Card 
                        key={dungeon.id}
                        className={`transition-all duration-200 ${
                          !canEnter
                            ? 'opacity-40 cursor-not-allowed bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500'
                            : 'bg-card border-border hover:border-primary hover:shadow-lg hover:scale-105 cursor-pointer'
                        }`}
                        onClick={() => canEnter && enterDungeon(dungeon)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-muted-foreground">#{dungeon.order}</span>
                              <h3 className={`font-bold ${!canEnter ? 'text-gray-400' : 'text-foreground'}`}>
                                {dungeon.name}
                              </h3>
                            </div>
                            
                            {/* Status Icons */}
                            <div className="flex items-center space-x-1">
                              {isCompleted && <CheckCircle className="w-5 h-5 text-green-400" />}
                              {!isUnlocked && <Lock className="w-5 h-5 text-gray-400" />}
                              {dungeon.requiredLevel > (userStats?.level || 1) && <Star className="w-5 h-5 text-orange-400" />}
                            </div>
                          </div>
                          
                          <p className={`text-sm mb-3 ${!canEnter ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            {dungeon.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className={`px-2 py-1 rounded ${
                              !canEnter ? 'bg-gray-500 text-gray-300' : 'bg-blue-700 text-white'
                            }`}>
                              Req. Lv.{dungeon.requiredLevel}
                            </span>
                            <span className={`${!canEnter ? 'text-gray-400' : 'text-muted-foreground'}`}>
                              {dungeon.monsters.length} Monster{dungeon.monsters.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          {!isUnlocked && (
                            <div className="mt-2 text-xs text-orange-400">
                              Complete previous dungeon to unlock
                            </div>
                          )}
                          
                          {dungeon.requiredLevel > (userStats?.level || 1) && (
                            <div className="mt-2 text-xs text-orange-400">
                              Level {dungeon.requiredLevel} required
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Show dungeon interior with monsters
  if (selectedDungeon && !battleState) {
    const isMonsterOnCooldown = (monsterId: number) => {
      const cooldownTime = monsterCooldowns[monsterId];
      return cooldownTime && Date.now() < cooldownTime;
    };

    const getRemainingCooldown = (monsterId: number) => {
      const cooldownTime = monsterCooldowns[monsterId];
      if (!cooldownTime) return 0;
      const remaining = cooldownTime - Date.now();
      return Math.ceil(remaining / (1000 * 60));
    };

    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <PageHeader title={selectedDungeon.name}>
          <Button variant="ghost" size="sm" onClick={exitDungeon}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          {/* Player HP Status */}
          {userStats && (
            <div className="flex items-center space-x-2 text-sm">
              <Heart className="w-4 h-4 text-green-400" />
              <span className="text-foreground">
                {persistentPlayerHp || userStats.maxHp}/{userStats.maxHp} HP
              </span>
            </div>
          )}
        </PageHeader>

        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Dungeon Description */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-muted-foreground">{selectedDungeon.description}</p>
            </CardContent>
          </Card>

          {/* Monsters in Dungeon */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Monsters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDungeon.monsters.map((monster) => {
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
          </Card>
        </div>
      </div>
    );
  }

  // Battle view would go here but for now just return null
  return null;
}