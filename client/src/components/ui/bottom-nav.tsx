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
                style={{ color: isActive ? 'hsl(243, 75%, 59%)' : 'rgb(107, 114, 128)' }}
                className="flex flex-col items-center space-y-1 py-3 px-4 min-w-0 hover:text-gray-900"
              >
                <Icon className="w-5 h-5" style={{ color: isActive ? 'hsl(243, 75%, 59%)' : 'rgb(107, 114, 128)' }} />
                <span className="text-xs font-medium" style={{ color: isActive ? 'hsl(243, 75%, 59%)' : 'rgb(107, 114, 128)' }}>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}