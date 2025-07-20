import { useLocation } from "wouter";
import { Button } from "./button";
import { Dumbbell, BarChart3, Sword, ShoppingBag, User } from "lucide-react";

export function BottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", label: "Stats", icon: BarChart3 },
    { path: "/workouts", label: "Workouts", icon: Dumbbell },
    { path: "/battle", label: "Battle", icon: Sword },
    { path: "/shop", label: "Shop", icon: ShoppingBag },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border px-4 py-2 z-50 bg-card" style={{ opacity: '1 !important' }}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => setLocation(item.path)}
                className={`flex flex-col items-center space-y-1 py-3 px-4 min-w-0 ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}