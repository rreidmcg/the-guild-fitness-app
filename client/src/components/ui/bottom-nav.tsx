import { useLocation } from "wouter";
import { Button } from "./button";
import { Dumbbell, BarChart3, Settings, Sword } from "lucide-react";

export function BottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/workouts", label: "Workouts", icon: Dumbbell },
    { path: "/", label: "Stats", icon: BarChart3 },
    { path: "/battle", label: "Battle", icon: Sword },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-700 px-4 py-2 z-50 bottom-nav-solid" style={{ backgroundColor: 'hsl(215, 25%, 27%) !important', opacity: '1 !important' }}>
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
                style={!isActive ? { color: 'rgb(209, 213, 219)' } : {}}
                className={`flex flex-col items-center space-y-1 py-3 px-4 min-w-0 hover:text-gray-100 ${
                  isActive ? "text-game-primary" : ""
                }`}
              >
                <Icon className={`w-5 h-5`} style={!isActive ? { color: 'rgb(209, 213, 219)' } : {}} />
                <span className="text-xs font-medium" style={!isActive ? { color: 'rgb(209, 213, 219)' } : {}}>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}