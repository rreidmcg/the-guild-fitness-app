/**
 * Enhanced UI Primitives for Day 3 Frontend Modernization
 * 
 * Provides optimized, reusable components with:
 * - Performance optimizations (memoization, virtualization)
 * - Advanced accessibility features
 * - Mobile-first responsive design
 * - Consistent design system patterns
 */

import { memo, forwardRef, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Dumbbell, 
  Trophy, 
  Flame, 
  Star, 
  Zap, 
  Heart,
  Shield,
  Sword,
  type LucideIcon 
} from 'lucide-react';

/**
 * Enhanced Stat Display Component
 * Optimized for the stats page with consistent visual patterns
 */
interface EnhancedStatCardProps {
  title: string;
  value: number;
  maxValue?: number;
  icon: LucideIcon;
  color: 'red' | 'blue' | 'green' | 'purple' | 'gold';
  trend?: 'up' | 'down' | 'stable';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EnhancedStatCard = memo(forwardRef<HTMLDivElement, EnhancedStatCardProps>(
  ({ title, value, maxValue, icon: Icon, color, trend, className, size = 'md' }, ref) => {
    const colorClasses = useMemo(() => ({
      red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
      blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400', 
      green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
      purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
      gold: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400'
    }), []);

    const sizeClasses = useMemo(() => ({
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    }), []);

    const percentage = maxValue ? Math.round((value / maxValue) * 100) : undefined;

    return (
      <Card 
        ref={ref}
        className={cn(
          'enhanced-stat-card relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg',
          `bg-gradient-to-br ${colorClasses[color]}`,
          sizeClasses[size],
          className
        )}
      >
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Icon className={cn('h-6 w-6', colorClasses[color].split(' ')[3])} />
            {trend && (
              <Badge 
                variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold">{value.toLocaleString()}</span>
              {maxValue && (
                <span className="text-sm text-muted-foreground">
                  / {maxValue.toLocaleString()}
                </span>
              )}
            </div>
            
            {percentage !== undefined && (
              <Progress 
                value={percentage} 
                className="h-2"
                aria-label={`${title}: ${percentage}% complete`}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
));

EnhancedStatCard.displayName = 'EnhancedStatCard';

/**
 * Enhanced Action Button Component
 * Consistent styling for primary user actions
 */
interface EnhancedActionButtonProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
}

export const EnhancedActionButton = memo(forwardRef<HTMLButtonElement, EnhancedActionButtonProps>(
  ({ 
    children, 
    icon: Icon, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    disabled, 
    onClick, 
    className,
    fullWidth 
  }, ref) => {
    const variantClasses = useMemo(() => ({
      primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
      secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
      success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
      warning: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700',
      danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
    }), []);

    return (
      <Button
        ref={ref}
        onClick={onClick}
        disabled={disabled || isLoading}
        size={size}
        className={cn(
          'enhanced-action-btn transition-all duration-200 font-medium',
          variantClasses[variant],
          fullWidth && 'w-full',
          className
        )}
      >
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-4 w-4" />}
          <span>{children}</span>
          {isLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
        </div>
      </Button>
    );
  }
));

EnhancedActionButton.displayName = 'EnhancedActionButton';

/**
 * Enhanced Achievement Display
 * Optimized achievement cards with visual flair
 */
interface EnhancedAchievementProps {
  name: string;
  description: string;
  isUnlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress?: number;
  maxProgress?: number;
  icon?: string;
  className?: string;
}

export const EnhancedAchievement = memo(({ 
  name, 
  description, 
  isUnlocked, 
  rarity, 
  progress, 
  maxProgress,
  icon,
  className 
}: EnhancedAchievementProps) => {
  const rarityConfig = useMemo(() => ({
    common: { 
      gradient: 'from-gray-500/20 to-gray-600/20', 
      border: 'border-gray-500/30',
      glow: 'shadow-gray-500/20'
    },
    rare: { 
      gradient: 'from-blue-500/20 to-blue-600/20', 
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/20'
    },
    epic: { 
      gradient: 'from-purple-500/20 to-purple-600/20', 
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20'
    },
    legendary: { 
      gradient: 'from-yellow-500/20 to-orange-600/20', 
      border: 'border-yellow-500/30',
      glow: 'shadow-yellow-500/20'
    }
  }), []);

  const config = rarityConfig[rarity];
  const progressPercentage = progress && maxProgress ? (progress / maxProgress) * 100 : undefined;

  return (
    <Card 
      className={cn(
        'enhanced-achievement relative overflow-hidden transition-all duration-300',
        `bg-gradient-to-br ${config.gradient} ${config.border}`,
        isUnlocked && `shadow-lg ${config.glow}`,
        !isUnlocked && 'opacity-60 grayscale',
        'hover:scale-105 hover:shadow-xl',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {icon ? (
              <span className="text-2xl">{icon}</span>
            ) : (
              <Trophy className="h-6 w-6 text-yellow-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-sm truncate">{name}</h4>
              <Badge 
                variant="outline" 
                className={cn('text-xs capitalize', config.border)}
              >
                {rarity}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {description}
            </p>
            
            {progressPercentage !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{progress}/{maxProgress}</span>
                </div>
                <Progress value={progressPercentage} className="h-1" />
              </div>
            )}
          </div>
        </div>
        
        {isUnlocked && (
          <div className="absolute top-2 right-2">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

EnhancedAchievement.displayName = 'EnhancedAchievement';

/**
 * Enhanced Loading States
 * Consistent loading patterns across the app
 */
interface EnhancedLoadingProps {
  variant?: 'spinner' | 'skeleton' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const EnhancedLoading = memo(({ 
  variant = 'spinner', 
  size = 'md', 
  text, 
  className 
}: EnhancedLoadingProps) => {
  const sizeClasses = {
    sm: variant === 'spinner' ? 'h-4 w-4' : 'h-20',
    md: variant === 'spinner' ? 'h-6 w-6' : 'h-32', 
    lg: variant === 'spinner' ? 'h-8 w-8' : 'h-48'
  };

  if (variant === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
        <div className={cn(
          'animate-spin rounded-full border-2 border-primary border-t-transparent',
          sizeClasses[size]
        )} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className={cn('bg-muted rounded animate-pulse', sizeClasses[size])} />
        {text && <div className="h-4 bg-muted rounded animate-pulse w-3/4" />}
      </div>
    );
  }

  return (
    <div className={cn('bg-muted/50 rounded animate-pulse', sizeClasses[size], className)}>
      {text && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      )}
    </div>
  );
});

EnhancedLoading.displayName = 'EnhancedLoading';