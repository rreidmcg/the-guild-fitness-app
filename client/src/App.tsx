import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/ui/bottom-nav";
import Stats from "@/pages/stats";
import Workouts from "@/pages/workouts";
import Settings from "@/pages/settings";
import WorkoutBuilder from "@/pages/workout-builder";
import WorkoutSession from "@/pages/workout-session";
import Battle from "@/pages/battle";
import Wardrobe from "@/pages/wardrobe";
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-game-dark text-white">
          <Toaster />
          <Router />
          <BottomNav />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
