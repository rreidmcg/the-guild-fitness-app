import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useBackgroundMusic } from "@/hooks/use-background-music";
import { useTimezone } from "@/hooks/use-timezone";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect } from "react";
import Stats from "@/pages/stats";
import Workouts from "@/pages/workouts";
import Settings from "@/pages/settings";
import WorkoutBuilder from "@/pages/workout-builder";
import WorkoutSession from "@/pages/workout-session";
import Battle from "@/pages/battle";
import Wardrobe from "@/pages/wardrobe";
import Shop from "@/pages/shop";
import Profile from "@/pages/profile";
import Inventory from "@/pages/inventory";
import SignupPage from "@/pages/signup";
import LoginPage from "@/pages/login";
import AdminDashboard from "@/pages/admin";
import Leaderboard from "@/pages/leaderboard";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Stats} />
      <Route path="/workouts" component={Workouts} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/settings" component={Settings} />
      <Route path="/workout-builder" component={WorkoutBuilder} />
      <Route path="/workout-session/:id" component={WorkoutSession} />
      <Route path="/battle" component={Battle} />
      <Route path="/wardrobe" component={Wardrobe} />
      <Route path="/shop" component={Shop} />
      <Route path="/profile" component={Profile} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isPlaying, isMuted, toggleMusic, startMusic } = useBackgroundMusic();
  
  // Initialize timezone detection for daily quest resets
  useTimezone();

  // Auto-start music on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (isMuted && !isPlaying) {
        startMusic();
      }
    };

    // Add event listeners for first user interaction
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      // Cleanup in case component unmounts before interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [isMuted, isPlaying, startMusic]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Toaster />
        
        {/* Music Controls */}
        <div className="fixed top-4 right-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMusic}
            className="bg-background/80 backdrop-blur-sm border-border/50"
          >
            {isMuted || !isPlaying ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Router />
        <BottomNav />
      </div>
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
