import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
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
  Volume2,
  VolumeX
} from "lucide-react";
import greenSlimeImage from "@assets/IMG_3665_1753055571089.png";
import caveRatImage from "@assets/IMG_3670_1753151064629.png";
import wildGoblinImage from "@assets/0F1ED511-7E0E-4062-A429-FB8B7BC6B4FE_1753151490494.png";
import forestSpiderImage from "@assets/1B395958-75E1-4297-8F5E-27BED5DC1608_1753196270170.png";
import battlePlayerImage from "@assets/IMG_3682_1753213695174.png";
import forestBackgroundImage from "@assets/AD897CD2-5CB0-475D-B782-E09FD8D98DF7_1753153903824.png";
import slimeKingImage from "@assets/BA7F4BEB-8274-40C6-8CB1-398C9BBD1581_1753841529625.png";
import ratChieftainImage from "@assets/D974E952-8A54-4037-AC48-754ACAA0F285_1753839669430.png";
import goblinWarlordImage from "@assets/36CF820D-0CC0-4C99-A780-79B6D125B307_1753844608679.png";
import broodmotherImage from "@assets/CE5B8D2E-90AF-4DC0-A904-EDB98089C00A_1753845237897.png";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { ParallaxBackground } from "@/components/ui/parallax-background";
import { useBackgroundMusic } from "@/contexts/background-music-context";
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

// Story-driven E-rank Dungeon Zones with progression
interface DungeonZone {
  id: string;
  name: string;
  description: string;
  background: string;
  monsters: Monster[];
  storyIntro: string;
  completionStory: string;
}

