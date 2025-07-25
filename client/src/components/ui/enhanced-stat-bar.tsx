import { Progress } from "@/components/ui/progress";

interface StatProgress {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  totalXpForCurrentLevel: number;
}

interface EnhancedStatBarProps {
  label: string;
  statLevel: number;
  totalXp: number;
  color: string;
  icon: React.ReactNode;
}

// Calculate XP required for a specific stat level
function getStatXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(Math.pow(level - 1, 2) * 100);
}

// Calculate stat level from total XP
function calculateStatLevel(totalXp: number): number {
  if (totalXp < 0) return 0;
  
  let level = 1;
  let xpRequired = 0;
  
  while (xpRequired <= totalXp) {
    level++;
    xpRequired = getStatXpRequiredForLevel(level);
  }
  
  return level - 1;
}

// Get detailed stat progression info
function getStatProgress(totalXp: number): StatProgress {
  const currentLevel = calculateStatLevel(totalXp);
  const xpForCurrentLevel = getStatXpRequiredForLevel(currentLevel);
  const xpForNextLevel = getStatXpRequiredForLevel(currentLevel + 1);
  
  return {
    level: currentLevel,
    currentXp: totalXp - xpForCurrentLevel,
    xpToNextLevel: xpForNextLevel - totalXp,
    totalXpForCurrentLevel: xpForNextLevel - xpForCurrentLevel
  };
}

export function EnhancedStatBar({ label, statLevel, totalXp, color, icon }: EnhancedStatBarProps) {
  const progress = getStatProgress(totalXp);
  const progressPercentage = progress.totalXpForCurrentLevel > 0 
    ? (progress.currentXp / progress.totalXpForCurrentLevel) * 100 
    : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`${color}`}>
            {icon}
          </div>
          <span className="font-semibold text-foreground">{label}</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-foreground">Lv.{progress.level}</div>
          <div className="text-xs text-muted-foreground">
            {progress.currentXp.toLocaleString()} / {(progress.currentXp + progress.xpToNextLevel).toLocaleString()} XP
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={progressPercentage} 
          className="h-3"
          style={{
            backgroundColor: 'hsl(var(--muted))',
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress.currentXp.toLocaleString()} XP</span>
          <span>{progress.xpToNextLevel.toLocaleString()} to next level</span>
        </div>
      </div>
    </div>
  );
}