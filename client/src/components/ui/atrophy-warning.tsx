import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, AlertTriangle, Clock, Zap } from "lucide-react";

interface AtrophyStatus {
  isAtRisk: boolean;
  daysInactive: number;
  hasImmunity: boolean;
  immunityEndsOn?: string;
}

export function AtrophyWarning() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: atrophyStatus } = useQuery<AtrophyStatus>({
    queryKey: ["/api/user/atrophy-status"],
  });

  const useStreakFreezeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/user/use-streak-freeze", {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Streak Freeze Used",
        description: "Your stats are protected from atrophy today!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/atrophy-status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to use streak freeze",
        variant: "destructive",
      });
    },
  });

  if (!atrophyStatus) return null;

  if (atrophyStatus.hasImmunity) {
    return (
      <Card className="bg-green-900/20 border-green-400/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-sm font-medium text-green-100">New Player Protection</div>
              <div className="text-xs text-green-300">
                You're protected from stat loss until {atrophyStatus.immunityEndsOn}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!atrophyStatus.isAtRisk) return null;

  return (
    <Alert className="border-orange-400/30 bg-orange-900/20">
      <AlertTriangle className="h-4 w-4 text-orange-400" />
      <AlertDescription className="text-orange-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Atrophy Warning!</div>
            <div className="text-sm text-orange-300">
              {atrophyStatus.daysInactive} day(s) without activity. You lose 1% XP and stats daily.
            </div>
          </div>
          <Button
            onClick={() => useStreakFreezeMutation.mutate()}
            disabled={useStreakFreezeMutation.isPending}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="w-4 h-4 mr-1" />
            Use Streak Freeze
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}