const ERANK_DUNGEON_ZONES: DungeonZone[] = [
  {
    id: "slime_caverns",
    name: "The Slime Caverns",
    description: "Dark, damp caves where gelatinous creatures multiply in the shadows",
    background: "#1a2b3d",
    storyIntro: "You enter the murky depths of the Slime Caverns. The air is thick with moisture and the sound of dripping echoes through the tunnels. Strange, luminescent slimes block your path...",
    completionStory: "The caverns grow quiet as the last slime dissolves. Ancient runes on the walls begin to glow, revealing the path forward to deeper mysteries.",
    monsters: [
      { id: 1, name: "Tiny Slime", level: 1, maxHp: 12, currentHp: 12, attack: 3, goldReward: 1, description: "A small, translucent blob that quivers nervously", image: greenSlimeImage },
      { id: 2, name: "Green Slime", level: 2, maxHp: 15, currentHp: 15, attack: 3, goldReward: 1, description: "A larger, more aggressive gelatinous creature", image: greenSlimeImage },
      { id: 3, name: "Acidic Slime", level: 3, maxHp: 18, currentHp: 18, attack: 4, goldReward: 2, description: "A corrosive slime that burns through metal", image: greenSlimeImage },
      { id: 4, name: "Bouncing Slime", level: 4, maxHp: 21, currentHp: 21, attack: 4, goldReward: 2, description: "An energetic slime that ricochets off walls", image: greenSlimeImage },
      { id: 5, name: "Elder Slime", level: 5, maxHp: 24, currentHp: 24, attack: 5, goldReward: 3, description: "An ancient slime with crystalline formations", image: greenSlimeImage },
      { id: 6, name: "Slime King", level: 6, maxHp: 30, currentHp: 30, attack: 5, goldReward: 5, description: "🏆 MINI-BOSS: The ruler of the slime caverns, pulsing with ancient power", image: slimeKingImage }
    ]
  },
  {
    id: "rat_warrens",
    name: "The Rat Warrens",
    description: "A maze of tunnels infested with oversized rodents and their corrupted kin",
    background: "#2d1810",
    storyIntro: "The narrow tunnels stretch endlessly before you, filled with the chittering of countless rats. Their red eyes gleam in the darkness as they sense an intruder in their domain...",
    completionStory: "The warren falls silent. In the distance, you hear the echo of larger threats stirring in the depths, drawn by the commotion.",
    monsters: [
      { id: 7, name: "Sewer Rat", level: 2, maxHp: 18, currentHp: 18, attack: 4, goldReward: 2, description: "A disease-ridden rodent with yellowed fangs", image: caveRatImage },
      { id: 8, name: "Cave Rat", level: 3, maxHp: 21, currentHp: 21, attack: 4, goldReward: 2, description: "A larger rat adapted to cave life", image: caveRatImage },
      { id: 9, name: "Plague Rat", level: 4, maxHp: 24, currentHp: 24, attack: 5, goldReward: 3, description: "A sickly rat spreading corruption", image: caveRatImage },
      { id: 10, name: "Giant Rat", level: 5, maxHp: 27, currentHp: 27, attack: 5, goldReward: 3, description: "An oversized rodent with massive claws", image: caveRatImage },
      { id: 11, name: "War Rat", level: 6, maxHp: 30, currentHp: 30, attack: 6, goldReward: 4, description: "A battle-scarred rat veteran", image: caveRatImage },
      { id: 12, name: "Rat Chieftain", level: 7, maxHp: 39, currentHp: 39, attack: 6, goldReward: 6, description: "🏆 MINI-BOSS: A massive rat wearing crude armor, leading its pack", image: ratChieftainImage }
    ]
  },
  {
    id: "goblin_outpost",
    name: "The Goblin Outpost",
    description: "A ramshackle camp where mischievous goblins plot their next raid",
    background: "#1f2b1a",
    storyIntro: "Crude wooden spikes and torn banners mark the goblin territory. The air smells of smoke and rotting food. Cackling voices grow louder as the goblins spot your approach...",
    completionStory: "The outpost burns as the last goblin falls. Among the ashes, you find a crude map pointing to darker territories beyond.",
    monsters: [
      { id: 13, name: "Goblin Scout", level: 4, maxHp: 21, currentHp: 21, attack: 5, goldReward: 3, description: "A sneaky goblin carrying a rusty knife", image: wildGoblinImage },
      { id: 14, name: "Wild Goblin", level: 5, maxHp: 24, currentHp: 24, attack: 5, goldReward: 3, description: "A fierce goblin warrior with crude weapons", image: wildGoblinImage },
      { id: 15, name: "Goblin Raider", level: 6, maxHp: 27, currentHp: 27, attack: 6, goldReward: 4, description: "A goblin armed with stolen gear", image: wildGoblinImage },
      { id: 16, name: "Goblin Shaman", level: 7, maxHp: 30, currentHp: 30, attack: 6, goldReward: 4, description: "A goblin mystic wielding dark magic", image: wildGoblinImage },
      { id: 17, name: "Goblin Captain", level: 8, maxHp: 33, currentHp: 33, attack: 9, goldReward: 5, description: "A goblin officer commanding the troops", image: wildGoblinImage },
      { id: 18, name: "Goblin Warlord", level: 10, maxHp: 48, currentHp: 48, attack: 10, goldReward: 8, description: "🏆 BOSS: A battle-scarred goblin chief with stolen armor and weapons", image: goblinWarlordImage }
    ]
  },
  {
    id: "spider_nest",
    name: "The Spider's Nest",
    description: "A web-covered lair where giant arachnids weave their deadly traps",
    background: "#1a1a2e",
    storyIntro: "Thick webs block every passage, and the skittering of eight legs echoes from all directions. The air is heavy with the scent of silk and venom...",
    completionStory: "The great web collapses as the nest's guardian falls. In the silence, you notice passages leading deeper into the earth.",
    monsters: [
      { id: 19, name: "Web Spinner", level: 6, maxHp: 27, currentHp: 27, attack: 6, goldReward: 4, description: "A quick spider that weaves binding webs", image: forestSpiderImage },
      { id: 20, name: "Forest Spider", level: 7, maxHp: 30, currentHp: 30, attack: 6, goldReward: 4, description: "A venomous hunter with razor-sharp fangs", image: forestSpiderImage },
      { id: 21, name: "Poison Spider", level: 8, maxHp: 33, currentHp: 33, attack: 9, goldReward: 5, description: "A deadly arachnid dripping with venom", image: forestSpiderImage },
      { id: 22, name: "Shadow Spider", level: 9, maxHp: 36, currentHp: 36, attack: 9, goldReward: 5, description: "A spider that strikes from the darkness", image: forestSpiderImage },
      { id: 23, name: "Warrior Spider", level: 9, maxHp: 39, currentHp: 39, attack: 10, goldReward: 6, description: "A heavily armored spider guardian", image: forestSpiderImage },
      { id: 24, name: "Broodmother", level: 10, maxHp: 48, currentHp: 48, attack: 10, goldReward: 8, description: "🏆 BOSS: An enormous spider surrounded by her countless offspring", image: broodmotherImage }
    ]
  }
];

