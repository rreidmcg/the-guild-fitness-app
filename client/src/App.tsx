import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useBackgroundMusic } from "@/hooks/use-background-music";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import Stats from "@/pages/stats";
import Workouts from "@/pages/workouts";
import Settings from "@/pages/settings";
import WorkoutBuilder from "@/pages/workout-builder";
import WorkoutSession from "@/pages/workout-session";
import Battle from "@/pages/battle";
import Wardrobe from "@/pages/wardrobe";
import Shop from "@/pages/shop";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Stats} />
      <Route path="/workouts" component={Workouts} />
      <Route path="/settings" component={Settings} />
      <Route path="/workout-builder" component={WorkoutBuilder} />
      <Route path="/workout-session/:id" component={WorkoutSession} />
      <Route path="/battle" component={Battle} />
      <Route path="/wardrobe" component={Wardrobe} />
      <Route path="/shop" component={Shop} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isPlaying, isMuted, toggleMusic, startMusic } = useBackgroundMusic();

  // Auto-start music on first user interaction
  const handleFirstInteraction = () => {
    if (isMuted && !isPlaying) {
      startMusic();
    }
    // Remove event listeners after first interaction
    document.removeEventListener('click', handleFirstInteraction);
    document.removeEventListener('keydown', handleFirstInteraction);
    document.removeEventListener('touchstart', handleFirstInteraction);
  };

  // Add event listeners for first user interaction
  if (typeof window !== 'undefined') {
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Toaster />
          
          {/* Music Control Button */}
          <div className="fixed top-4 right-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMusic}
              className="bg-card border-border hover:bg-accent"
            >
              {isMuted || !isPlaying ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <Router />
          <BottomNav />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
