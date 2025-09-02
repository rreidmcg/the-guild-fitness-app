/**
 * Day 4: Real-time Battle System Enhancement
 * 
 * Advanced WebSocket-based battle system with:
 * - Real-time multiplayer combat mechanics
 * - Improved damage calculations and animations
 * - Battle session management
 * - Spectator mode and battle history
 */

import { memo, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Sword, 
  Shield, 
  Heart, 
  Zap, 
  Trophy, 
  Timer,
  Users,
  Eye,
  Flame
} from 'lucide-react';

interface BattleState {
  id: string;
  players: BattlePlayer[];
  currentTurn: number;
  status: 'waiting' | 'active' | 'finished';
  winner?: string;
  spectators: number;
  roundCount: number;
  maxRounds: number;
}

interface BattlePlayer {
  userId: number;
  username: string;
  level: number;
  hp: number;
  maxHp: number;
  strength: number;
  stamina: number;
  agility: number;
  isReady: boolean;
  lastAction?: BattleAction;
}

interface BattleAction {
  type: 'attack' | 'defend' | 'special' | 'item';
  power: number;
  cost: number;
  timestamp: number;
  success: boolean;
  damage?: number;
  effect?: string;
}

interface RealTimeBattleSystemProps {
  battleId?: string;
  spectatorMode?: boolean;
  className?: string;
}

