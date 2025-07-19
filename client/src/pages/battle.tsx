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
  Coins
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface Monster {
  id: number;
  name: string;
  level: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  goldReward: number;
  description: string;
}

interface BattleState {
  playerHp: number;
  playerMaxHp: number;
  monster: Monster;
  battleLog: string[];
  isPlayerTurn: boolean;
  battleResult: 'ongoing' | 'victory' | 'defeat';
}

// E-rank dungeon monsters (levels 1-10)
const ERANK_MONSTERS: Monster[] = [
  { id: 1, name: "Green Slime", level: 1, maxHp: 12, currentHp: 12, attack: 2, goldReward: 2, description: "A gelatinous blob that bounces menacingly" },
  { id: 2, name: "Cave Rat", level: 2, maxHp: 18, currentHp: 18, attack: 3, goldReward: 3, description: "A mangy rodent with sharp teeth" },
  { id: 3, name: "Wild Goblin", level: 3, maxHp: 25, currentHp: 25, attack: 4, goldReward: 4, description: "A mischievous creature wielding a rusty dagger" },
  { id: 4, name: "Forest Spider", level: 4, maxHp: 30, currentHp: 30, attack: 5, goldReward: 5, description: "An eight-legged predator with venomous fangs" },
  { id: 5, name: "Skeleton Warrior", level: 5, maxHp: 40, currentHp: 40, attack: 7, goldReward: 6, description: "Animated bones wielding ancient weapons" },
  { id: 6, name: "Stone Golem", level: 6, maxHp: 55, currentHp: 55, attack: 8, goldReward: 7, description: "A sturdy construct of animated rock" },
  { id: 7, name: "Shadow Wolf", level: 7, maxHp: 48, currentHp: 48, attack: 10, goldReward: 8, description: "A spectral predator that hunts in darkness" },
  { id: 8, name: "Fire Elemental", level: 8, maxHp: 60, currentHp: 60, attack: 12, goldReward: 9, description: "A being of pure flame and fury" },
  { id: 9, name: "Orc Berserker", level: 9, maxHp: 75, currentHp: 75, attack: 14, goldReward: 10, description: "A brutal warrior lost to bloodlust" },
  { id: 10, name: "Lesser Dragon", level: 10, maxHp: 100, currentHp: 100, attack: 18, goldReward: 10, description: "A young but fierce draconic beast" },
];

