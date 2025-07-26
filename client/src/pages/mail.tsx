import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Mail, 
  Gift, 
  Crown, 
  Clock, 
  CheckCircle,
  Star,
  Newspaper,
  Trophy,
  Calendar,
  Coins,
  Sparkles
} from "lucide-react";
import { CurrencyHeader } from "@/components/ui/currency-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface PlayerMail {
  id: number;
  userId: number;
  senderType: string;
  senderName: string;
  subject: string;
  content: string;
  mailType: string;
  isRead: boolean;
  rewards?: {
    gold?: number;
    xp?: number;
    items?: Array<{
      itemType: string;
      itemName: string;
      quantity: number;
    }>;
  };
  rewardsClaimed: boolean;
  createdAt: string;
  expiresAt?: string;
}

export default function MailPage() {
  const [selectedMail, setSelectedMail] = useState<PlayerMail | null>(null);
  const { toast } = useToast();

  const { data: mail = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/mail"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (mailId: number) => {
      return await apiRequest(`/api/mail/${mailId}/read`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mail"] });
    },
  });

  const claimRewardsMutation = useMutation({
    mutationFn: async (mailId: number) => {
      return await apiRequest(`/api/mail/${mailId}/claim`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mail"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      
      const rewards = data.rewards;
      let rewardText = "Rewards claimed: ";
      const rewardParts = [];
      
      if (rewards.gold) rewardParts.push(`${rewards.gold} gold`);
      if (rewards.xp) rewardParts.push(`${rewards.xp} XP`);
      if (rewards.items && rewards.items.length > 0) {
        rewards.items.forEach((item: any) => {
          rewardParts.push(`${item.quantity}x ${item.itemName}`);
        });
      }
      
      toast({
        title: "Rewards Claimed!",
        description: rewardText + rewardParts.join(", "),
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to claim rewards",
        variant: "destructive",
      });
    },
  });

  const getMailTypeIcon = (mailType: string) => {
    switch (mailType) {
      case "news": return <Newspaper className="w-4 h-4 text-blue-500" />;
      case "reward": return <Gift className="w-4 h-4 text-purple-500" />;
      case "announcement": return <Crown className="w-4 h-4 text-yellow-500" />;
      case "event": return <Star className="w-4 h-4 text-green-500" />;
      default: return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMailTypeBadge = (mailType: string) => {
    const variants: Record<string, string> = {
      news: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      reward: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      announcement: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      event: "bg-green-500/10 text-green-600 border-green-500/20",
    };
    return variants[mailType] || "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  const handleOpenMail = (mailItem: PlayerMail) => {
    setSelectedMail(mailItem);
    if (!mailItem.isRead) {
      markAsReadMutation.mutate(mailItem.id);
    }
  };

  const handleClaimRewards = (mailId: number) => {
    claimRewardsMutation.mutate(mailId);
  };

  const unreadCount = mail.filter((m: PlayerMail) => !m.isRead).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <CurrencyHeader />
        <div className="pt-16 space-y-4 p-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardHeader>
            </Card>
          ))}
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
              <h1 className="text-2xl font-bold text-foreground flex items-center space-x-2">
                <Mail className="w-6 h-6 text-blue-500" />
                <span>Mail</span>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                News, rewards, and announcements from the developers
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <Mail className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {selectedMail ? (
          // Mail Detail View
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getMailTypeIcon(selectedMail.mailType)}
                    <Badge className={getMailTypeBadge(selectedMail.mailType)}>
                      {selectedMail.mailType}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      from {selectedMail.senderName}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{selectedMail.subject}</CardTitle>
                  <CardDescription className="flex items-center space-x-2 mt-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDistanceToNow(new Date(selectedMail.createdAt), { addSuffix: true })}</span>
                    {selectedMail.expiresAt && (
                      <>
                        <span>•</span>
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-500">
                          Expires {formatDistanceToNow(new Date(selectedMail.expiresAt), { addSuffix: true })}
                        </span>
                      </>
                    )}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedMail(null)}
                >
                  ← Back
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{selectedMail.content}</p>
              </div>

              {selectedMail.rewards && (
                <>
                  <Separator />
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-purple-600 flex items-center space-x-2 mb-2">
                          <Gift className="w-4 h-4" />
                          <span>Rewards Attached</span>
                        </h4>
                        <div className="space-y-1 text-sm">
                          {selectedMail.rewards.gold && (
                            <div className="flex items-center space-x-2">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              <span>{selectedMail.rewards.gold} Gold</span>
                            </div>
                          )}
                          {selectedMail.rewards.xp && (
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-4 h-4 text-blue-500" />
                              <span>{selectedMail.rewards.xp} XP</span>
                            </div>
                          )}
                          {selectedMail.rewards.items && selectedMail.rewards.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Trophy className="w-4 h-4 text-green-500" />
                              <span>{item.quantity}x {item.itemName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {!selectedMail.rewardsClaimed ? (
                        <Button 
                          onClick={() => handleClaimRewards(selectedMail.id)}
                          disabled={claimRewardsMutation.isPending}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          {claimRewardsMutation.isPending ? "Claiming..." : "Claim Rewards"}
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Claimed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          // Mail List View
          <div className="space-y-3">
            {mail.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Mail Yet</h3>
                  <p className="text-muted-foreground">
                    You'll receive news, updates, and special rewards from the developers here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              mail.map((mailItem: PlayerMail) => (
                <Card 
                  key={mailItem.id}
                  className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                    !mailItem.isRead ? 'border-l-4 border-l-blue-500 bg-accent/20' : ''
                  }`}
                  onClick={() => handleOpenMail(mailItem)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getMailTypeIcon(mailItem.mailType)}
                          <Badge className={getMailTypeBadge(mailItem.mailType)}>
                            {mailItem.mailType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {mailItem.senderName}
                          </span>
                          {!mailItem.isRead && (
                            <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base font-semibold">
                          {mailItem.subject}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-sm">
                          {mailItem.content}
                        </CardDescription>
                      </div>
                      <div className="text-right flex flex-col items-end space-y-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(mailItem.createdAt), { addSuffix: true })}
                        </span>
                        {mailItem.rewards && (
                          <div className="flex items-center space-x-1">
                            <Gift className="w-3 h-3 text-purple-500" />
                            {!mailItem.rewardsClaimed ? (
                              <span className="text-xs text-purple-600 font-medium">Rewards</span>
                            ) : (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}