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
  Skull
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface Monster {
  id: number;
  name: string;
  level: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  xpReward: number;
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

export default function Battle() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Initialize battle state
  const [battleState, setBattleState] = useState<BattleState>(() => {
    const slime: Monster = {
      id: 1,
      name: "Green Slime",
      level: 1,
      maxHp: 10,
      currentHp: 10,
      attack: 1,
      xpReward: 25,
      description: "A gelatinous blob that bounces menacingly"
    };

    const playerMaxHp = Math.max(10, (userStats?.stamina || 10) * 2);
    
    return {
      playerHp: playerMaxHp,
      playerMaxHp,
      monster: slime,
      battleLog: [`A wild ${slime.name} appears!`],
      isPlayerTurn: true,
      battleResult: 'ongoing'
    };
  });

  // Update player HP when stats load
  useEffect(() => {
    if (userStats && battleState.battleResult === 'ongoing') {
      const newMaxHp = Math.max(10, userStats.stamina * 2);
      setBattleState(prev => ({
        ...prev,
        playerMaxHp: newMaxHp,
        playerHp: Math.min(prev.playerHp, newMaxHp)
      }));
    }
  }, [userStats]);

  const updateStatsMutation = useMutation({
    mutationFn: async (xpGain: number) => {
      const response = await fetch('/api/user/stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          experienceGain: xpGain 
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
    if (!battleState.isPlayerTurn || battleState.battleResult !== 'ongoing') return;

    const playerStrength = userStats?.strength || 5;
    const baseDamage = Math.max(1, Math.floor(playerStrength / 2));
    const damage = baseDamage + Math.floor(Math.random() * 3); // 1-3 random bonus

    const newMonsterHp = Math.max(0, battleState.monster.currentHp - damage);
    const isMonsterDefeated = newMonsterHp === 0;

    setBattleState(prev => ({
      ...prev,
      monster: { ...prev.monster, currentHp: newMonsterHp },
      battleLog: [...prev.battleLog, `You strike for ${damage} damage!`],
      isPlayerTurn: false,
      battleResult: isMonsterDefeated ? 'victory' : 'ongoing'
    }));

    if (isMonsterDefeated) {
      setTimeout(() => {
        setBattleState(prev => ({
          ...prev,
          battleLog: [...prev.battleLog, `${prev.monster.name} is defeated!`, `You gain ${prev.monster.xpReward} XP!`]
        }));
        
        updateStatsMutation.mutate(battleState.monster.xpReward);
        
        toast({
          title: "Victory!",
          description: `You defeated the ${battleState.monster.name} and gained ${battleState.monster.xpReward} XP!`,
        });
      }, 1000);
    } else {
      setTimeout(() => monsterAttack(), 1500);
    }
  };

  const monsterAttack = () => {
    if (battleState.battleResult !== 'ongoing') return;

    const damage = battleState.monster.attack;
    const newPlayerHp = Math.max(0, battleState.playerHp - damage);
    const isPlayerDefeated = newPlayerHp === 0;

    setBattleState(prev => ({
      ...prev,
      playerHp: newPlayerHp,
      battleLog: [...prev.battleLog, `${prev.monster.name} attacks for ${damage} damage!`],
      isPlayerTurn: true,
      battleResult: isPlayerDefeated ? 'defeat' : 'ongoing'
    }));

    if (isPlayerDefeated) {
      toast({
        title: "Defeat",
        description: "You have been defeated! Train harder and come back stronger!",
        variant: "destructive"
      });
    }
  };

  const restartBattle = () => {
    const slime: Monster = {
      id: 1,
      name: "Green Slime",
      level: 1,
      maxHp: 10,
      currentHp: 10,
      attack: 1,
      xpReward: 25,
      description: "A gelatinous blob that bounces menacingly"
    };

    const playerMaxHp = Math.max(10, (userStats?.stamina || 10) * 2);
    
    setBattleState({
      playerHp: playerMaxHp,
      playerMaxHp,
      monster: slime,
      battleLog: [`A wild ${slime.name} appears!`],
      isPlayerTurn: true,
      battleResult: 'ongoing'
    });
  };

  const playerHpPercentage = (battleState.playerHp / battleState.playerMaxHp) * 100;
  const monsterHpPercentage = (battleState.monster.currentHp / battleState.monster.maxHp) * 100;

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
                <p className="text-gray-300 mt-1">Fight monsters to gain experience</p>
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
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Sword className="w-4 h-4 text-orange-400" />
                  <span>STR: {userStats?.strength || 5}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span>STA: {userStats?.stamina || 5}</span>
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
                  <Button onClick={restartBattle} className="bg-green-600 hover:bg-green-700">
                    Fight Again
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
                  <Button onClick={restartBattle} className="bg-red-600 hover:bg-red-700">
                    Try Again
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