import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Gem, 
  CreditCard, 
  ShoppingCart,
  Snowflake,
  Coins,
  Crown,
  Sparkles
} from "lucide-react";
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface ShopItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  gemAmount?: number;
  itemType: string;
  iconPath: string;
  priceFormatted: string;
}

function GemPurchaseForm({ item, onSuccess }: { item: ShopItem; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/gem-shop",
      },
      redirect: "if_required"
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Confirm the purchase on our backend
      try {
        await apiRequest("POST", "/api/confirm-gem-purchase", {
          paymentIntentId: paymentIntent.id
        });
        
        toast({
          title: "Purchase Successful!",
          description: `You received ${item.gemAmount} gems!`,
        });
        
        onSuccess();
      } catch (confirmError) {
        toast({
          title: "Purchase Confirmation Failed",
          description: "Payment succeeded but confirmation failed. Contact support.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe} className="w-full">
        <CreditCard className="w-4 h-4 mr-2" />
        Complete Purchase - {item.priceFormatted}
      </Button>
    </form>
  );
}

function ShopItemCard({ item, userGems }: { item: ShopItem; userGems: number }) {
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  const purchaseWithUSDMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/purchase-gems/${item.id}`);
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initialize purchase",
        variant: "destructive",
      });
    }
  });

  const purchaseWithGemsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/purchase-with-gems/${item.id}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Purchase Successful!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase item",
        variant: "destructive",
      });
    }
  });

  const handlePurchase = () => {
    if (item.currency === 'usd') {
      purchaseWithUSDMutation.mutate();
    } else if (item.currency === 'gems') {
      purchaseWithGemsMutation.mutate();
    }
  };

  const handlePurchaseSuccess = () => {
    setShowPayment(false);
    setClientSecret("");
    queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
  };

  if (showPayment && clientSecret) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Complete Purchase</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPayment(false)}
            >
              Cancel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-center">
            <div className="text-4xl mb-2">💎</div>
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-muted-foreground">Get {item.gemAmount} gems</p>
          </div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <GemPurchaseForm item={item} onSuccess={handlePurchaseSuccess} />
          </Elements>
        </CardContent>
      </Card>
    );
  }

  const canAfford = item.currency === 'gems' ? userGems >= item.price : true;
  const isStreakFreeze = item.itemType === 'streak_freeze';

  return (
    <Card className="bg-card border-border hover:shadow-lg transition-shadow">
      <CardHeader className="text-center">
        <div className="text-4xl mb-2">
          {item.itemType === 'gems' ? '💎' : isStreakFreeze ? '🧊' : '💎'}
        </div>
        <CardTitle className="flex items-center justify-center space-x-2">
          <span>{item.name}</span>
          {item.category === 'gems' && <Crown className="w-4 h-4 text-yellow-500" />}
        </CardTitle>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{item.priceFormatted}</div>
          {item.gemAmount && (
            <div className="text-sm text-muted-foreground">
              {item.gemAmount} gems
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-center">{item.description}</p>
        
        {item.category === 'gems' && (
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Premium Currency</span>
            </div>
            <div className="text-xs text-center text-muted-foreground">
              Use gems to buy streak freezes and exclusive items
            </div>
          </div>
        )}

        {isStreakFreeze && (
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Snowflake className="w-4 h-4 text-blue-400" />
              <span>Streak Protection</span>
            </div>
            <div className="text-xs text-center text-muted-foreground">
              Automatically protects your streak if you miss a day
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button 
            className="w-full" 
            onClick={handlePurchase}
            disabled={
              purchaseWithUSDMutation.isPending || 
              purchaseWithGemsMutation.isPending ||
              !canAfford
            }
            variant={item.currency === 'usd' ? 'default' : 'outline'}
          >
            {item.currency === 'usd' ? (
              <CreditCard className="w-4 h-4 mr-2" />
            ) : (
              <span className="w-4 h-4 mr-2">💎</span>
            )}
            {purchaseWithUSDMutation.isPending || purchaseWithGemsMutation.isPending ? (
              "Processing..."
            ) : !canAfford ? (
              "Not Enough Gems"
            ) : (
              `Buy for ${item.priceFormatted}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GemShop() {
  const { data: shopItems, isLoading } = useQuery({
    queryKey: ["/api/shop"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 bg-muted animate-pulse rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const gemPacks = shopItems?.filter((item: ShopItem) => item.category === 'gems') || [];
  const gemItems = shopItems?.filter((item: ShopItem) => item.currency === 'gems') || [];
  const userGems = (userStats as any)?.gems || 0;

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center space-x-2">
            <Gem className="w-8 h-8 text-blue-400" />
            <span>Gem Shop</span>
          </h1>
          <p className="text-muted-foreground">
            Purchase gems with real money, then use them to buy exclusive items
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <span className="text-lg">💎</span>
            <span className="text-lg font-semibold">Your Gems: {userGems}</span>
          </div>
        </div>

        {/* Gem Packs Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-green-500" />
            <span>Buy Gems</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gemPacks.map((item: ShopItem) => (
              <ShopItemCard key={item.id} item={item} userGems={userGems} />
            ))}
          </div>
        </div>

        {/* Gem Store Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <ShoppingCart className="w-6 h-6 text-blue-500" />
            <span>Spend Gems</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gemItems.map((item: ShopItem) => (
              <ShopItemCard key={item.id} item={item} userGems={userGems} />
            ))}
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Why Buy Gems?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <Snowflake className="w-6 h-6 mx-auto mb-2 text-blue-400" />
              <p>Purchase streak freezes to protect your progress</p>
            </div>
            <div>
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <p>Access exclusive items and future premium content</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}