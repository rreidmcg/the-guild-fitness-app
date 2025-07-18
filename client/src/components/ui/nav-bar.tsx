import { useQuery } from "@tanstack/react-query";
import { Button } from "./button";
import { useLocation } from "wouter";
import { Dumbbell, Plus, Star, User } from "lucide-react";

export function NavBar() {
  const [, setLocation] = useLocation();
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  return (
    <nav className="bg-game-slate border-b border-gray-700 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Dumbbell className="text-game-primary text-2xl" />
          <h1 className="text-xl font-bold text-white cursor-pointer" onClick={() => setLocation("/")}>
            FitQuest
          </h1>
        </div>
        
        <div className="flex items-center space-x-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/workout-builder")}
            className="text-gray-300 hover:text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Workout
          </Button>
          
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-game-warning" />
            <span className="text-sm font-medium">Level {userStats?.level || 1}</span>
          </div>
          
          <div className="w-8 h-8 bg-game-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </nav>
  );
}
