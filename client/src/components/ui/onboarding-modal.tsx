import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Zap, 
  Trophy, 
  Sword, 
  Users,
  Target,
  Gift,
  Shield,
  Heart,
  Settings,
  Calendar,
  Play,
  Check,
  Home,
  Dumbbell,
  ShoppingCart,
  Star,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to The Guild!",
      description: "Your RPG fitness adventure begins here",
      icon: Crown,
      content: (
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Welcome, {userStats?.username || 'Adventurer'}!</h3>
            <p className="text-muted-foreground">
              You've joined The Guild: Gamified Fitness, where your real-world workouts become epic RPG adventures. 
              Level up your character, gain XP, and embark on legendary quests!
            </p>
          </div>
        </div>
      )
    },
    {
      id: "character",
      title: "Your Character",
      description: "Meet your RPG avatar and stats",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Level {userStats?.level || 1} Adventurer</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-red-500">{userStats?.strength || 1}</div>
                <div className="text-xs text-muted-foreground">Strength</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-blue-500">{userStats?.stamina || 1}</div>
                <div className="text-xs text-muted-foreground">Stamina</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-green-500">{userStats?.agility || 1}</div>
                <div className="text-xs text-muted-foreground">Agility</div>
              </CardContent>
            </Card>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Your character grows stronger with every workout! Strength training boosts STR, 
              cardio increases STA, and flexibility/agility work improves AGI.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "workouts",
      title: "Workouts & XP",
      description: "How exercise transforms into experience",
      icon: Dumbbell,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Gain XP Through Exercise</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Dumbbell className="w-5 h-5 text-orange-500" />
              <div className="flex-1">
                <div className="font-medium">Complete Workouts</div>
                <div className="text-sm text-muted-foreground">Each exercise gives XP based on intensity</div>
              </div>
              <Badge className="bg-orange-500/20 text-orange-600">+10-50 XP</Badge>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Target className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-medium">Daily Quests</div>
                <div className="text-sm text-muted-foreground">Hydration, steps, protein, sleep</div>
              </div>
              <Badge className="bg-blue-500/20 text-blue-600">+5 XP each</Badge>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Trophy className="w-5 h-5 text-purple-500" />
              <div className="flex-1">
                <div className="font-medium">Achievements</div>
                <div className="text-sm text-muted-foreground">Milestone rewards</div>
              </div>
              <Badge className="bg-purple-500/20 text-purple-600">+25-100 XP</Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "navigation",
      title: "App Navigation",
      description: "Explore all the features",
      icon: Home,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-center mb-4">Navigate The Guild</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Home className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium text-sm">Stats</div>
                <div className="text-xs text-muted-foreground">Your progress</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Dumbbell className="w-5 h-5 text-green-500" />
              <div>
                <div className="font-medium text-sm">Workouts</div>
                <div className="text-xs text-muted-foreground">Train & quest</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Sword className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-medium text-sm">Battle</div>
                <div className="text-xs text-muted-foreground">Fight monsters</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-purple-500" />
              <div>
                <div className="font-medium text-sm">Shop</div>
                <div className="text-xs text-muted-foreground">Buy gear</div>
              </div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Use the bottom navigation to move between sections. Each area offers unique ways to progress your character!
            </p>
          </div>
        </div>
      )
    },
    {
      id: "future",
      title: "Coming Soon",
      description: "Exciting features in development",
      icon: Star,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Star className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Future Adventures Await!</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
              <Trophy className="w-5 h-5 text-purple-500" />
              <div className="flex-1">
                <div className="font-medium">Epic Dungeons</div>
                <div className="text-sm text-muted-foreground">Multi-level adventures with boss battles</div>
              </div>
              <Badge className="bg-purple-500/20 text-purple-600">Coming Soon</Badge>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
              <Users className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-medium">Player vs Player</div>
                <div className="text-sm text-muted-foreground">Challenge friends to fitness duels</div>
              </div>
              <Badge className="bg-blue-500/20 text-blue-600">In Development</Badge>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
              <Crown className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <div className="font-medium">Guild System</div>
                <div className="text-sm text-muted-foreground">Join teams for group challenges</div>
              </div>
              <Badge className="bg-green-500/20 text-green-600">Planned</Badge>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Your XP and character progress will unlock these features as they become available. Keep training!
            </p>
          </div>
        </div>
      )
    },
    {
      id: "start",
      title: "Ready to Begin!",
      description: "Your adventure starts now",
      icon: Play,
      content: (
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Check className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">You're All Set!</h3>
            <p className="text-muted-foreground">
              Time to start your fitness journey. Complete your first workout to gain XP and begin leveling up your character!
            </p>
          </div>
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center space-x-2 text-green-600 font-medium">
              <Gift className="w-4 h-4" />
              <span>Pro Tip: Complete 2 daily quests or 1 workout to advance your streak!</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              {React.createElement(steps[currentStep].icon, { className: "w-5 h-5" })}
              <span>{steps[currentStep].title}</span>
            </DialogTitle>
            <Badge variant="outline">
              {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {steps[currentStep].description}
            </p>
          </div>
        </DialogHeader>

        <div className="py-4">
          {steps[currentStep].content}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleComplete}
              className="flex items-center space-x-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Play className="w-4 h-4" />
              <span>Start Adventure!</span>
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}