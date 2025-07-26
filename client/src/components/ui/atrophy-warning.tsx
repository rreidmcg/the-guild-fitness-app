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
        <CardContent className="p-2">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-400" />
            <div>
              <div className="text-xs font-medium text-green-100">New Player Protection</div>
              <div className="text-xs text-green-300">
                Protected until {atrophyStatus.immunityEndsOn}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!atrophyStatus.isAtRisk) return null;

  return (
    <Alert className="border-orange-400/30 bg-orange-900/20 py-2">
      <AlertTriangle className="h-3 w-3 text-orange-400" />
      <AlertDescription className="text-orange-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium">Atrophy Warning!</div>
            <div className="text-xs text-orange-300">
              {atrophyStatus.daysInactive} day(s) inactive. Losing 1% XP/stats daily.
            </div>
          </div>
          <Button
            onClick={() => useStreakFreezeMutation.mutate()}
            disabled={useStreakFreezeMutation.isPending}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1 h-auto"
          >
            <Zap className="w-3 h-3 mr-1" />
            Use Freeze
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}