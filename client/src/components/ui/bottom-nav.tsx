import { useLocation } from "wouter";
import { Button } from "./button";
import { Dumbbell, BarChart3, Sword, ShoppingBag, Trophy } from "lucide-react";
import { useNavigate } from "@/hooks/use-navigate";

export function BottomNav() {
  const [location] = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", label: "Stats", icon: BarChart3 },
    { path: "/workouts", label: "Quests", icon: Dumbbell },
    { path: "/battle", label: "Battle", icon: Sword },
    { path: "/shop", label: "Shop", icon: ShoppingBag },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-amber-600/50 px-4 py-2 z-50 bg-gradient-to-r from-amber-900/95 via-orange-800/95 to-yellow-900/95 backdrop-blur-sm shadow-lg" style={{ opacity: '1 !important' }}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={`justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-amber-700/30 hover:text-amber-100 h-14 flex flex-col items-center justify-center space-y-1 px-2 py-2 flex-1 max-w-[80px] ${
                  isActive 
                    ? 'text-yellow-300 bg-amber-700/40 border border-yellow-500/50 shadow-lg' 
                    : 'text-amber-200 hover:text-yellow-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-300' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}