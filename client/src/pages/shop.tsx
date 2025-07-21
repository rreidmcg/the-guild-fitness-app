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
  Lock,
  Heart,
  Plus
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
  const [activeTab, setActiveTab] = useState("potions");

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: shopItems } = useQuery({
    queryKey: ["/api/shop/items"],
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
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

  const purchasePotionMutation = useMutation({
    mutationFn: async ({ potionType, quantity }: { potionType: string; quantity: number }) => {
      return apiRequest("/api/shop/buy-potion", {
        method: "POST",
        body: JSON.stringify({ potionType, quantity })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Purchase Successful",
        description: "Potion added to your inventory!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Not enough gold",
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

  const handleBuyPotion = (potionType: string, price: number) => {
    if ((userStats?.gold || 0) < price) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${price - (userStats?.gold || 0)} more gold!`,
        variant: "destructive",
      });
      return;
    }

    purchasePotionMutation.mutate({ potionType, quantity: 1 });
  };

  const getInventoryQuantity = (itemName: string) => {
    return inventory?.find((item: any) => item.itemName === itemName)?.quantity || 0;
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

  const potions = [
    {
      id: "minor_healing",
      name: "Minor Healing Potion",
      description: "Restores 25% of maximum HP",
      price: 10,
      healing: "25%",
      color: "from-red-500 to-red-600",
      type: "healing"
    },
    {
      id: "major_healing", 
      name: "Major Healing Potion",
      description: "Restores 50% of maximum HP",
      price: 25,
      healing: "50%",
      color: "from-red-600 to-red-700",
      type: "healing"
    },
    {
      id: "full_healing",
      name: "Full Healing Potion",
      description: "Restores 100% of maximum HP",
      price: 50,
      healing: "100%",
      color: "from-red-700 to-red-800",
      type: "healing"
    },
    {
      id: "minor_mana",
      name: "Minor Mana Potion",
      description: "Restores 25% of maximum MP",
      price: 8,
      healing: "25%",
      color: "from-blue-500 to-blue-600",
      type: "mana"
    },
    {
      id: "major_mana", 
      name: "Major Mana Potion",
      description: "Restores 50% of maximum MP",
      price: 20,
      healing: "50%",
      color: "from-blue-600 to-blue-700",
      type: "mana"
    },
    {
      id: "full_mana",
      name: "Full Mana Potion",
      description: "Restores 100% of maximum MP",
      price: 40,
      healing: "100%",
      color: "from-blue-700 to-blue-800",
      type: "mana"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Shop</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Purchase gear and cosmetics</p>
            </div>
            <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-foreground text-sm">{userStats?.gold || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 mb-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex flex-col items-center space-y-1 p-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{category.name}</span>
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="potions" className="flex flex-col items-center space-y-1 p-2">
              <Heart className="w-4 h-4" />
              <span className="text-xs">Potions</span>
            </TabsTrigger>
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

          {/* Potions Tab */}
          <TabsContent value="potions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {potions.map((potion) => (
                <Card key={potion.id} className="bg-card border-border relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-foreground flex items-center">
                      {potion.type === 'healing' ? (
                        <Heart className="w-5 h-5 text-red-500 mr-2" />
                      ) : (
                        <Zap className="w-5 h-5 text-blue-500 mr-2" />
                      )}
                      {potion.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Potion Visual */}
                    <div className={`w-full h-32 rounded-lg mb-4 flex items-center justify-center border border-border bg-gradient-to-br ${potion.color}`}>
                      <div className="text-white text-4xl">🧪</div>
                    </div>

                    {/* Potion Info */}
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-muted-foreground">{potion.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          {potion.type === 'healing' ? (
                            <>
                              <Heart className="w-4 h-4 text-red-400" />
                              <span className="font-medium text-green-400">{potion.healing} HP</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 text-blue-400" />
                              <span className="font-medium text-blue-400">{potion.healing} MP</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-foreground">{potion.price}</span>
                        </div>
                      </div>
                      
                      {/* Inventory Count */}
                      {getInventoryQuantity(potion.id) > 0 && (
                        <div className="flex items-center space-x-1 text-blue-400 text-sm">
                          <span>You have: {getInventoryQuantity(potion.id)}</span>
                        </div>
                      )}
                    </div>

                    {/* Purchase Button */}
                    {(userStats?.gold || 0) < potion.price ? (
                      <Button variant="destructive" className="w-full" disabled>
                        <Coins className="w-4 h-4 mr-2" />
                        Not Enough Gold
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleBuyPotion(potion.id, potion.price)}
                        disabled={purchasePotionMutation.isPending}
                        className={`w-full ${potion.type === 'healing' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Buy for {potion.price} Gold
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}