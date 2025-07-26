import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyHeader } from "@/components/ui/currency-header";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getTitleComponent } from "@/lib/title-rarity";
import { 
  Heart, 
  Trophy, 
  Dumbbell, 
  Star, 
  Clock, 
  Target,
  Share2,
  MessageCircle
} from "lucide-react";

interface SocialShare {
  id: number;
  shareType: string;
  title: string;
  description: string;
  shareData: any;
  likesCount: number;
  createdAt: string;
  username: string;
  level: number;
  currentTitle: string;
}

export default function Social() {
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const { data: socialShares, isLoading } = useQuery({
    queryKey: ["/api/social-shares"],
  });

  const likeMutation = useMutation({
    mutationFn: async (shareId: number) => {
      const response = await fetch(`/api/social-shares/${shareId}/like`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error('Failed to like share');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-shares"] });
    },
    onError: () => {
      toast({
        title: "Like Failed",
        description: "Could not like this share. Please try again.",
        variant: "destructive",
      });
    }
  });

  const unlikeMutation = useMutation({
    mutationFn: async (shareId: number) => {
      const response = await fetch(`/api/social-shares/${shareId}/like`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error('Failed to unlike share');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-shares"] });
    },
    onError: () => {
      toast({
        title: "Unlike Failed",
        description: "Could not unlike this share. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getShareIcon = (shareType: string) => {
    switch (shareType) {
      case 'achievement':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'workout':
        return <Dumbbell className="h-5 w-5 text-blue-500" />;
      case 'pr':
        return <Target className="h-5 w-5 text-green-500" />;
      default:
        return <Share2 className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const filteredShares = Array.isArray(socialShares) 
    ? socialShares.filter((share: SocialShare) => 
        selectedFilter === "all" || share.shareType === selectedFilter
      )
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <CurrencyHeader />
        <div className="max-w-4xl mx-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading community feed...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <CurrencyHeader />
      
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Community Feed</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">See what the community is achieving</p>
            </div>
            <Share2 className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "All", icon: <Share2 className="h-4 w-4" /> },
            { key: "achievement", label: "Achievements", icon: <Trophy className="h-4 w-4" /> },
            { key: "workout", label: "Workouts", icon: <Dumbbell className="h-4 w-4" /> },
            { key: "pr", label: "Personal Records", icon: <Target className="h-4 w-4" /> }
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={selectedFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(filter.key)}
              className="flex items-center gap-2"
            >
              {filter.icon}
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Social Feed */}
        <div className="space-y-4">
          {filteredShares.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="text-center py-12">
                <Share2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No shares yet</h3>
                <p className="text-muted-foreground">
                  {selectedFilter === "all" 
                    ? "Be the first to share an achievement or workout!"
                    : `No ${selectedFilter} shares yet. Check back later!`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredShares.map((share: SocialShare) => (
              <Card key={share.id} className="bg-card border-border transition-all duration-200 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getShareIcon(share.shareType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{share.username}</span>
                          <span className="text-xs text-muted-foreground">{share.currentTitle}</span>
                          <Badge variant="outline" className="text-xs">
                            Lv.{share.level}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(share.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{share.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{share.description}</p>
                    </div>

                    {/* Share-specific content */}
                    {share.shareType === 'achievement' && share.shareData && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                          <Trophy className="h-4 w-4" />
                          <span className="font-medium">Achievement Details</span>
                        </div>
                        {share.shareData.goldReward > 0 && (
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            Reward: {share.shareData.goldReward} gold
                          </p>
                        )}
                      </div>
                    )}

                    {/* Interaction buttons */}
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => likeMutation.mutate(share.id)}
                        disabled={likeMutation.isPending || unlikeMutation.isPending}
                        className="flex items-center gap-2 text-muted-foreground hover:text-red-500"
                      >
                        <Heart className="h-4 w-4" />
                        <span>{share.likesCount}</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-muted-foreground"
                        disabled
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">Comments coming soon</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}