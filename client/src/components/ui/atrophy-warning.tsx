import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Zap } from "lucide-react";

interface AtrophyStatus {
  isAtRisk: boolean;
  daysInactive: number;
  hasImmunity: boolean;
  immunityEndsOn?: string;
}

export function AtrophyWarning() {
  const { data: atrophyStatus } = useQuery<AtrophyStatus>({
    queryKey: ["/api/user/atrophy-status"],
  });

  // Streak freeze is now handled automatically at midnight

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
          <div className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
            <Zap className="w-3 h-3 mr-1 inline" />
            Auto-Protected
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}