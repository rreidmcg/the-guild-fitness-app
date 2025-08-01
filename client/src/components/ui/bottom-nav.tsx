import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./button";
import { Dumbbell, BarChart3, Sword, ShoppingBag, Trophy, Lock } from "lucide-react";
import { useNavigate } from "@/hooks/use-navigate";

export function BottomNav() {
  const [location] = useLocation();
  const navigate = useNavigate();

  // Get user data to check battle access
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
  });

  // Check if user has battle access (Zero or Rob with G.M. title)
  const hasBattleAccess = userStats?.username === 'Zero' || userStats?.currentTitle === '<G.M.>';

  const navItems = [
    { path: "/", label: "Stats", icon: BarChart3, locked: false },
    { path: "/quests", label: "Quests", icon: Dumbbell, locked: false },
    { path: "/battle", label: "Battle", icon: Sword, locked: !hasBattleAccess },
    { path: "/shop", label: "Shop", icon: ShoppingBag, locked: false },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy, locked: false },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border px-4 py-2 z-50 bg-card" style={{ opacity: '1 !important' }}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            const isLocked = item.locked;
            
            return (
              <div key={item.path} className="relative flex-1 max-w-[80px]">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (isLocked) {
                      alert("You Do Not Have Access To This Feature");
                      return;
                    }
                    navigate(item.path);
                  }}
                  className={`justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-14 flex flex-col items-center justify-center space-y-1 px-2 py-2 w-full ${
                    isLocked
                      ? 'text-muted-foreground/50 cursor-not-allowed opacity-50'
                      : isActive 
                        ? 'text-blue-400 bg-blue-900/20 border border-blue-700' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive && !isLocked ? 'text-blue-400' : ''}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Lock className="w-4 h-4 text-muted-foreground/70" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}