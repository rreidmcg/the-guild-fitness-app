import { useQuery } from "@tanstack/react-query";
import { Coins, Backpack, Settings, Volume2 } from "lucide-react";
import { useNavigate } from "@/hooks/use-navigate";
import { useBackgroundMusic } from "@/hooks/use-background-music";

export function CurrencyHeader() {
  const navigate = useNavigate();
  const { toggleMusic } = useBackgroundMusic();
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });



  return (
    <div className="bg-card/80 border-b border-border/50 px-4 py-1.5">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={toggleMusic}
              className="flex items-center hover:bg-muted/50 px-2 py-0.5 rounded transition-colors"
              title="Toggle Music"
            >
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center space-x-3">
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