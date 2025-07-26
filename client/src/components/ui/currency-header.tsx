import { useQuery } from "@tanstack/react-query";
import { Coins, Backpack, Settings, Volume2, VolumeX, Flame, Shield } from "lucide-react";
import { useNavigate } from "@/hooks/use-navigate";
import { useBackgroundMusic } from "@/contexts/background-music-context";

export function CurrencyHeader() {
  const navigate = useNavigate();
  const { toggleMusic, isPlaying, isMuted } = useBackgroundMusic();
  
  const handleMusicToggle = () => {
    console.log('Speaker button clicked, current state:', { isPlaying, isMuted });
    toggleMusic();
  };
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });



  return (
    <div className="bg-card/80 border-b border-border/50 px-4 py-1.5">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={handleMusicToggle}
              className="flex items-center hover:bg-muted/50 px-2 py-0.5 rounded transition-colors"
              title="Toggle Music"
            >
              {isMuted || !isPlaying ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-semibold text-foreground text-sm">{(userStats as any)?.currentStreak || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-foreground text-sm">{(userStats as any)?.streakFreezeCount || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Coins className="w-3.5 h-3.5 text-yellow-500" />
              <span className="font-semibold text-foreground text-sm">{(userStats as any)?.gold || 0}</span>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="flex items-center hover:bg-muted/50 px-2 py-0.5 rounded transition-colors"
              title="Inventory"
            >
              <Backpack className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center hover:bg-muted/50 px-2 py-0.5 rounded transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}