import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipmentSlots } from "@/components/ui/equipment-slots";
import { 
  ArrowLeft, 
  ShirtIcon as Shirt,
  Crown,
  Zap,
  Footprints,
  Palette,
  Star,
  Coins,
  Lock,
  Check
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WardrobeItemWithOwned {
  id: number;
  name: string;
  category: string;
  rarity: string;
  price: number;
  unlockLevel: number;
  color: string;
  description: string | null;
  isOwned: boolean;
  isEquipped: boolean;
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

export default function Wardrobe() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("head");

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: wardrobeItems } = useQuery({
    queryKey: ["/api/wardrobe/items"],
  });

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

  const purchaseItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest("/api/wardrobe/purchase", {
        method: "POST",
        body: JSON.stringify({ itemId })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wardrobe/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Item Purchased!",
        description: `You have successfully purchased ${data.item.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Not enough gold or item unavailable",
        variant: "destructive"
      });
    }
  });

  const equipItemMutation = useMutation({
    mutationFn: async ({ itemId, category }: { itemId: number, category: string }) => {
      return apiRequest("/api/wardrobe/equip", {
        method: "POST",
        body: JSON.stringify({ itemId, category })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wardrobe/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Item Equipped!",
        description: "Your character's appearance has been updated",
      });
    }
  });

  const unequipItemMutation = useMutation({
    mutationFn: async (category: string) => {
      return apiRequest("/api/wardrobe/unequip", {
        method: "POST", 
        body: JSON.stringify({ category })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wardrobe/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Item Unequipped",
        description: "Item has been removed from your character",
      });
    }
  });

  const handlePurchase = (item: WardrobeItemWithOwned) => {
    if (!userStats) return;
    if (userStats.gold < item.price) {
      toast({
        title: "Not Enough Gold",
        description: `You need ${item.price - userStats.gold} more gold coins`,
        variant: "destructive"
      });
      return;
    }
    if (userStats.level < item.unlockLevel) {
      toast({
        title: "Level Too Low", 
        description: `Reach level ${item.unlockLevel} to unlock this item`,
        variant: "destructive"
      });
      return;
    }
    purchaseItemMutation.mutate(item.id);
  };

  const handleEquip = (item: WardrobeItemWithOwned) => {
    if (item.isEquipped) {
      unequipItemMutation.mutate(item.category);
    } else {
      equipItemMutation.mutate({ itemId: item.id, category: item.category });
    }
  };

  const getFilteredItems = (category: string) => {
    return wardrobeItems?.filter((item: WardrobeItemWithOwned) => item.category === category) || [];
  };

  const canPurchase = (item: WardrobeItemWithOwned) => {
    if (!userStats) return false;
    return !item.isOwned && userStats.gold >= item.price && userStats.level >= item.unlockLevel;
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation("/")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Character Wardrobe</h1>
                <p className="text-muted-foreground mt-0.5 text-sm">Customize your character's appearance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Equipment Slots with Avatar */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Character Equipment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EquipmentSlots userStats={userStats} wardrobeItems={wardrobeItems || []} />
          </CardContent>
        </Card>

        {/* Wardrobe Items */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Wardrobe Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
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
                <TabsContent key={category.id} value={category.id} className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredItems(category.id).map((item: WardrobeItemWithOwned) => (
                      <Card key={item.id} className="bg-card border-border relative">
                        <CardContent className="p-4">
                          {/* Rarity Badge */}
                          <Badge className={`absolute top-2 right-2 ${rarityColors[item.rarity as keyof typeof rarityColors]} text-white`}>
                            <Star className="w-3 h-3 mr-1" />
                            {item.rarity}
                          </Badge>

                          {/* Item Preview */}
                          <div className="flex items-center justify-center h-20 mb-4">
                            <div 
                              className="w-16 h-16 rounded-lg border-2 border-border flex items-center justify-center"
                              style={{ backgroundColor: item.color }}
                            >
                              {/* Color preview for the item */}
                              <div className="text-white font-bold text-xs">
                                {item.category.charAt(0).toUpperCase()}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-semibold text-center">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground text-center">{item.description}</p>
                            )}
                            
                            <div className="flex items-center justify-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <Coins className="w-3 h-3 text-yellow-600" />
                                <span>{item.price}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-blue-500" />
                                <span>Lv.{item.unlockLevel}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-center pt-2">
                              {!item.isOwned ? (
                                <Button
                                  onClick={() => handlePurchase(item)}
                                  disabled={!canPurchase(item) || purchaseItemMutation.isPending}
                                  className="w-full"
                                  variant={canPurchase(item) ? "default" : "secondary"}
                                >
                                  {userStats && userStats.level < item.unlockLevel ? (
                                    <>
                                      <Lock className="w-4 h-4 mr-2" />
                                      Locked
                                    </>
                                  ) : userStats && userStats.gold < item.price ? (
                                    <>
                                      <Coins className="w-4 h-4 mr-2" />
                                      Need {item.price - userStats.gold} Gold
                                    </>
                                  ) : (
                                    <>
                                      <Coins className="w-4 h-4 mr-2" />
                                      Purchase
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleEquip(item)}
                                  disabled={equipItemMutation.isPending || unequipItemMutation.isPending}
                                  className="w-full"
                                  variant={item.isEquipped ? "secondary" : "default"}
                                >
                                  {item.isEquipped ? (
                                    <>
                                      <Check className="w-4 h-4 mr-2" />
                                      Equipped
                                    </>
                                  ) : (
                                    "Equip"
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {getFilteredItems(category).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No {category} items available yet.</p>
                      <p className="text-sm mt-2">Check back later for new items!</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}