import { useState, useEffect } from "react";
import { hpRegenService } from "@/services/hp-regen-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface HpRegenState {
  hp: number;
  maxHp: number;
  lastRegenMs: number;
}

export function HpRegenDebug() {
  const [regenState, setRegenState] = useState<HpRegenState>({
    hp: 0,
    maxHp: 0,
    lastRegenMs: Date.now()
  });
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);

  useEffect(() => {
    // Subscribe to HP regeneration updates
    const unsubscribe = hpRegenService.subscribe(setRegenState);
    
    // Get initial state
    setRegenState(hpRegenService.getState());
    
    return unsubscribe;
  }, []);

  const toggleDebug = () => {
    const newState = !isDebugEnabled;
    setIsDebugEnabled(newState);
    (window as any).__DEBUG_REGEN__ = newState;
  };

  const forceRegen = () => {
    hpRegenService.forceRegen();
  };

  const simulateHP = (hp: number, maxHp: number) => {
    hpRegenService.updatePlayerState(hp, maxHp);
  };

  const hpPercentage = regenState.maxHp > 0 ? (regenState.hp / regenState.maxHp) * 100 : 0;
  const timeSinceLastRegen = Math.floor((Date.now() - regenState.lastRegenMs) / 1000);

  return (
    <Card className="w-full max-w-md bg-slate-800 border-blue-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-300 text-lg flex items-center justify-between">
          HP Regeneration Debug
          <Button
            onClick={toggleDebug}
            variant={isDebugEnabled ? "secondary" : "outline"}
            size="sm"
          >
            {isDebugEnabled ? "Debug ON" : "Debug OFF"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* HP Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-300">Health Points</span>
            <Badge variant="outline" className="text-green-400 border-green-400/50">
              {Math.floor(regenState.hp)}/{regenState.maxHp}
            </Badge>
          </div>
          <Progress value={hpPercentage} className="h-2" />
        </div>

        {/* Status Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-700/50 p-2 rounded">
            <div className="text-gray-400">Last Regen</div>
            <div className="text-white font-mono">{timeSinceLastRegen}s ago</div>
          </div>
          <div className="bg-slate-700/50 p-2 rounded">
            <div className="text-gray-400">On Dungeon</div>
            <div className="text-white font-mono">
              {window.location.pathname.includes('dungeon') ? "YES" : "NO"}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-300">Test Controls</div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => simulateHP(10, 22)}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              10/22 HP
            </Button>
            <Button
              onClick={() => simulateHP(15, 22)}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              15/22 HP
            </Button>
            <Button
              onClick={() => simulateHP(22, 22)}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Full HP
            </Button>
          </div>
          <Button
            onClick={forceRegen}
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Force Regeneration Tick
          </Button>
        </div>

        {/* Info Text */}
        <div className="text-xs text-gray-400 bg-slate-700/30 p-2 rounded">
          Regenerates 1% max HP per minute when not on dungeon pages. 
          Enable debug to see console logs.
        </div>
      </CardContent>
    </Card>
  );
}