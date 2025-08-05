import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Sword, 
  Shield, 
  Heart, 
  Zap, 
  Star,
  Crown,
  Fist,
  Sparkles,
  ArrowLeft,
  Trophy
} from "lucide-react";

// Import battle assets
import swordIcon from "@assets/IMG_3799_1754013496468.png";
import greenSlimeImage from "@assets/IMG_3665_1753055571089.png";

interface KnighthoodBattleProps {
  dungeonId: string;
  onBattleComplete: (result: 'victory' | 'defeat') => void;
  onBack: () => void;
}

interface BattleState {
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  playerRage: number;
  enemyHp: number;
  enemyMaxHp: number;
  currentRound: number;
  totalRounds: number;
  actionsRemaining: number;
  maxActions: number;
  comboCount: number;
  battlePhase: 'preparation' | 'combat' | 'victory' | 'defeat';
  lastAction: string | null;
  heroAbilitiesReady: boolean[];
  selectedHero: number | null;
}

interface Enemy {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  image: string;
  element: string;
}

interface Hero {
  id: number;
  name: string;
  element: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  baseAbilityReady: boolean;
  rageAbilityReady: boolean;
}

export function KnighthoodBattle({ dungeonId, onBattleComplete, onBack }: KnighthoodBattleProps) {
  const { toast } = useToast();
  const battleAreaRef = useRef<HTMLDivElement>(null);
  
  const [battleState, setBattleState] = useState<BattleState>({
    playerHp: 100,
    playerMaxHp: 100,
    playerMp: 50,
    playerMaxMp: 100,
    playerRage: 0,
    enemyHp: 100,
    enemyMaxHp: 100,
    currentRound: 1,
    totalRounds: 3,
    actionsRemaining: 4,
    maxActions: 4,
    comboCount: 0,
    battlePhase: 'preparation',
    lastAction: null,
    heroAbilitiesReady: [true, true],
    selectedHero: null
  });

  const [enemy] = useState<Enemy>({
    name: "Cave Slime",
    level: 5,
    hp: 100,
    maxHp: 100,
    image: greenSlimeImage,
    element: "Nature"
  });

  const [heroes] = useState<Hero[]>([
    {
      id: 1,
      name: "Avalon",
      element: "Light",
      rarity: 'legendary',
      baseAbilityReady: true,
      rageAbilityReady: false
    },
    {
      id: 2,
      name: "Kren",
      element: "Fire",
      rarity: 'epic',
      baseAbilityReady: true,
      rageAbilityReady: false
    }
  ]);

  const { data: userStats } = useQuery({ queryKey: ["/api/user/stats"] });

  // Touch gesture handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [gestureDetected, setGestureDetected] = useState<string | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Detect gesture type
    if (distance < 10) {
      // Tap
      handleWeaponAttack();
    } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY < -50) {
        // Swipe up - Punch attack
        handlePunchAttack();
      }
    } else {
      if (Math.abs(deltaX) > 50) {
        // Swipe left/right - Side attack for combo
        handleSideAttack();
      }
    }
    
    setTouchStart(null);
  };

  const handleWeaponAttack = () => {
    if (battleState.actionsRemaining <= 0 || battleState.battlePhase !== 'combat') return;
    
    const damage = calculateWeaponDamage();
    setBattleState(prev => ({
      ...prev,
      enemyHp: Math.max(0, prev.enemyHp - damage),
      actionsRemaining: prev.actionsRemaining - 1,
      comboCount: prev.comboCount + 1,
      lastAction: `Weapon Attack: ${damage} damage`
    }));
    
    // Check for combo bonus
    if (battleState.comboCount >= 3) {
      toast({
        title: "Combo Bonus!",
        description: `${battleState.comboCount + 1} hit combo!`,
      });
    }
  };

  const handlePunchAttack = () => {
    if (battleState.actionsRemaining <= 0 || battleState.battlePhase !== 'combat') return;
    
    const damage = calculatePunchDamage();
    const rageGain = 25;
    
    setBattleState(prev => ({
      ...prev,
      enemyHp: Math.max(0, prev.enemyHp - damage),
      playerRage: Math.min(100, prev.playerRage + rageGain),
      actionsRemaining: prev.actionsRemaining - 1,
      comboCount: 0, // Punches don't chain with weapons
      lastAction: `Punch Attack: ${damage} damage, +${rageGain} Rage`
    }));
  };

  const handleSideAttack = () => {
    if (battleState.comboCount === 0) return; // Can only side attack during combos
    
    const damage = calculateWeaponDamage() * 0.8; // Slightly less damage
    setBattleState(prev => ({
      ...prev,
      enemyHp: Math.max(0, prev.enemyHp - damage),
      comboCount: prev.comboCount + 1,
      lastAction: `Side Attack: ${damage} damage`
    }));
  };

  const handleHeroAbility = (heroIndex: number, isRageAbility: boolean = false) => {
    if (battleState.actionsRemaining <= 0 || battleState.battlePhase !== 'combat') return;
    
    const hero = heroes[heroIndex];
    
    if (isRageAbility && battleState.playerRage < 100) {
      toast({
        title: "Not enough Rage!",
        description: "Rage meter must be full to use ultimate abilities.",
        variant: "destructive"
      });
      return;
    }
    
    let damage = 0;
    let healing = 0;
    let actionDescription = "";
    
    if (isRageAbility) {
      // Ultimate abilities
      damage = calculateHeroDamage(hero) * 2.5;
      healing = battleState.playerMaxHp * 0.3;
      actionDescription = `${hero.name}'s Ultimate: ${damage} damage, +${healing} HP`;
      
      setBattleState(prev => ({
        ...prev,
        enemyHp: Math.max(0, prev.enemyHp - damage),
        playerHp: Math.min(prev.playerMaxHp, prev.playerHp + healing),
        playerRage: 0,
        actionsRemaining: prev.actionsRemaining - 1,
        comboCount: 0,
        lastAction: actionDescription
      }));
    } else {
      // Base abilities
      damage = calculateHeroDamage(hero);
      actionDescription = `${hero.name}'s Ability: ${damage} damage`;
      
      setBattleState(prev => ({
        ...prev,
        enemyHp: Math.max(0, prev.enemyHp - damage),
        actionsRemaining: prev.actionsRemaining - 1,
        comboCount: 0,
        lastAction: actionDescription
      }));
    }
  };

  const calculateWeaponDamage = () => {
    const baseAttack = (userStats as any)?.strength || 10;
    const randomFactor = 0.8 + Math.random() * 0.4; // 80-120% damage variance
    return Math.floor(baseAttack * randomFactor);
  };

  const calculatePunchDamage = () => {
    const baseAttack = (userStats as any)?.strength || 10;
    return Math.floor(baseAttack * 0.6); // Punches do less damage
  };

  const calculateHeroDamage = (hero: Hero) => {
    const baseAttack = (userStats as any)?.strength || 10;
    const heroMultiplier = hero.rarity === 'legendary' ? 1.5 : hero.rarity === 'epic' ? 1.3 : 1.1;
    return Math.floor(baseAttack * heroMultiplier);
  };

  // End turn when no actions remain
  useEffect(() => {
    if (battleState.actionsRemaining === 0 && battleState.battlePhase === 'combat') {
      // Enemy turn
      setTimeout(() => {
        const enemyDamage = 15 + Math.floor(Math.random() * 10);
        setBattleState(prev => ({
          ...prev,
          playerHp: Math.max(0, prev.playerHp - enemyDamage),
          actionsRemaining: prev.maxActions,
          comboCount: 0,
          lastAction: `Enemy attacks for ${enemyDamage} damage!`
        }));
      }, 1000);
    }
  }, [battleState.actionsRemaining]);

  // Check battle end conditions
  useEffect(() => {
    if (battleState.playerHp <= 0) {
      setBattleState(prev => ({ ...prev, battlePhase: 'defeat' }));
      setTimeout(() => onBattleComplete('defeat'), 2000);
    } else if (battleState.enemyHp <= 0) {
      if (battleState.currentRound < battleState.totalRounds) {
        // Next round
        setBattleState(prev => ({
          ...prev,
          currentRound: prev.currentRound + 1,
          enemyHp: enemy.maxHp,
          actionsRemaining: prev.maxActions,
          comboCount: 0
        }));
      } else {
        // Victory
        setBattleState(prev => ({ ...prev, battlePhase: 'victory' }));
        setTimeout(() => onBattleComplete('victory'), 2000);
      }
    }
  }, [battleState.playerHp, battleState.enemyHp]);

  const startBattle = () => {
    setBattleState(prev => ({ ...prev, battlePhase: 'combat' }));
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400 border-yellow-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'rare': return 'text-blue-400 border-blue-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden">
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
          <div className="text-lg font-bold">{battleState.actionsRemaining}/{battleState.maxActions}</div>
        </div>
      </div>

      {/* Battle Area */}
      <div className="relative flex-1 min-h-[400px]">
        {/* Enemy */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <Progress 
                value={(battleState.enemyHp / battleState.enemyMaxHp) * 100} 
                className="w-48 h-3"
              />
              <span className="ml-2 text-sm">{battleState.enemyHp}/{battleState.enemyMaxHp}</span>
            </div>
            <Badge variant="outline" className="border-green-400 text-green-400">
              {enemy.element}
            </Badge>
          </div>
          
          <div className="relative">
            <img 
              src={enemy.image} 
              alt={enemy.name}
              className="w-32 h-32 object-contain animate-pulse"
            />
            {battleState.comboCount > 0 && (
              <div className="absolute -top-4 right-0 bg-yellow-500 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {battleState.comboCount}
              </div>
            )}
          </div>
        </div>

        {/* Player Character */}
        <div className="absolute bottom-8 left-8">
          <div className="text-center mb-4">
            <div className="flex items-center mb-2">
              <Heart className="w-4 h-4 text-red-400 mr-1" />
              <Progress 
                value={(battleState.playerHp / battleState.playerMaxHp) * 100} 
                className="w-32 h-2"
              />
              <span className="ml-2 text-xs">{battleState.playerHp}/{battleState.playerMaxHp}</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 text-blue-400 mr-1" />
              <Progress 
                value={(battleState.playerMp / battleState.playerMaxMp) * 100} 
                className="w-32 h-2"
              />
              <span className="ml-2 text-xs">{battleState.playerMp}/{battleState.playerMaxMp}</span>
            </div>
          </div>
          
          <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center">
            <Sword className="w-12 h-12" />
          </div>
        </div>

        {/* Touch Battle Area */}
        {battleState.battlePhase === 'combat' && (
          <div 
            ref={battleAreaRef}
            className="absolute inset-0 bg-transparent"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            <div className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-center text-gray-400">
              <div className="text-sm mb-2">Tap to Attack • Swipe Up to Punch</div>
              <div className="text-xs">Swipe Left/Right during combos</div>
            </div>
          </div>
        )}

        {/* Rage Meter */}
        <div className="absolute bottom-8 right-8">
          <div className="text-center mb-2">
            <div className="text-xs text-gray-400">RAGE</div>
            <div className="w-16 h-32 bg-gray-800 border-2 border-red-400 rounded-lg overflow-hidden">
              <div 
                className="bg-gradient-to-t from-red-600 to-red-400 transition-all duration-300"
                style={{ height: `${battleState.playerRage}%` }}
              />
            </div>
            <div className="text-xs mt-1">{battleState.playerRage}/100</div>
          </div>
          
          {battleState.playerRage >= 100 && (
            <div className="absolute inset-0 animate-pulse">
              <Sparkles className="w-6 h-6 text-yellow-400 mx-auto" />
            </div>
          )}
        </div>
      </div>

      {/* Heroes Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4">
        <div className="flex justify-center space-x-4">
          {heroes.map((hero, index) => (
            <div key={hero.id} className="text-center">
              <Button
                variant="outline"
                size="sm"
                className={`mb-2 ${getRarityColor(hero.rarity)}`}
                onClick={() => handleHeroAbility(index)}
                disabled={battleState.actionsRemaining <= 0 || battleState.battlePhase !== 'combat'}
              >
                <Star className="w-4 h-4 mr-1" />
                {hero.name}
              </Button>
              
              {battleState.playerRage >= 100 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-red-500/20 border-red-400 text-red-400"
                  onClick={() => handleHeroAbility(index, true)}
                  disabled={battleState.actionsRemaining <= 0 || battleState.battlePhase !== 'combat'}
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Ultimate
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Feedback */}
      {battleState.lastAction && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 px-4 py-2 rounded-lg">
          <div className="text-center text-white">{battleState.lastAction}</div>
        </div>
      )}

      {/* Battle Start/End Overlays */}
      {battleState.battlePhase === 'preparation' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Battle Start!</h2>
              <p className="text-gray-400 mb-6">Face the {enemy.name} in combat!</p>
              <Button onClick={startBattle} className="bg-blue-600 hover:bg-blue-700">
                <Sword className="w-4 h-4 mr-2" />
                Begin Battle
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {battleState.battlePhase === 'victory' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <Card className="bg-green-900 border-green-700">
            <CardContent className="text-center p-8">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-400 mb-4">Victory!</h2>
              <p className="text-gray-300">You defeated the {enemy.name}!</p>
            </CardContent>
          </Card>
        </div>
      )}

      {battleState.battlePhase === 'defeat' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <Card className="bg-red-900 border-red-700">
            <CardContent className="text-center p-8">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Defeat</h2>
              <p className="text-gray-300">The {enemy.name} was too strong...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}