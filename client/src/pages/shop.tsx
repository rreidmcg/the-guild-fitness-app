import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Coins, 
  Crown,
  Shirt,
  Zap,
  Footprints,
  Star,
  Sparkles,
  Lock
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ShopItem {
  id: number;
  name: string;
  category: string;
  rarity: string;
  price: number;
  unlockLevel: number;
  color: string;
  description: string | null;
  isOwned: boolean;
}

const rarityColors = {
  common: "bg-gray-500",
  rare: "bg-blue-500", 
  epic: "bg-purple-500",
  legendary: "bg-yellow-500"
};

const categoryIcons = {
  head: Crown,
  shoulders: Shirt,
  neck: Zap,
  chest: Shirt,
  hands: Footprints,
  waist: Crown,
  legs: Zap,
  feet: Footprints
};

export default function Shop() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("head");

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: shopItems } = useQuery({
    queryKey: ["/api/shop/items"],
  });

  const purchaseItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest("/api/shop/purchase", {
        method: "POST",
        body: JSON.stringify({ itemId })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Purchase Successful",
        description: "Item added to your wardrobe!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Not enough gold or item already owned",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = (item: ShopItem) => {
    if (item.isOwned) {
      toast({
        title: "Already Owned",
        description: "You already own this item!",
        variant: "destructive",
      });
      return;
    }

    if ((userStats?.gold || 0) < item.price) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${item.price - (userStats?.gold || 0)} more gold!`,
        variant: "destructive",
      });
      return;
    }

    if ((userStats?.level || 1) < item.unlockLevel) {
      toast({
        title: "Level Required",
        description: `Reach level ${item.unlockLevel} to unlock this item!`,
        variant: "destructive",
      });
      return;
    }

    purchaseItemMutation.mutate(item.id);
  };

  const filterItemsByCategory = (category: string) => {
    return shopItems?.filter((item: ShopItem) => item.category === category) || [];
  };

  const categories = [
    { id: "head", name: "Head", icon: Crown },
    { id: "shoulders", name: "Shoulders", icon: Shirt },
    { id: "neck", name: "Neck", icon: Zap },
    { id: "chest", name: "Chest", icon: Shirt },
    { id: "hands", name: "Hands", icon: Footprints },
    { id: "waist", name: "Waist", icon: Crown },
    { id: "legs", name: "Legs", icon: Zap },
    { id: "feet", name: "Feet", icon: Footprints },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Shop</h1>
              <p className="text-muted-foreground mt-1">Purchase gear and cosmetics</p>
            </div>
            <div className="flex items-center space-x-2 bg-muted px-4 py-2 rounded-lg">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-foreground">{userStats?.gold || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex flex-col items-center space-y-1 p-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterItemsByCategory(category.id).map((item: ShopItem) => (
                  <Card key={item.id} className="bg-card border-border relative overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-foreground">{item.name}</CardTitle>
                        <Badge className={`${rarityColors[item.rarity as keyof typeof rarityColors]} text-white`}>
                          {item.rarity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Item Preview */}
                      <div className="w-full h-32 rounded-lg mb-4 flex items-center justify-center border border-border" 
                           style={{ backgroundColor: item.color }}>
                        <div className="text-white text-2xl font-bold opacity-80">
                          {item.name[0]}
                        </div>
                      </div>

                      {/* Item Info */}
                      <div className="space-y-2 mb-4">
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-3 text-sm">
                          <div className="flex items-center space-x-1">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium text-foreground">{item.price}</span>
                          </div>
                          
                          {item.unlockLevel > 1 && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-blue-400" />
                              <span className="text-muted-foreground">Lv. {item.unlockLevel}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Purchase Button */}
                      {item.isOwned ? (
                        <Button variant="secondary" className="w-full" disabled>
                          <Check className="w-4 h-4 mr-2" />
                          Owned
                        </Button>
                      ) : (userStats?.level || 1) < item.unlockLevel ? (
                        <Button variant="secondary" className="w-full" disabled>
                          <Lock className="w-4 h-4 mr-2" />
                          Level {item.unlockLevel} Required
                        </Button>
                      ) : (userStats?.gold || 0) < item.price ? (
                        <Button variant="destructive" className="w-full" disabled>
                          <Coins className="w-4 h-4 mr-2" />
                          Not Enough Gold
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handlePurchase(item)}
                          disabled={purchaseItemMutation.isPending}
                          className="w-full bg-game-primary hover:bg-blue-600"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy for {item.price} Gold
                        </Button>
                      )}
                    </CardContent>

                    {/* Rarity Glow Effect */}
                    {item.rarity === 'legendary' && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 animate-pulse" />
                      </div>
                    )}
                    {item.rarity === 'epic' && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 animate-pulse" />
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {filterItemsByCategory(category.id).length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Items Available</h3>
                  <p className="text-muted-foreground">Check back later for new {category.name.toLowerCase()}!</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}