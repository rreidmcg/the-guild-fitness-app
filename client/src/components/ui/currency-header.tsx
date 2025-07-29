import { useQuery } from "@tanstack/react-query";
import { Coins, Backpack, Settings, Volume2, VolumeX, Flame, Snowflake, Mail, TrendingUp } from "lucide-react";
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

  // Fetch mail to check for unread count  
  const { data: mail } = useQuery({
    queryKey: ["/api/mail"],
  });



  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-900/95 via-orange-800/95 to-yellow-900/95 backdrop-blur-sm border-b border-amber-600/50 px-2 sm:px-4 py-1.5 z-40 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={handleMusicToggle}
              className="flex items-center hover:bg-amber-700/50 px-1.5 py-0.5 rounded transition-colors"
              title="Toggle Music"
            >
              {isMuted || !isPlaying ? (
                <VolumeX className="w-4 h-4 text-amber-200" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-200" />
              )}
            </button>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            {(userStats as any)?.currentStreak >= 3 && (
              <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-purple-900/30 rounded border border-purple-600">
                <TrendingUp className="w-3 h-3 text-purple-400" />
                <span className="text-purple-300 text-xs font-semibold">1.5x XP</span>
              </div>
            )}
            <div className="flex items-center space-x-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-300" />
              <span className="font-semibold text-amber-100 text-sm">{(userStats as any)?.currentStreak || 0}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Snowflake className="w-3.5 h-3.5 text-blue-300" />
              <span className="font-semibold text-amber-100 text-sm">{(userStats as any)?.streakFreezeCount || 0}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Coins className="w-3.5 h-3.5 text-yellow-300" />
              <span className="font-semibold text-amber-100 text-sm">{(userStats as any)?.gold || 0}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-blue-300 text-sm">💎</span>
              <span className="font-semibold text-amber-100 text-sm">{(userStats as any)?.gems || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigate('/inventory')}
                className="flex items-center hover:bg-amber-700/50 px-1.5 py-0.5 rounded transition-colors"
                title="Inventory"
              >
                <Backpack className="w-4 h-4 text-amber-200" />
              </button>
              <button
                onClick={() => navigate('/mail')}
                className="flex items-center hover:bg-amber-700/50 px-1.5 py-0.5 rounded transition-colors relative"
                title="Mail"
              >
                <Mail className="w-4 h-4 text-amber-200" />
                {Array.isArray(mail) && mail.filter((m: any) => !m.isRead).length > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                )}
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center hover:bg-amber-700/50 px-1.5 py-0.5 rounded transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-amber-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}