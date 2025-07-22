import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Plus,
  CreditCard,
  Wallet,
  Check,
  Settings,
  ChevronDown
} from "lucide-react";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import minorHealingPotionImage from "@assets/CA06160D-7763-41DC-A734-6F29760C0BD8_1753214477623.png";
import majorHealingPotionImage from "@assets/1860C3F1-AEFB-419D-BAB2-306C00CA6321_1753215117108.png";

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

interface UserStats {
  level: number;
  experience: number;
  strength: number;
  stamina: number;
  agility: number;
  gold: number;
  battlesWon: number;
  currentTier: string;
  currentTitle: string;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  username: string;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
  skinColor?: string;
  hairColor?: string;
  gender?: string;
  measurementUnit?: string;
}

interface InventoryItem {
  itemName: string;
  itemType: string;
  quantity: number;
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
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("armor");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showGoldPurchase, setShowGoldPurchase] = useState(false);

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const { data: shopItems } = useQuery<ShopItem[]>({
    queryKey: ["/api/shop/items"],
  });

  const { data: inventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const purchaseItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest("POST", "/api/shop/purchase", { itemId });
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

  const purchaseGoldMutation = useMutation({
    mutationFn: async (goldPackage: { amount: number; price: number }) => {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: goldPackage.price,
          goldAmount: goldPackage.amount,
          description: `${goldPackage.amount} Gold Coins`
        })
      });
      if (!response.ok) throw new Error('Failed to create payment');
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = `/checkout?client_secret=${data.clientSecret}&gold=${data.goldAmount}`;
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    },
  });

  const purchasePotionMutation = useMutation({
    mutationFn: async ({ potionType, quantity }: { potionType: string; quantity: number }) => {
      return apiRequest("POST", "/api/shop/buy-potion", { potionType, quantity });
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
    if (category === "all") {
      // Show all armor items (exclude potions and other non-armor items)
      return shopItems?.filter((item: ShopItem) => 
        categories.some(cat => cat.id === item.category)
      ) || [];
    }
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
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-foreground text-sm">{userStats?.gold || 0}</span>
              </div>
              <Button 
                onClick={() => setLocation('/settings')}
                size="sm"
                variant="outline"
                className="p-2"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-4 mb-8">
            <div className="flex items-center gap-4">
              {/* Main Category Tabs */}
              <div className="flex gap-2">
                <div className="flex items-center">
                  <button
                    onClick={() => setActiveTab("armor")}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-l-lg transition-colors ${
                      activeTab === "armor" 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    <span className="text-sm font-medium">Armor</span>
                  </button>
                  
                  {/* Category Dropdown integrated with armor tab */}
                  {activeTab === "armor" && (
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-32 h-10 rounded-l-none rounded-r-lg border-l-0 bg-primary text-primary-foreground border-primary hover:bg-primary/90">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4" />
                            <span>All</span>
                          </div>
                        </SelectItem>
                        {categories.map((category) => {
                          const Icon = category.icon;
                          return (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center space-x-2">
                                <Icon className="w-4 h-4" />
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <button
                  onClick={() => setActiveTab("potions")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "potions" 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span className="text-sm font-medium">Consumables</span>
                </button>
                
                <button
                  onClick={() => setActiveTab("gold")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "gold" 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm font-medium">Gold</span>
                </button>
              </div>
            </div>
          </div>

          {/* Armor Tab Content */}
          <TabsContent value="armor">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filterItemsByCategory(selectedCategory).map((item: ShopItem) => (
                <Card key={item.id} className="bg-card border-border relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-foreground truncate">{item.name}</CardTitle>
                      <Badge className={`${rarityColors[item.rarity as keyof typeof rarityColors]} text-white text-xs`}>
                        {item.rarity[0].toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    {/* Item Preview */}
                    <div className="w-full h-20 rounded-lg mb-3 flex items-center justify-center border border-border" 
                         style={{ backgroundColor: item.color }}>
                      <div className="text-white text-lg font-bold opacity-80">
                        {item.name[0]}
                      </div>
                    </div>

                    {/* Item Info */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <Coins className="w-3 h-3 text-yellow-500" />
                          <span className="font-medium text-foreground">{item.price}</span>
                        </div>
                        
                        {item.unlockLevel > 1 && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-blue-400" />
                            <span className="text-muted-foreground">Lv.{item.unlockLevel}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Purchase Button */}
                    {item.isOwned ? (
                      <Button variant="secondary" className="w-full text-xs h-8" disabled>
                        ✓ Owned
                      </Button>
                    ) : (userStats?.level || 1) < item.unlockLevel ? (
                      <Button variant="secondary" className="w-full text-xs h-8" disabled>
                        <Lock className="w-3 h-3 mr-1" />
                        Lv.{item.unlockLevel}
                      </Button>
                    ) : (userStats?.gold || 0) < item.price ? (
                      <Button variant="destructive" className="w-full text-xs h-8" disabled>
                        Need Gold
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handlePurchase(item)}
                        disabled={purchaseItemMutation.isPending}
                        className="w-full bg-game-primary hover:bg-blue-600 text-xs h-8"
                      >
                        Buy {item.price}g
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

            {filterItemsByCategory(selectedCategory).length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Items Available</h3>
                <p className="text-muted-foreground">Check back later for new {categories.find(c => c.id === selectedCategory)?.name.toLowerCase()}!</p>
              </div>
            )}
          </TabsContent>

          {/* Potions Tab */}
          <TabsContent value="potions">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {potions.map((potion) => (
                <Card key={potion.id} className="bg-card border-border relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center truncate">
                      {potion.type === 'healing' ? (
                        <Heart className="w-4 h-4 text-red-500 mr-1" />
                      ) : (
                        <Zap className="w-4 h-4 text-blue-500 mr-1" />
                      )}
                      {potion.name.replace(' Potion', '')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {/* Potion Visual */}
                    <div className={`w-full h-20 rounded-lg mb-3 flex items-center justify-center border border-border ${(potion.id === 'minor_healing' || potion.id === 'major_healing') ? 'bg-card' : `bg-gradient-to-br ${potion.color}`}`}>
                      {potion.id === 'minor_healing' ? (
                        <img 
                          src={minorHealingPotionImage} 
                          alt="Minor Healing Potion"
                          className="w-16 h-16 object-contain"
                          style={{ 
                            imageRendering: 'pixelated',
                            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
                          }}
                        />
                      ) : potion.id === 'major_healing' ? (
                        <img 
                          src={majorHealingPotionImage} 
                          alt="Major Healing Potion"
                          className="w-16 h-16 object-contain"
                          style={{ 
                            imageRendering: 'pixelated',
                            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
                          }}
                        />
                      ) : (
                        <div className="text-white text-2xl">🧪</div>
                      )}
                    </div>

                    {/* Potion Info */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          {potion.type === 'healing' ? (
                            <>
                              <Heart className="w-3 h-3 text-red-400" />
                              <span className="font-medium text-green-400">{potion.healing}</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 text-blue-400" />
                              <span className="font-medium text-blue-400">{potion.healing}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Coins className="w-3 h-3 text-yellow-500" />
                          <span className="font-medium text-foreground">{potion.price}</span>
                        </div>
                      </div>
                      
                      {/* Inventory Count */}
                      {getInventoryQuantity(potion.id) > 0 && (
                        <div className="text-blue-400 text-xs">
                          Own: {getInventoryQuantity(potion.id)}
                        </div>
                      )}
                    </div>

                    {/* Purchase Button */}
                    {(userStats?.gold || 0) < potion.price ? (
                      <Button variant="destructive" className="w-full text-xs h-8" disabled>
                        Need Gold
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleBuyPotion(potion.id, potion.price)}
                        disabled={purchasePotionMutation.isPending}
                        className={`w-full text-xs h-8 ${potion.type === 'healing' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        Buy {potion.price}g
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gold Purchase Tab */}
          <TabsContent value="gold">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Purchase Gold Coins</h2>
              <p className="text-muted-foreground">Get more gold coins to purchase items and potions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { amount: 100, price: 0.99, bonus: 0, popular: false },
                { amount: 500, price: 4.99, bonus: 50, popular: true },
                { amount: 1000, price: 9.99, bonus: 150, popular: false },
                { amount: 2500, price: 19.99, bonus: 500, popular: false },
                { amount: 5000, price: 39.99, bonus: 1000, popular: false },
                { amount: 10000, price: 79.99, bonus: 2500, popular: false }
              ].map((goldPackage) => (
                <Card key={goldPackage.amount} className={`bg-card border-border relative overflow-hidden ${goldPackage.popular ? 'ring-2 ring-yellow-500' : ''}`}>
                  {goldPackage.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-center py-1 text-xs font-bold">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <CardHeader className={goldPackage.popular ? "pt-8" : ""}>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Coins className="w-8 h-8 text-yellow-500" />
                      </div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        {goldPackage.amount.toLocaleString()} Gold
                      </CardTitle>
                      {goldPackage.bonus > 0 && (
                        <div className="text-green-500 text-sm font-medium">
                          +{goldPackage.bonus} Bonus Gold
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="text-center">
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-foreground">
                        ${goldPackage.price}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        ${(goldPackage.price / goldPackage.amount).toFixed(4)} per gold
                      </div>
                    </div>

                    <Button 
                      onClick={() => purchaseGoldMutation.mutate(goldPackage)}
                      disabled={purchaseGoldMutation.isPending}
                      className={`w-full ${goldPackage.popular 
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' 
                        : 'bg-game-primary hover:bg-blue-600'
                      } text-white`}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Purchase
                    </Button>
                  </CardContent>

                  {goldPackage.popular && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-orange-400/5 animate-pulse" />
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>💳 Secure payment processing by Stripe</p>
              <p>✨ Gold coins are added to your account instantly after payment</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}