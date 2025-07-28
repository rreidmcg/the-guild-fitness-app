import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/ui/bottom-nav";
import { BackgroundMusicProvider } from "@/contexts/background-music-context";
import { useTimezone } from "@/hooks/use-timezone";
import { CurrencyHeader } from "@/components/ui/currency-header";
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
import Analytics from "@/pages/analytics";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import WorkoutRecommendationsPage from "@/pages/workout-recommendations";
import Subscribe from "@/pages/subscribe";
import MailPage from "@/pages/mail";
import Social from "@/pages/social";
import NotFound from "@/pages/not-found";
import Achievements from "@/pages/achievements";
import Premium from "@/pages/premium";
import AIWorkouts from "@/pages/ai-workouts";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Stats} />
      <Route path="/stats" component={Stats} />
      <Route path="/workouts" component={Workouts} />
      {/* <Route path="/workout-recommendations" component={WorkoutRecommendationsPage} /> */}
      <Route path="/inventory" component={Inventory} />
      <Route path="/settings" component={Settings} />
      <Route path="/workout-builder" component={WorkoutBuilder} />
      <Route path="/workout-session/:id" component={WorkoutSession} />
      <Route path="/battle" component={Battle} />
      <Route path="/wardrobe" component={Wardrobe} />
      <Route path="/shop" component={Shop} />
      <Route path="/profile" component={Profile} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/analytics" component={Analytics} />
      {/* <Route path="/premium" component={Premium} />
      <Route path="/ai-workouts" component={AIWorkouts} /> */}
      <Route path="/signup" component={SignupPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/social" component={Social} />
      <Route path="/mail" component={MailPage} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  // Initialize timezone detection for daily quest resets
  useTimezone();

  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Toaster />
        
        {/* Fixed Currency Header */}
        <CurrencyHeader />
        
        {/* Music Controls - Hidden per user request */}

        {/* Main content with top padding to account for fixed header */}
        <div className="pt-12">
          <Router />
        </div>
        <BottomNav />
      </div>
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BackgroundMusicProvider>
        <AppContent />
      </BackgroundMusicProvider>
    </QueryClientProvider>
  );
}

export default App;
