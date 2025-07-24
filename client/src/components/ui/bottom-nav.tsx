import { useLocation } from "wouter";
import { Button } from "./button";
import { Dumbbell, BarChart3, Sword, ShoppingBag, Package } from "lucide-react";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { scrollToTop } = useSmoothScroll();

  const navItems = [
    { path: "/", label: "Stats", icon: BarChart3 },
    { path: "/workouts", label: "Workouts", icon: Dumbbell },
    { path: "/battle", label: "Battle", icon: Sword },
    { path: "/shop", label: "Shop", icon: ShoppingBag },
    { path: "/inventory", label: "Items", icon: Package },
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
                onClick={() => {
                  setLocation(item.path);
                  // Smooth scroll to top when changing pages
                  setTimeout(() => scrollToTop(), 100);
                }}
                className={`nav-item ${isActive ? 'active' : ''} justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-14 w-14 flex flex-col items-center justify-center space-y-1 px-3 py-2 min-w-0 ${isActive ? 'text-primary bg-accent/20' : 'text-muted-foreground'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform duration-200`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}