import React, { useState } from 'react';
import { Avatar2D } from './avatar-2d';
import { Avatar3D } from './avatar-3d';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Eye, User, Box } from 'lucide-react';

interface AvatarSelectorProps {
  user?: any;
  playerStats?: any;
  size?: number | "sm" | "md" | "lg";
  className?: string;
  showToggle?: boolean;
  defaultMode?: '2d' | '3d';
  interactive?: boolean;
  showStats?: boolean;
  animationState?: 'idle' | 'victory' | 'attack' | 'level_up';
}

export function AvatarSelector({ 
  user, 
  playerStats, 
  size = "md", 
  className = "",
  showToggle = true,
  defaultMode = '2d',
  interactive = false,
  showStats = false,
  animationState = 'idle'
}: AvatarSelectorProps) {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>(defaultMode);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleModeChange = (newMode: '2d' | '3d') => {
    if (newMode === viewMode || isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setViewMode(newMode);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <div className={`relative ${className}`}>
      <Card className="avatar-selector bg-gray-900 border-gray-700">
        <CardContent className="p-0">
          <div className={`transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {viewMode === '2d' ? (
              <Avatar2D 
                user={user}
                playerStats={playerStats}
                size={size}
                className="w-full h-full"
              />
            ) : (
              <Avatar3D 
                user={user}
                playerStats={playerStats}
                size={size}
                className="w-full h-full"
                interactive={interactive}
                showStats={showStats}
                animationState={animationState}
              />
            )}
          </div>

          {showToggle && (
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button
                variant={viewMode === '2d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('2d')}
                className="h-8 w-8 p-0"
                title="2D Avatar"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === '3d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('3d')}
                className="h-8 w-8 p-0"
                title="3D Avatar"
              >
                <Box className="h-4 w-4" />
              </Button>
            </div>
          )}

          {viewMode === '3d' && (
            <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-black bg-opacity-50 px-2 py-1 rounded">
              <Eye className="inline w-3 h-3 mr-1" />
              3D View
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}