// D-rank Dungeon Zones (Levels 11-20)
const DRANK_DUNGEON_ZONES: DungeonZone[] = [
  {
    id: "orc_stronghold",
    name: "The Orc Stronghold",
    description: "A fortified camp where savage orcs prepare for war",
    background: "#3d1a1a",
    storyIntro: "Massive stone walls loom before you, adorned with crude spikes and trophies of past battles. The thunderous roars of orcs echo from within as they sharpen their weapons...",
    completionStory: "The stronghold falls silent, its mighty gates shattered. In the ruins, you discover maps leading to even darker realms.",
    monsters: [
      { id: 25, name: "Orc Scout", level: 11, maxHp: 45, currentHp: 45, attack: 11, goldReward: 6, description: "A nimble orc warrior carrying crude weapons", image: wildGoblinImage },
      { id: 26, name: "Orc Warrior", level: 12, maxHp: 48, currentHp: 48, attack: 12, goldReward: 7, description: "A fierce orc fighter with battle scars", image: wildGoblinImage },
      { id: 27, name: "Orc Berserker", level: 13, maxHp: 51, currentHp: 51, attack: 13, goldReward: 8, description: "A rage-filled orc that knows no fear", image: wildGoblinImage },
      { id: 28, name: "Orc Captain", level: 14, maxHp: 54, currentHp: 54, attack: 14, goldReward: 9, description: "An orc commander leading the troops", image: wildGoblinImage },
      { id: 29, name: "Orc Champion", level: 15, maxHp: 57, currentHp: 57, attack: 15, goldReward: 10, description: "An elite orc warrior of legendary strength", image: wildGoblinImage },
      { id: 30, name: "Orc Warlord", level: 16, maxHp: 72, currentHp: 72, attack: 16, goldReward: 15, description: "🏆 BOSS: The supreme commander of the orc armies", image: wildGoblinImage }
    ]
  },
  {
    id: "shadow_catacombs",
    name: "The Shadow Catacombs", 
    description: "Ancient burial chambers where undead horrors guard forgotten treasures",
    background: "#1a1a3d",
    storyIntro: "Cold stone corridors stretch endlessly into darkness. The air reeks of decay as skeletal remains animate with unholy purpose...",
    completionStory: "The unholy presence dissipates as the last undead falls. Ancient secrets lie buried in these sacred halls.",
    monsters: [
      { id: 31, name: "Skeleton Warrior", level: 12, maxHp: 48, currentHp: 48, attack: 12, goldReward: 7, description: "An animated skeleton wielding rusted weapons", image: caveRatImage },
      { id: 32, name: "Zombie Fighter", level: 13, maxHp: 51, currentHp: 51, attack: 13, goldReward: 8, description: "A shambling corpse seeking living flesh", image: caveRatImage },
      { id: 33, name: "Wraith", level: 14, maxHp: 54, currentHp: 54, attack: 14, goldReward: 9, description: "A ghostly apparition that phases through matter", image: forestSpiderImage },
      { id: 34, name: "Death Knight", level: 15, maxHp: 57, currentHp: 57, attack: 15, goldReward: 10, description: "A fallen paladin cursed to undeath", image: wildGoblinImage },
      { id: 35, name: "Lich", level: 16, maxHp: 60, currentHp: 60, attack: 16, goldReward: 11, description: "An ancient spellcaster bound to eternal unlife", image: forestSpiderImage },
      { id: 36, name: "Bone Lord", level: 17, maxHp: 81, currentHp: 81, attack: 17, goldReward: 17, description: "🏆 BOSS: Master of the undead legions", image: ratChieftainImage }
    ]
  }
];

