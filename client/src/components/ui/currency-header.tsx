import { useQuery } from "@tanstack/react-query";
import { Coins, Zap, Package } from "lucide-react";
import { useNavigate } from "@/hooks/use-navigate";

export function CurrencyHeader() {
  const navigate = useNavigate();
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const potionCount = (inventory as any[])?.filter((item: any) => item.itemType === "potion").length || 0;

  return (
    <div className="bg-card/50 border-b border-border/50 px-4 py-2">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-foreground text-sm">{(userStats as any)?.gold || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-foreground text-sm">{(userStats as any)?.experience || 0} XP</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-foreground text-sm">Lv {(userStats as any)?.level || 1}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/inventory')}
              className="flex items-center space-x-2 hover:bg-muted/50 px-2 py-1 rounded transition-colors"
            >
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{potionCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}