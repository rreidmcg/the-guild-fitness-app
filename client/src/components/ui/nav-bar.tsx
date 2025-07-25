import { useQuery } from "@tanstack/react-query";
import { Button } from "./button";
import { useNavigate } from "@/hooks/use-navigate";
import { Dumbbell, Plus, Star, User } from "lucide-react";

export function NavBar() {
  const navigate = useNavigate();
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  return (
    <nav className="bg-card border-b border-border px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Dumbbell className="text-game-primary text-2xl" />
          <h1 className="text-xl font-bold cursor-pointer text-foreground" onClick={() => navigate("/")}>
            Dumbbells & Dragons
          </h1>
        </div>
        
        <div className="flex items-center space-x-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/workout-builder")}
            className="text-foreground hover:text-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Workout
          </Button>
          
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-game-warning" />
            <span className="text-sm font-medium text-foreground">Level {userStats?.level || 1}</span>
          </div>
          
          <div className="w-8 h-8 bg-game-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </nav>
  );
}
