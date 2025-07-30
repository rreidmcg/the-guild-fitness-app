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
import { AuthGuard, PublicRoute } from "@/components/auth-guard";
import Stats from "@/pages/stats";
import Workouts from "@/pages/workouts";
import Settings from "@/pages/settings";
import WorkoutBuilder from "@/pages/workout-builder";
import WorkoutSession from "@/pages/workout-session";
import Battle from "@/pages/battle";
import PvEDungeons from "@/pages/pve-dungeons";
import Wardrobe from "@/pages/wardrobe";
import Shop from "@/pages/shop";
import Profile from "@/pages/profile";
import Inventory from "@/pages/inventory";
import SignupPage from "@/pages/signup";
import LoginPage from "@/pages/login";
import AdminDashboard from "@/pages/admin";
import Leaderboard from "@/pages/leaderboard";
import Analytics from "@/pages/analytics";
import WorkoutPrograms from "@/pages/workout-programs";
import GemShop from "@/pages/gem-shop";
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
      {/* Public routes - redirect to /stats if already authenticated */}
      <Route path="/signup">
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      </Route>
      <Route path="/login">
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      </Route>
      
      {/* Protected routes - require authentication */}
      <Route path="/">
        <AuthGuard>
          <Stats />
        </AuthGuard>
      </Route>
      <Route path="/stats">
        <AuthGuard>
          <Stats />
        </AuthGuard>
      </Route>
      <Route path="/workouts">
        <AuthGuard>
          <Workouts />
        </AuthGuard>
      </Route>
      <Route path="/inventory">
        <AuthGuard>
          <Inventory />
        </AuthGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard>
          <Settings />
        </AuthGuard>
      </Route>
      <Route path="/workout-builder">
        <AuthGuard>
          <WorkoutBuilder />
        </AuthGuard>
      </Route>
      <Route path="/workout-session/:id">
        <AuthGuard>
          <WorkoutSession />
        </AuthGuard>
      </Route>
      <Route path="/battle">
        <AuthGuard>
          <Battle />
        </AuthGuard>
      </Route>
      <Route path="/pve-dungeons">
        <AuthGuard>
          <PvEDungeons />
        </AuthGuard>
      </Route>
      <Route path="/wardrobe">
        <AuthGuard>
          <Wardrobe />
        </AuthGuard>
      </Route>
      <Route path="/shop">
        <AuthGuard>
          <Shop />
        </AuthGuard>
      </Route>
      <Route path="/profile">
        <AuthGuard>
          <Profile />
        </AuthGuard>
      </Route>
      <Route path="/leaderboard">
        <AuthGuard>
          <Leaderboard />
        </AuthGuard>
      </Route>
      <Route path="/achievements">
        <AuthGuard>
          <Achievements />
        </AuthGuard>
      </Route>
      <Route path="/analytics">
        <AuthGuard>
          <Analytics />
        </AuthGuard>
      </Route>
      <Route path="/workout-programs">
        <AuthGuard>
          <WorkoutPrograms />
        </AuthGuard>
      </Route>
      <Route path="/gem-shop">
        <AuthGuard>
          <GemShop />
        </AuthGuard>
      </Route>
      <Route path="/admin">
        <AuthGuard>
          <AdminDashboard />
        </AuthGuard>
      </Route>
      <Route path="/checkout">
        <AuthGuard>
          <Checkout />
        </AuthGuard>
      </Route>
      <Route path="/subscribe">
        <AuthGuard>
          <Subscribe />
        </AuthGuard>
      </Route>
      <Route path="/social">
        <AuthGuard>
          <Social />
        </AuthGuard>
      </Route>
      <Route path="/mail">
        <AuthGuard>
          <MailPage />
        </AuthGuard>
      </Route>
      <Route path="/payment-success">
        <AuthGuard>
          <PaymentSuccess />
        </AuthGuard>
      </Route>
      
      {/* 404 route */}
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
        <Router />
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