export default function PvEDungeonsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedZone, setSelectedZone] = useState<DungeonZone | null>(null);
  const [showZoneDetails, setShowZoneDetails] = useState(false);

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  if (!userStats) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const userLevel = userStats.level || 1;

  return (
    <ParallaxBackground>
      <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/battle")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Battle
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-center flex-1">PvE Dungeons</h1>
        <div></div>
      </div>

      {/* E-Rank Dungeons */}
      <Card className="mb-6 border-2 border-green-500/30 bg-gradient-to-br from-green-900/20 to-emerald-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-green-400 flex items-center">
                <Trophy className="h-6 w-6 mr-2" />
                E-Rank Dungeons
              </CardTitle>
              <p className="text-muted-foreground">
                Levels 1-10 • 4 Zones • 24 Monsters Total
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Your Level</div>
              <div className="text-2xl font-bold text-green-400">{userLevel}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ERANK_DUNGEON_ZONES.map((zone, index) => {
              const minLevel = zone.monsters[0]?.level || 1;
              const maxLevel = zone.monsters[zone.monsters.length - 1]?.level || 10;
              const isAccessible = userLevel >= minLevel;
              
              return (
                <Card 
                  key={zone.id}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    isAccessible 
                      ? 'border-green-500/50 bg-gradient-to-br from-green-900/10 to-emerald-900/10 hover:border-green-400' 
                      : 'border-gray-600 bg-gray-900/20 opacity-60'
                  }`}
                  onClick={() => {
                    if (isAccessible) {
                      setSelectedZone(zone);
                      setShowZoneDetails(true);
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{zone.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Levels {minLevel}-{maxLevel} • {zone.monsters.length} Monsters
                        </p>
                      </div>
                      {!isAccessible && (
                        <div className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded">
                          Level {minLevel} Required
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      {zone.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400 flex items-center">
                        <Coins className="h-3 w-3 mr-1" />
                        {zone.monsters.reduce((sum, m) => sum + m.goldReward, 0)} Gold Total
                      </span>
                      {isAccessible ? (
                        <span className="text-green-400">Available</span>
                      ) : (
                        <span className="text-red-400">Locked</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* D-Rank Dungeons */}
      <Card className="mb-6 border-2 border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-indigo-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-blue-400 flex items-center">
                <Trophy className="h-6 w-6 mr-2" />
                D-Rank Dungeons
              </CardTitle>
              <p className="text-muted-foreground">
                Levels 11-20 • 2 Zones • 12 Monsters Total
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Your Level</div>
              <div className="text-2xl font-bold text-blue-400">{userLevel}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DRANK_DUNGEON_ZONES.map((zone, index) => {
              const minLevel = zone.monsters[0]?.level || 11;
              const maxLevel = zone.monsters[zone.monsters.length - 1]?.level || 20;
              const isAccessible = userLevel >= minLevel;
              
              return (
                <Card 
                  key={zone.id}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    isAccessible 
                      ? 'border-blue-500/50 bg-gradient-to-br from-blue-900/10 to-indigo-900/10 hover:border-blue-400' 
                      : 'border-gray-600 bg-gray-900/20 opacity-60'
                  }`}
                  onClick={() => {
                    if (isAccessible) {
                      setSelectedZone(zone);
                      setShowZoneDetails(true);
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{zone.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Levels {minLevel}-{maxLevel} • {zone.monsters.length} Monsters
                        </p>
                      </div>
                      {!isAccessible && (
                        <div className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded">
                          Level {minLevel} Required
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      {zone.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400 flex items-center">
                        <Coins className="h-3 w-3 mr-1" />
                        {zone.monsters.reduce((sum, m) => sum + m.goldReward, 0)} Gold Total
                      </span>
                      {isAccessible ? (
                        <span className="text-blue-400">Available</span>
                      ) : (
                        <span className="text-red-400">Locked</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Higher Rank Preview */}
      <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-violet-900/20">
        <CardHeader>
          <CardTitle className="text-xl text-purple-400 flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            C-Rank Dungeons
          </CardTitle>
          <p className="text-muted-foreground">
            Levels 21-30 • Coming Soon
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔒</div>
            <p className="text-muted-foreground">
              Complete all D-Rank dungeons to unlock C-Rank content
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Zone Details Modal would go here - simplified for now */}
      {showZoneDetails && selectedZone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{selectedZone.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowZoneDetails(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{selectedZone.storyIntro}</p>
              
              <div className="space-y-2 mb-4">
                {selectedZone.monsters.map(monster => (
                  <div key={monster.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-3">
                      {monster.image && (
                        <img src={monster.image} alt={monster.name} className="w-8 h-8" />
                      )}
                      <div>
                        <div className="font-medium">{monster.name}</div>
                        <div className="text-xs text-muted-foreground">Level {monster.level}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="flex items-center text-red-400">
                        <Heart className="h-3 w-3 mr-1" />
                        {monster.maxHp}
                      </div>
                      <div className="flex items-center text-yellow-400">
                        <Coins className="h-3 w-3 mr-1" />
                        {monster.goldReward}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                className="w-full"
                onClick={() => {
                  // Navigate to battle with selected zone
                  navigate(`/battle?zone=${selectedZone.id}`);
                }}
              >
                Enter Dungeon
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </ParallaxBackground>
  );
}