export const RealTimeBattleSystem = memo(({ 
  battleId, 
  spectatorMode = false,
  className 
}: RealTimeBattleSystemProps) => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [selectedAction, setSelectedAction] = useState<BattleAction['type'] | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // User stats for battle calculations
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    staleTime: 30000,
  });

  // WebSocket connection management
  useEffect(() => {
    if (!battleId) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/battle/${battleId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    setConnectionStatus('connecting');

    ws.onopen = () => {
      setConnectionStatus('connected');
      // Join battle as player or spectator
      ws.send(JSON.stringify({
        type: spectatorMode ? 'join_spectator' : 'join_battle',
        userId: userStats?.id
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'battle_state':
          setBattleState(data.battle);
          break;
        case 'battle_action':
          setBattleLog(prev => [...prev, data.message]);
          setBattleState(data.battle);
          break;
        case 'battle_end':
          setBattleState(data.battle);
          setBattleLog(prev => [...prev, `Battle ended! Winner: ${data.winner}`]);
          break;
        case 'player_joined':
          setBattleLog(prev => [...prev, `${data.username} joined the battle`]);
          break;
        case 'error':
          setBattleLog(prev => [...prev, `Error: ${data.message}`]);
          break;
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [battleId, spectatorMode, userStats?.id]);

  // Battle actions
  const performAction = (actionType: BattleAction['type']) => {
    if (!wsRef.current || !battleState || !userStats) return;

    const action: BattleAction = {
      type: actionType,
      power: calculateActionPower(actionType, userStats),
      cost: getActionCost(actionType),
      timestamp: Date.now(),
      success: true
    };

    wsRef.current.send(JSON.stringify({
      type: 'battle_action',
      action,
      userId: userStats.id
    }));

    setSelectedAction(null);
  };

  // Battle calculation helpers
  const calculateActionPower = (actionType: BattleAction['type'], stats: any) => {
    switch (actionType) {
      case 'attack':
        return Math.floor(stats.strength * 0.8 + Math.random() * stats.strength * 0.4);
      case 'special':
        return Math.floor((stats.strength + stats.agility) * 0.6 + Math.random() * stats.stamina * 0.3);
      case 'defend':
        return Math.floor(stats.stamina * 0.5);
      default:
        return 0;
    }
  };

  const getActionCost = (actionType: BattleAction['type']) => {
    switch (actionType) {
      case 'attack': return 5;
      case 'special': return 15;
      case 'defend': return 3;
      case 'item': return 0;
      default: return 0;
    }
  };

  const currentPlayer = battleState?.players.find(p => p.userId === userStats?.id);
  const opponent = battleState?.players.find(p => p.userId !== userStats?.id);
  const isPlayerTurn = battleState?.players[battleState.currentTurn]?.userId === userStats?.id;

  if (!battleId) {
    return (
      <Card className={`real-time-battle-system ${className || ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sword className="h-5 w-5 text-red-400" />
            <span>Battle Arena</span>
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">Beta</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">No active battle session.</p>
          <Button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
            <Sword className="h-4 w-4 mr-2" />
            Find Battle
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`real-time-battle-system space-y-4 ${className || ''}`}>
      {/* Connection Status */}
      <Card className="border-blue-500/30">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' :
                connectionStatus === 'connecting' ? 'bg-yellow-400' :
                'bg-red-400'
              }`} />
              <span className="text-sm">{connectionStatus}</span>
            </div>
            {battleState && (
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{battleState.players.length}/2</span>
                </div>
                {battleState.spectators > 0 && (
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{battleState.spectators}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Timer className="h-3 w-3" />
                  <span>Round {battleState.roundCount}/{battleState.maxRounds}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {battleState && (
        <>
          {/* Battle Arena */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Player */}
            {currentPlayer && (
              <Card className={`border-blue-500/30 ${isPlayerTurn ? 'ring-2 ring-blue-400' : ''}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>{currentPlayer.username} (You)</span>
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      Level {currentPlayer.level}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Health Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center space-x-1">
                        <Heart className="h-3 w-3 text-red-400" />
                        <span>HP</span>
                      </span>
                      <span>{currentPlayer.hp}/{currentPlayer.maxHp}</span>
                    </div>
                    <Progress 
                      value={(currentPlayer.hp / currentPlayer.maxHp) * 100}
                      className="h-2 bg-red-900"
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-red-400 font-bold">{currentPlayer.strength}</div>
                      <div className="text-muted-foreground">STR</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-400 font-bold">{currentPlayer.stamina}</div>
                      <div className="text-muted-foreground">STA</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 font-bold">{currentPlayer.agility}</div>
                      <div className="text-muted-foreground">AGI</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Opponent */}
            {opponent && (
              <Card className={`border-red-500/30 ${!isPlayerTurn ? 'ring-2 ring-red-400' : ''}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>{opponent.username}</span>
                    <Badge variant="outline" className="text-red-400 border-red-400">
                      Level {opponent.level}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Health Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center space-x-1">
                        <Heart className="h-3 w-3 text-red-400" />
                        <span>HP</span>
                      </span>
                      <span>{opponent.hp}/{opponent.maxHp}</span>
                    </div>
                    <Progress 
                      value={(opponent.hp / opponent.maxHp) * 100}
                      className="h-2 bg-red-900"
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-red-400 font-bold">{opponent.strength}</div>
                      <div className="text-muted-foreground">STR</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-400 font-bold">{opponent.stamina}</div>
                      <div className="text-muted-foreground">STA</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 font-bold">{opponent.agility}</div>
                      <div className="text-muted-foreground">AGI</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Battle Actions */}
          {!spectatorMode && isPlayerTurn && battleState.status === 'active' && (
            <Card className="border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Flame className="h-4 w-4 text-yellow-400" />
                  <span>Your Turn - Choose Action</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    onClick={() => performAction('attack')}
                    disabled={!currentPlayer}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Sword className="h-4 w-4 mr-1" />
                    Attack
                  </Button>
                  
                  <Button
                    onClick={() => performAction('defend')}
                    disabled={!currentPlayer}
                    variant="outline"
                    className="border-green-500/50 hover:bg-green-500/10"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Defend
                  </Button>
                  
                  <Button
                    onClick={() => performAction('special')}
                    disabled={!currentPlayer}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Special
                  </Button>
                  
                  <Button
                    onClick={() => performAction('item')}
                    variant="outline"
                    className="border-blue-500/50 hover:bg-blue-500/10"
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Battle Log */}
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-sm">Battle Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
                {battleLog.length === 0 ? (
                  <p className="text-muted-foreground">Battle starting...</p>
                ) : (
                  battleLog.map((log, index) => (
                    <div key={index} className="text-muted-foreground">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
});

RealTimeBattleSystem.displayName = 'RealTimeBattleSystem';