import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BattleState {
  enemyMaxHp: number;
  enemyCurrentHp: number;
  enemyName: string;
  enemyLevel: number;
  combo: number;
  speedStacks: number;
  speedBonusActive: boolean;
  lastAttackTime: number;
  battleResult: 'ongoing' | 'victory' | 'defeat';
  goldEarned: number;
  battleLog: string[];
}

interface DamageFloat {
  id: string;
  value: number;
  type: 'normal' | 'crit' | 'block';
  timestamp: number;
}

interface EnhancedBattleSystemProps {
  monsterId?: string;
  onBattleComplete?: (result: any) => void;
}

export function EnhancedBattleSystem({ monsterId, onBattleComplete }: EnhancedBattleSystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Battle state
  const [battleState, setBattleState] = useState<BattleState>({
    enemyMaxHp: 350,
    enemyCurrentHp: 350,
    enemyName: "Training Dummy",
    enemyLevel: 1,
    combo: 0,
    speedStacks: 0,
    speedBonusActive: false,
    lastAttackTime: 0,
    battleResult: 'ongoing',
    goldEarned: 0,
    battleLog: []
  });

  // Visual effects state
  const [damageFloats, setDamageFloats] = useState<DamageFloat[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [dustEffects, setDustEffects] = useState<Array<{ id: string; timestamp: number }>>([]);

  // Constants
  const COMBO_CAP = 5;
  const QUICK_WINDOW_MS = 700;
  const SPEED_MAX_STACKS = 3;
  const SPEED_PCT_PER_STACK = 0.1;

  // Battle attack mutation
  const battleAttackMutation = useMutation({
    mutationFn: async (attackData: any) => {
      return await apiRequest("/api/battle/attack", {
        method: "POST",
        body: attackData,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      if (result.battleResult === 'victory' || result.battleResult === 'defeat') {
        if (onBattleComplete) onBattleComplete(result);
      }
    },
    onError: (error) => {
      toast({
        title: "Battle Error",
        description: "Failed to execute attack",
        variant: "destructive",
      });
    },
  });

  // Reset battle state
  const resetBattle = useCallback(() => {
    setBattleState(prev => ({
      ...prev,
      enemyCurrentHp: prev.enemyMaxHp,
      combo: 0,
      speedStacks: 0,
      speedBonusActive: false,
      battleResult: 'ongoing',
      goldEarned: 0,
      battleLog: []
    }));
    setDamageFloats([]);
  }, []);

  // Calculate damage with all bonuses
  const calculateDamage = useCallback((baseDamage: number, isFast: boolean) => {
    const speedMultiplier = 1 + (battleState.speedStacks * SPEED_PCT_PER_STACK);
    const comboMultiplier = 1 + (battleState.combo * 0.2); // +20% per combo point
    const fastBonus = isFast ? 1.1 : 1.0; // Quick tap bonus
    return Math.round(baseDamage * speedMultiplier * comboMultiplier * fastBonus);
  }, [battleState.speedStacks, battleState.combo]);

  // Add damage float animation
  const addDamageFloat = useCallback((value: number, type: 'normal' | 'crit' | 'block' = 'normal') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newFloat: DamageFloat = {
      id,
      value,
      type,
      timestamp: Date.now()
    };
    
    setDamageFloats(prev => [...prev, newFloat]);
    
    // Remove after animation
    setTimeout(() => {
      setDamageFloats(prev => prev.filter(f => f.id !== id));
    }, 850);
  }, []);

  // Trigger visual effects
  const triggerHitFlash = useCallback((delayMs: number = 0) => {
    setTimeout(() => {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 120);
    }, delayMs);
  }, []);

  const triggerPushback = useCallback(() => {
    setIsPushing(true);
    setTimeout(() => setIsPushing(false), 220);
    
    // Add dust effects
    for (let i = 0; i < 3; i++) {
      const dustId = Math.random().toString(36).substr(2, 9);
      setDustEffects(prev => [...prev, { id: dustId, timestamp: Date.now() }]);
      setTimeout(() => {
        setDustEffects(prev => prev.filter(d => d.id !== dustId));
      }, 420);
    }
  }, []);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 250);
  }, []);

  // Execute attack with full visual effects
  const executeAttack = useCallback(({ 
    baseDamage = 20, 
    windupMs = 120, 
    buildsCombo = true 
  }) => {
    const now = Date.now();
    const isFast = (now - battleState.lastAttackTime) <= QUICK_WINDOW_MS;
    
    setBattleState(prev => {
      let newSpeedStacks = prev.speedStacks;
      let newSpeedBonusActive = prev.speedBonusActive;
      
      // Manage speed stacks
      if (isFast) {
        newSpeedStacks = Math.min(SPEED_MAX_STACKS, prev.speedStacks + 1);
        newSpeedBonusActive = true;
      } else {
        newSpeedStacks = 0;
        newSpeedBonusActive = false;
      }

      // Build combo
      const newCombo = buildsCombo ? Math.min(COMBO_CAP, prev.combo + 1) : prev.combo;
      
      return {
        ...prev,
        combo: newCombo,
        speedStacks: newSpeedStacks,
        speedBonusActive: newSpeedBonusActive,
        lastAttackTime: now
      };
    });

    // Trigger windup, then impact effects
    triggerHitFlash(windupMs);
    
    setTimeout(() => {
      const damage = calculateDamage(baseDamage, isFast);
      
      setBattleState(prev => {
        const newHp = Math.max(0, prev.enemyCurrentHp - damage);
        const newBattleLog = [...prev.battleLog, `You deal ${damage} damage to ${prev.enemyName}!`];
        
        return {
          ...prev,
          enemyCurrentHp: newHp,
          battleLog: newBattleLog,
          battleResult: newHp <= 0 ? 'victory' : 'ongoing'
        };
      });
      
      addDamageFloat(damage);
      triggerPushback();
      triggerShake();
      
      // Check if enemy is defeated
      if (battleState.enemyCurrentHp - damage <= 0) {
        setTimeout(() => {
          toast({
            title: "Victory!",
            description: `${battleState.enemyName} has been defeated!`,
          });
          // Auto-reset for demo purposes
          setTimeout(resetBattle, 600);
        }, 300);
      }
    }, windupMs);
  }, [battleState, calculateDamage, addDamageFloat, triggerHitFlash, triggerPushback, triggerShake, toast, resetBattle]);

  // Attack handlers
  const handleQuickAttack = useCallback(() => {
    executeAttack({ baseDamage: 16, windupMs: 90, buildsCombo: true });
  }, [executeAttack]);

  const handleHeavyAttack = useCallback(() => {
    executeAttack({ baseDamage: 28, windupMs: 180, buildsCombo: true });
  }, [executeAttack]);

  const handleFinisher = useCallback(() => {
    const baseDamage = 24 + battleState.combo * 12; // Scales with combo
    const windupMs = 160;
    
    triggerHitFlash(windupMs);
    
    setTimeout(() => {
      const now = Date.now();
      const isFast = (now - battleState.lastAttackTime) <= QUICK_WINDOW_MS;
      const damage = calculateDamage(baseDamage, isFast);
      
      setBattleState(prev => {
        const newHp = Math.max(0, prev.enemyCurrentHp - damage);
        let newSpeedStacks = prev.speedStacks;
        let newSpeedBonusActive = prev.speedBonusActive;
        
        if (isFast) {
          newSpeedStacks = Math.min(SPEED_MAX_STACKS, prev.speedStacks + 1);
          newSpeedBonusActive = true;
        } else {
          newSpeedStacks = 0;
          newSpeedBonusActive = false;
        }
        
        return {
          ...prev,
          enemyCurrentHp: newHp,
          combo: 0, // Finisher consumes combo
          speedStacks: newSpeedStacks,
          speedBonusActive: newSpeedBonusActive,
          lastAttackTime: now,
          battleLog: [...prev.battleLog, `Finisher deals ${damage} damage!`],
          battleResult: newHp <= 0 ? 'victory' : 'ongoing'
        };
      });
      
      addDamageFloat(damage, 'crit');
      triggerPushback();
      triggerShake();
      
      if (battleState.enemyCurrentHp - damage <= 0) {
        setTimeout(() => {
          toast({
            title: "Victory!",
            description: `${battleState.enemyName} has been defeated!`,
          });
          setTimeout(resetBattle, 600);
        }, 300);
      }
    }, windupMs);
  }, [battleState, calculateDamage, addDamageFloat, triggerHitFlash, triggerPushback, triggerShake, toast, resetBattle]);

  // Render combo pips
  const renderComboPips = () => {
    return Array.from({ length: COMBO_CAP }, (_, i) => (
      <div
        key={i}
        className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
          i < battleState.combo 
            ? 'bg-yellow-400 border-yellow-400 shadow-lg' 
            : 'bg-transparent border-gray-500'
        }`}
      />
    ));
  };

  const hpPercentage = (battleState.enemyCurrentHp / battleState.enemyMaxHp) * 100;

  return (
    <div className="space-y-6">
      {/* Battle Arena */}
      <div className="relative h-56 bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {/* Floor */}
        <div className="absolute left-0 right-0 bottom-0 h-16 bg-gradient-radial from-gray-700 to-gray-800 opacity-50" />
        
        {/* Enemy HP Bar */}
        <div className="absolute left-1/2 top-4 transform -translate-x-1/2 w-64 h-3 bg-gray-700 border border-gray-600 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              hpPercentage > 50 ? 'bg-green-500' : 
              hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
        
        {/* Enemy */}
        <div 
          className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-36 flex items-center justify-center transition-all duration-100 ${
            isPushing ? 'animate-[push-back_0.22s_ease-out]' : ''
          } ${
            isShaking ? 'animate-[shake_0.25s_linear]' : ''
          }`}
        >
          <div 
            className={`relative w-32 h-32 bg-gray-600 border-2 border-gray-500 rounded-lg shadow-inner transition-all duration-100 ${
              isFlashing ? 'brightness-200' : 'brightness-100'
            }`}
          >
            {/* Enemy Body Content */}
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
              {battleState.enemyName}
            </div>
          </div>
          
          {/* Damage Floats */}
          {damageFloats.map((dmgFloat) => (
            <div
              key={dmgFloat.id}
              className={`absolute left-1/2 top-5 transform -translate-x-1/2 font-bold text-lg animate-[dmg-pop_0.8s_ease-out_forwards] pointer-events-none ${
                dmgFloat.type === 'crit' ? 'text-red-400' :
                dmgFloat.type === 'block' ? 'text-blue-400' : 'text-yellow-400'
              }`}
              style={{ textShadow: '0 1px 0 rgba(0,0,0,0.8)' }}
            >
              {dmgFloat.type === 'block' ? 'BLOCK' : 
               dmgFloat.type === 'crit' ? `CRIT ${dmgFloat.value}` : 
               `-${dmgFloat.value}`}
            </div>
          ))}
          
          {/* Dust Effects */}
          {dustEffects.map((dust) => (
            <div
              key={dust.id}
              className="absolute bottom-3 right-0 w-2 h-2 bg-gray-400 rounded-full opacity-25 blur-sm animate-[dust-pop_0.4s_ease-out_forwards]"
            />
          ))}
        </div>
      </div>

      {/* Combo Display */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {renderComboPips()}
        </div>
        <span className="text-yellow-400 font-bold">
          Combo: {battleState.combo}
        </span>
        {battleState.speedBonusActive && (
          <span className="text-yellow-300 text-sm animate-pulse">
            Speed bonus!
          </span>
        )}
      </div>

      {/* Battle Controls */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          onClick={handleQuickAttack}
          disabled={battleState.battleResult !== 'ongoing'}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Quick Attack
        </Button>
        <Button 
          onClick={handleHeavyAttack}
          disabled={battleState.battleResult !== 'ongoing'}
          variant="outline"
        >
          Heavy Attack
        </Button>
        <Button 
          onClick={handleFinisher}
          disabled={battleState.battleResult !== 'ongoing' || battleState.combo === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Finisher
        </Button>
      </div>

      {/* Battle Instructions */}
      <div className="text-sm text-muted-foreground">
        Hit Quick repeatedly (≤700ms apart) to build combo & speed bonus.
      </div>

      {/* Battle Log */}
      {battleState.battleLog.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
          {battleState.battleLog.slice(-5).map((log, index) => (
            <div key={index} className="text-sm text-gray-300">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// CSS for animations (to be added to global styles)
const battleAnimations = `
@keyframes rise-fade {
  0% { opacity: 0; transform: translate(-50%, 8px); }
  10% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -24px); }
}

@keyframes hit-flash {
  0% { filter: brightness(1.0); }
  50% { filter: brightness(2.0); }
  100% { filter: brightness(1.0); }
}

@keyframes push-back {
  0% { transform: translate(-50%, -50%); }
  50% { transform: translate(calc(-50% - 16px), -50%); }
  100% { transform: translate(-50%, -50%); }
}

@keyframes dmg-pop {
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.8); }
  15% { opacity: 1; transform: translate(-50%, -6px) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -28px) scale(1); }
}

@keyframes dust-pop {
  0% { opacity: 0; transform: translate(0, 0) scale(0.6); }
  60% { opacity: 0.9; transform: translate(10px, -6px) scale(1.2); }
  100% { opacity: 0; transform: translate(18px, -10px) scale(1.4); }
}

@keyframes shake {
  0%, 100% { transform: translate(-50%, -50%); }
  20% { transform: translate(calc(-50% - 6px), -50%); }
  40% { transform: translate(calc(-50% + 6px), -50%); }
  60% { transform: translate(calc(-50% - 4px), -50%); }
  80% { transform: translate(calc(-50% + 4px), -50%); }
}
`;