import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Star
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
    zone: null
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
    <ParallaxBackground>
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/pve-dungeons")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dungeons
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold">{battleState.zone.name}</h1>
            <p className="text-sm text-muted-foreground">
              Monster {battleState.currentMonsterIndex + 1} of {battleState.zone.monsters.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Gold Earned</div>
            <div className="text-lg font-bold text-yellow-400">{battleState.totalGoldEarned}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Dungeon Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Battle Arena */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Player */}
          <Card className="border-2 border-blue-500/50">
            <CardHeader>
              <CardTitle className="text-blue-400 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                {userStats.username}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <Avatar2D 
                  gender={userStats.gender || "male"}
                  skinColor={userStats.skinColor}
                  hairColor={userStats.hairColor}
                  className="w-16 h-16"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Health</span>
                    <span className="text-sm">{battleState.playerHp}/{battleState.playerMaxHp}</span>
                  </div>
                  <Progress 
                    value={(battleState.playerHp / battleState.playerMaxHp) * 100} 
                    className="h-2 mb-2"
                  />
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Mana</span>
                    <span className="text-sm">{battleState.playerMp}/{battleState.playerMaxMp}</span>
                  </div>
                  <Progress 
                    value={(battleState.playerMp / battleState.playerMaxMp) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="text-red-400">STR</div>
                  <div>{userStats.strength}</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400">STA</div>
                  <div>{userStats.stamina}</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400">AGI</div>
                  <div>{userStats.agility}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monster */}
          <Card className="border-2 border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center">
                <Skull className="h-5 w-5 mr-2" />
                {battleState.monster?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {battleState.monster && (
                <div className="flex items-center space-x-4 mb-4">
                  {battleState.monster.image && (
                    <img 
                      src={battleState.monster.image} 
                      alt={battleState.monster.name}
                      className="w-16 h-16 object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Health</span>
                      <span className="text-sm">{battleState.monster.currentHp}/{battleState.monster.maxHp}</span>
                    </div>
                    <Progress 
                      value={(battleState.monster.currentHp / battleState.monster.maxHp) * 100} 
                      className="h-3"
                    />
                  </div>
                </div>
              )}
              {battleState.monster && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-yellow-400">Level</div>
                    <div>{battleState.monster.level}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-orange-400">Attack</div>
                    <div>{battleState.monster.attack}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Battle Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleAttack}
                disabled={!battleState.isPlayerTurn || battleState.battleResult !== 'ongoing' || attackMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                <Sword className="h-4 w-4 mr-2" />
                {attackMutation.isPending ? "Attacking..." : "Attack"}
              </Button>
              <Button
                variant="outline"
                onClick={handleRetreat}
                disabled={attackMutation.isPending}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retreat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Battle Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Battle Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {battleState.battleLog.map((log, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Victory/Defeat Modal */}
        {battleState.battleResult !== 'ongoing' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className={`text-xl text-center ${
                  battleState.battleResult === 'victory' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {battleState.battleResult === 'victory' ? (
                    <>
                      <Trophy className="h-6 w-6 mx-auto mb-2" />
                      Victory!
                    </>
                  ) : (
                    <>
                      <Skull className="h-6 w-6 mx-auto mb-2" />
                      Defeat
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {battleState.battleResult === 'victory' ? (
                  <div className="space-y-3">
                    <p>You have defeated {battleState.monster?.name}!</p>
                    <div className="flex items-center justify-center space-x-2 text-yellow-400">
                      <Coins className="h-4 w-4" />
                      <span>+{battleState.monster?.goldReward} Gold</span>
                    </div>
                    {battleState.currentMonsterIndex === battleState.zone!.monsters.length - 1 ? (
                      <div>
                        <p className="text-green-400 font-bold">Dungeon Complete!</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {battleState.zone!.completionStory}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Preparing next battle...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p>You have been defeated...</p>
                    <Button onClick={handleRetreat} className="w-full">
                      Return to Dungeons
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ParallaxBackground>
  );
}