export default function Battle() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [isMonsterListOpen, setIsMonsterListOpen] = useState(true);

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Initialize battle state
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  const startBattle = (monster: Monster) => {
    // Stamina determines HP (10 base HP + 3 HP per stamina point)
    const playerMaxHp = Math.max(10, 10 + (userStats?.stamina || 10) * 3);
    const battleMonster = { ...monster, currentHp: monster.maxHp };
    
    setBattleState({
      playerHp: playerMaxHp,
      playerMaxHp,
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
    mutationFn: async (goldGain: number) => {
      const response = await fetch('/api/user/stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          goldGain: goldGain 
        })
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
        battleLog: [...prev.battleLog, `You strike for ${damage} damage!`],
        isPlayerTurn: false,
        battleResult: isMonsterDefeated ? 'victory' : 'ongoing'
      };
    });

    if (isMonsterDefeated) {
      setTimeout(() => {
        setBattleState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            battleLog: [...prev.battleLog, `${prev.monster.name} is defeated!`, `You gain ${prev.monster.goldReward} gold coins!`]
          };
        });
        
        updateStatsMutation.mutate(battleState.monster.goldReward);
        
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
      return {
        ...prev,
        playerHp: newPlayerHp,
        battleLog: [...prev.battleLog, `${prev.monster.name} attacks for ${damage} damage!`],
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

  // Monster Selection View
  if (!battleState) {
    return (
      <div className="min-h-screen bg-game-dark text-white pb-20">
        {/* Header */}
        <div className="bg-game-slate border-b border-gray-700 px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/")}
                  className="text-gray-300 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Stats
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-white">Battle Arena</h1>
                  <p className="text-gray-300 mt-1">Choose your opponent and fight for gold coins</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-yellow-400">
                  <Coins className="w-5 h-5" />
                  <span className="font-bold">{userStats?.gold || 0} Gold</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Combat Stats Info */}
          <Card className="bg-blue-900/20 border-blue-700 mb-6">
            <CardHeader>
              <CardTitle className="text-blue-300">Combat Mechanics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Sword className="w-4 h-4 text-red-400" />
                    <span className="font-semibold text-red-300">Strength</span>
                  </div>
                  <p className="text-gray-300">Increases your damage output. Higher strength means stronger attacks against monsters.</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Heart className="w-4 h-4 text-green-400" />
                    <span className="font-semibold text-green-300">Stamina</span>
                  </div>
                  <p className="text-gray-300">Determines your health points. More stamina means you can take more damage in battle.</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-purple-300">Agility</span>
                  </div>
                  <p className="text-gray-300">Affects evasion chance. Higher agility helps you dodge monster attacks.</p>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* E-rank Dungeon */}
          <Card className="bg-game-slate border-gray-700">
            <CardHeader>
              <CardTitle 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsMonsterListOpen(!isMonsterListOpen)}
              >
                <div className="flex items-center space-x-2">
                  <Skull className="w-6 h-6 text-red-400" />
                  <span>E-rank Dungeon</span>
                  <span className="text-sm text-gray-400">(Levels 1-10)</span>
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
                  {ERANK_MONSTERS.map((monster) => (
                    <Card 
                      key={monster.id}
                      className="bg-game-dark border-gray-600 hover:border-game-primary transition-colors cursor-pointer"
                      onClick={() => startBattle(monster)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-white">{monster.name}</h3>
                          <span className="text-sm bg-red-700 text-white px-2 py-1 rounded">
                            Lv.{monster.level}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{monster.description}</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3 text-red-400" />
                            <span>{monster.maxHp}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Sword className="w-3 h-3 text-orange-400" />
                            <span>{monster.attack}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-yellow-400">
                            <Coins className="w-3 h-3" />
                            <span>{monster.goldReward}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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

  // Battle View
  return (
    <div className="min-h-screen bg-game-dark text-white pb-20">
      {/* Header */}
      <div className="bg-game-slate border-b border-gray-700 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={returnToMonsterList}
                className="text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Monster List
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Battle: {battleState.monster.name}</h1>
                <p className="text-gray-300 mt-1">Level {battleState.monster.level} Monster</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-yellow-400">
                <Coins className="w-5 h-5" />
                <span className="font-bold">{userStats?.gold || 0} Gold</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Battle Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player Status */}
          <Card className="bg-game-slate border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span>{userStats?.username || 'Player'}</span>
                <span className="text-sm text-gray-400">Level {userStats?.level || 1}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center">
                    <Heart className="w-4 h-4 text-red-400 mr-1" />
                    HP
                  </span>
                  <span className="text-sm">{battleState.playerHp}/{battleState.playerMaxHp}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-red-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${playerHpPercentage}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sword className="w-4 h-4 text-red-400" />
                    <span>Strength: {userStats?.strength || 5}</span>
                  </div>
                  <span className="text-gray-400">Damage: {3 + Math.floor((userStats?.strength || 5) / 2)}-{3 + Math.floor((userStats?.strength || 5) / 2) + 2}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-green-400" />
                    <span>Stamina: {userStats?.stamina || 10}</span>
                  </div>
                  <span className="text-gray-400">Max HP: {Math.max(10, 10 + (userStats?.stamina || 10) * 3)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>Agility: {userStats?.agility || 5}</span>
                  </div>
                  <span className="text-gray-400">Evasion: {Math.min(90, (userStats?.agility || 5) * 5)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monster Status */}
          <Card className="bg-game-slate border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Skull className="w-5 h-5 text-red-400" />
                <span>{battleState.monster.name}</span>
                <span className="text-sm text-gray-400">Level {battleState.monster.level}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center">
                    <Heart className="w-4 h-4 text-red-400 mr-1" />
                    HP
                  </span>
                  <span className="text-sm">{battleState.monster.currentHp}/{battleState.monster.maxHp}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-red-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${monsterHpPercentage}%` }}
                  />
                </div>
              </div>
              
              <p className="text-sm text-gray-300">{battleState.monster.description}</p>
              <div className="text-sm">
                <span className="text-orange-400">Attack:</span> {battleState.monster.attack}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Battle Actions */}
        <Card className="bg-game-slate border-gray-700">
          <CardHeader>
            <CardTitle>Combat Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {battleState.battleResult === 'ongoing' && (
              <div className="flex space-x-4">
                <Button
                  onClick={playerAttack}
                  disabled={!battleState.isPlayerTurn}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  <Sword className="w-4 h-4 mr-2" />
                  Attack
                </Button>
                <Button
                  variant="outline"
                  disabled
                  className="opacity-50"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Defend (Coming Soon)
                </Button>
              </div>
            )}

            {battleState.battleResult === 'victory' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-400">
                  <Trophy className="w-5 h-5" />
                  <span className="font-semibold">Victory!</span>
                </div>
                <div className="flex space-x-4">
                  <Button onClick={returnToMonsterList} className="bg-green-600 hover:bg-green-700">
                    Choose Another Monster
                  </Button>
                  <Button variant="outline" onClick={() => setLocation("/")}>
                    Return to Stats
                  </Button>
                </div>
              </div>
            )}

            {battleState.battleResult === 'defeat' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-red-400">
                  <Skull className="w-5 h-5" />
                  <span className="font-semibold">Defeat!</span>
                </div>
                <div className="flex space-x-4">
                  <Button onClick={returnToMonsterList} className="bg-red-600 hover:bg-red-700">
                    Choose Different Monster
                  </Button>
                  <Button variant="outline" onClick={() => setLocation("/")}>
                    Return to Stats
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Battle Log */}
        <Card className="bg-game-slate border-gray-700">
          <CardHeader>
            <CardTitle>Battle Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {battleState.battleLog.map((log, index) => (
                <div key={index} className="text-sm text-gray-300 p-2 bg-gray-800 rounded">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}