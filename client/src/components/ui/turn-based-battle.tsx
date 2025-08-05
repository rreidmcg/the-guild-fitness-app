import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Sword, 
  Heart, 
  Zap, 
  ArrowLeft,
  Trophy,
  Skull,
  Star,
  Sparkles
} from "lucide-react";

// Import battle assets
import greenSlimeImage from "@assets/IMG_3665_1753055571089.png";

interface TurnBasedBattleProps {
  dungeonId: string;
  onBattleComplete: (result: 'victory' | 'defeat') => void;
  onBack: () => void;
}

interface BattleState {
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  ultimateMeter: number; // 0-100%
  enemyHp: number;
  enemyMaxHp: number;
  currentRound: number;
  totalRounds: number;
  actionsRemaining: number;
  maxActions: number;
  battlePhase: 'preparation' | 'player_turn' | 'enemy_turn' | 'victory' | 'defeat';
  lastAction: string | null;
  damageNumbers: Array<{ id: number; damage: number; x: number; y: number; type: 'player' | 'enemy' | 'ultimate' }>;
}

interface Enemy {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  image: string;
  element: string;
}

export function TurnBasedBattle({ dungeonId, onBattleComplete, onBack }: TurnBasedBattleProps) {
  const { toast } = useToast();
  const [damageCounter, setDamageCounter] = useState(0);
  
  const [battleState, setBattleState] = useState<BattleState>({
    playerHp: 100,
    playerMaxHp: 100,
    playerMp: 50,
    playerMaxMp: 100,
    ultimateMeter: 0,
    enemyHp: 120,
    enemyMaxHp: 120,
    currentRound: 1,
    totalRounds: 3,
    actionsRemaining: 4,
    maxActions: 4,
    battlePhase: 'preparation',
    lastAction: null,
    damageNumbers: []
  });

  const [enemy] = useState<Enemy>({
    name: "Cave Slime",
    level: 5,
    hp: 120,
    maxHp: 120,
    image: greenSlimeImage,
    element: "Nature"
  });

  const { data: userStats } = useQuery({ queryKey: ["/api/user/stats"] });

  const calculateAttackDamage = (): number => {
    const baseAttack = (userStats as any)?.strength || 10;
    const randomFactor = 0.8 + Math.random() * 0.4; // 80-120% damage variance
    return Math.floor(baseAttack * randomFactor * 1.5); // Make attacks more impactful
  };

  const calculateUltimateDamage = (): number => {
    const baseAttack = (userStats as any)?.strength || 10;
    return Math.floor(baseAttack * 3.5); // Ultimate does much more damage
  };

  const addDamageNumber = (damage: number, type: 'player' | 'enemy' | 'ultimate') => {
    const newDamage = {
      id: damageCounter,
      damage,
      x: type === 'player' ? 60 + Math.random() * 20 : 40 + Math.random() * 20,
      y: type === 'player' ? 30 + Math.random() * 10 : 60 + Math.random() * 10,
      type
    };
    
    setBattleState(prev => ({
      ...prev,
      damageNumbers: [...prev.damageNumbers, newDamage]
    }));
    
    setDamageCounter(prev => prev + 1);
    
    // Remove damage number after animation
    setTimeout(() => {
      setBattleState(prev => ({
        ...prev,
        damageNumbers: prev.damageNumbers.filter(d => d.id !== newDamage.id)
      }));
    }, 1500);
  };

  const handleAttack = () => {
    if (battleState.actionsRemaining <= 0 || battleState.battlePhase !== 'player_turn') return;
    
    const damage = calculateAttackDamage();
    const ultimateGain = 12 + Math.floor(Math.random() * 6); // 12-17% per hit
    
    addDamageNumber(damage, 'player');
    
    setBattleState(prev => ({
      ...prev,
      enemyHp: Math.max(0, prev.enemyHp - damage),
      ultimateMeter: Math.min(100, prev.ultimateMeter + ultimateGain),
      actionsRemaining: prev.actionsRemaining - 1,
      lastAction: `Attack: ${damage} damage (+${ultimateGain}% Ultimate)`
    }));
    
    toast({
      title: "Attack!",
      description: `Dealt ${damage} damage! Ultimate: +${ultimateGain}%`,
    });
  };

  const handleUltimateAttack = () => {
    if (battleState.ultimateMeter < 100 || battleState.actionsRemaining <= 0 || battleState.battlePhase !== 'player_turn') return;
    
    const damage = calculateUltimateDamage();
    
    addDamageNumber(damage, 'ultimate');
    
    setBattleState(prev => ({
      ...prev,
      enemyHp: Math.max(0, prev.enemyHp - damage),
      ultimateMeter: 0,
      actionsRemaining: prev.actionsRemaining - 1,
      lastAction: `ULTIMATE ATTACK: ${damage} damage!`
    }));
    
    toast({
      title: "ULTIMATE ATTACK!",
      description: `Devastating blow for ${damage} damage!`,
      className: "bg-yellow-500 text-black"
    });
  };

  const handleEndTurn = () => {
    if (battleState.battlePhase !== 'player_turn') return;
    
    setBattleState(prev => ({
      ...prev,
      battlePhase: 'enemy_turn',
      actionsRemaining: 0
    }));
  };

  // Handle enemy turn
  useEffect(() => {
    if (battleState.battlePhase === 'enemy_turn' && battleState.enemyHp > 0) {
      setTimeout(() => {
        const enemyDamage = 12 + Math.floor(Math.random() * 8); // 12-19 damage
        
        addDamageNumber(enemyDamage, 'enemy');
        
        setBattleState(prev => ({
          ...prev,
          playerHp: Math.max(0, prev.playerHp - enemyDamage),
          battlePhase: 'player_turn',
          actionsRemaining: prev.maxActions,
          lastAction: `${enemy.name} attacks for ${enemyDamage} damage!`
        }));
      }, 2000); // 2 second delay for enemy action
    }
  }, [battleState.battlePhase, battleState.enemyHp, enemy.name]);

  // Check battle end conditions
  useEffect(() => {
    if (battleState.playerHp <= 0) {
      setBattleState(prev => ({ ...prev, battlePhase: 'defeat' }));
      setTimeout(() => onBattleComplete('defeat'), 2000);
    } else if (battleState.enemyHp <= 0) {
      if (battleState.currentRound < battleState.totalRounds) {
        // Next round - respawn enemy with full HP
        setTimeout(() => {
          setBattleState(prev => ({
            ...prev,
            currentRound: prev.currentRound + 1,
            enemyHp: enemy.maxHp,
            battlePhase: 'player_turn',
            actionsRemaining: prev.maxActions,
            lastAction: `Round ${prev.currentRound + 1} begins!`
          }));
          
          toast({
            title: `Round ${battleState.currentRound + 1}`,
            description: "The enemy returns stronger!",
          });
        }, 1500);
      } else {
        // Victory
        setBattleState(prev => ({ ...prev, battlePhase: 'victory' }));
        setTimeout(() => onBattleComplete('victory'), 2000);
      }
    }
  }, [battleState.playerHp, battleState.enemyHp, battleState.currentRound, battleState.totalRounds, enemy.maxHp, onBattleComplete]);

  const startBattle = () => {
    setBattleState(prev => ({ ...prev, battlePhase: 'player_turn' }));
  };

  const getUltimateMeterColor = () => {
    if (battleState.ultimateMeter >= 100) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    if (battleState.ultimateMeter >= 75) return "bg-gradient-to-r from-orange-400 to-yellow-400";
    if (battleState.ultimateMeter >= 50) return "bg-gradient-to-r from-red-400 to-orange-400";
    return "bg-gradient-to-r from-blue-400 to-purple-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black text-white relative overflow-hidden">
      {/* Battle Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="text-center">
          <div className="text-sm text-gray-400">Round {battleState.currentRound}/{battleState.totalRounds}</div>
          <div className="text-lg font-bold">{enemy.name} Lv.{enemy.level}</div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-400">Actions</div>
          <div className="text-lg font-bold text-blue-400">{battleState.actionsRemaining}/{battleState.maxActions}</div>
        </div>
      </div>

      {/* Battle Arena - 3rd Person View */}
      <div className="relative flex-1 min-h-[500px] perspective-1000">
        {/* Ground/Floor */}
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-green-800/30 to-transparent" />
        
        {/* Enemy - Positioned in distance */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2" style={{ transform: 'translateX(-50%) scale(1.2)' }}>
          <div className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <Heart className="w-4 h-4 text-red-400 mr-2" />
              <Progress 
                value={(battleState.enemyHp / battleState.enemyMaxHp) * 100} 
                className="w-48 h-4 bg-gray-800"
              />
              <span className="ml-2 text-sm font-bold">{battleState.enemyHp}/{battleState.enemyMaxHp}</span>
            </div>
            <Badge variant="outline" className="border-green-400 text-green-400 bg-green-400/10">
              {enemy.element} • Level {enemy.level}
            </Badge>
          </div>
          
          <div className="relative">
            <img 
              src={enemy.image} 
              alt={enemy.name}
              className={`w-40 h-40 object-contain transition-all duration-300 ${
                battleState.battlePhase === 'enemy_turn' ? 'animate-pulse scale-110' : ''
              }`}
              style={{ 
                filter: battleState.enemyHp <= 0 ? 'grayscale(100%) opacity(50%)' : 'none',
                imageRendering: 'pixelated'
              }}
            />
          </div>
        </div>

        {/* Player Character - Bottom foreground */}
        <div className="absolute bottom-16 left-16">
          <div className="text-left mb-4">
            <div className="flex items-center mb-2">
              <Heart className="w-4 h-4 text-red-400 mr-2" />
              <Progress 
                value={(battleState.playerHp / battleState.playerMaxHp) * 100} 
                className="w-40 h-3 bg-gray-800"
              />
              <span className="ml-2 text-sm font-bold">{battleState.playerHp}/{battleState.playerMaxHp}</span>
            </div>
            <div className="flex items-center mb-2">
              <Zap className="w-4 h-4 text-blue-400 mr-2" />
              <Progress 
                value={(battleState.playerMp / battleState.playerMaxMp) * 100} 
                className="w-40 h-3 bg-gray-800"
              />
              <span className="ml-2 text-sm font-bold">{battleState.playerMp}/{battleState.playerMaxMp}</span>
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 mr-2" />
              <div className="relative w-40 h-3 bg-gray-800 rounded overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getUltimateMeterColor()}`}
                  style={{ width: `${battleState.ultimateMeter}%` }}
                />
                {battleState.ultimateMeter >= 100 && (
                  <div className="absolute inset-0 bg-yellow-400 animate-pulse opacity-50" />
                )}
              </div>
              <span className="ml-2 text-sm font-bold text-yellow-400">{Math.floor(battleState.ultimateMeter)}%</span>
            </div>
          </div>
          
          <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center border-4 border-blue-400 shadow-lg">
            <Sword className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Damage Numbers */}
        {battleState.damageNumbers.map((damage) => (
          <div
            key={damage.id}
            className={`absolute text-2xl font-bold animate-bounce pointer-events-none ${
              damage.type === 'ultimate' 
                ? 'text-yellow-400 text-4xl animate-pulse' 
                : damage.type === 'player' 
                  ? 'text-red-400' 
                  : 'text-orange-400'
            }`}
            style={{
              left: `${damage.x}%`,
              top: `${damage.y}%`,
              animationDuration: '1.5s',
              animationFillMode: 'forwards'
            }}
          >
            -{damage.damage}
            {damage.type === 'ultimate' && <Sparkles className="w-6 h-6 inline ml-1" />}
          </div>
        ))}

        {/* Turn Indicator */}
        {battleState.battlePhase === 'enemy_turn' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-red-500/80 px-6 py-3 rounded-lg text-center">
              <Skull className="w-8 h-8 mx-auto mb-2" />
              <div className="text-lg font-bold">Enemy Turn</div>
            </div>
          </div>
        )}
      </div>

      {/* Action Panel */}
      {battleState.battlePhase === 'player_turn' && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/90 p-6 border-t border-gray-700">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Button
                onClick={handleAttack}
                disabled={battleState.actionsRemaining <= 0}
                className="h-16 text-lg bg-red-600 hover:bg-red-700 disabled:opacity-50"
                size="lg"
              >
                <Sword className="w-6 h-6 mr-2" />
                Attack
              </Button>
              
              <Button
                onClick={handleUltimateAttack}
                disabled={battleState.ultimateMeter < 100 || battleState.actionsRemaining <= 0}
                className={`h-16 text-lg ${
                  battleState.ultimateMeter >= 100 
                    ? 'bg-yellow-600 hover:bg-yellow-700 animate-pulse' 
                    : 'bg-gray-600 opacity-50 cursor-not-allowed'
                }`}
                size="lg"
              >
                <Star className="w-6 h-6 mr-2" />
                Ultimate {battleState.ultimateMeter >= 100 ? '(READY!)' : `(${Math.floor(battleState.ultimateMeter)}%)`}
              </Button>
            </div>
            
            <div className="text-center">
              <Button
                onClick={handleEndTurn}
                variant="outline"
                className="border-gray-500 text-gray-300 hover:bg-gray-800"
              >
                End Turn ({battleState.actionsRemaining} actions remaining)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Feedback */}
      {battleState.lastAction && battleState.battlePhase !== 'preparation' && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 rounded-lg border border-gray-600">
          <div className="text-center text-white font-semibold">{battleState.lastAction}</div>
        </div>
      )}

      {/* Battle Start/End Overlays */}
      {battleState.battlePhase === 'preparation' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <Card className="bg-gray-900 border-gray-700 max-w-md">
            <CardContent className="text-center p-8">
              <h2 className="text-3xl font-bold mb-4 text-blue-400">Battle Start!</h2>
              <p className="text-gray-400 mb-2">Prepare to face the {enemy.name}!</p>
              <p className="text-sm text-gray-500 mb-6">
                • 4 actions per turn<br/>
                • Attacks build Ultimate meter<br/>
                • {battleState.totalRounds} rounds to victory
              </p>
              <Button onClick={startBattle} className="bg-blue-600 hover:bg-blue-700" size="lg">
                <Sword className="w-5 h-5 mr-2" />
                Begin Battle
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {battleState.battlePhase === 'victory' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <Card className="bg-green-900 border-green-700 max-w-md">
            <CardContent className="text-center p-8">
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-green-400 mb-4">Victory!</h2>
              <p className="text-gray-300 mb-2">You defeated the {enemy.name}!</p>
              <p className="text-sm text-yellow-400">+50 Gold • +25 XP</p>
            </CardContent>
          </Card>
        </div>
      )}

      {battleState.battlePhase === 'defeat' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <Card className="bg-red-900 border-red-700 max-w-md">
            <CardContent className="text-center p-8">
              <Skull className="w-20 h-20 text-red-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-red-400 mb-4">Defeat</h2>
              <p className="text-gray-300">The {enemy.name} was too strong...</p>
              <p className="text-sm text-gray-500 mt-2">Train harder and try again!</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}