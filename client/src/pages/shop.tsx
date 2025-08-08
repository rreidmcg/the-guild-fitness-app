import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading-spinner";

// Import defensive coding standards
import "../styles/defensive-coding-standards.css";
import { 
  ShoppingCart, 
  Coins, 
  Star,
  Sparkles,
  Heart,
  Plus,
  CreditCard,
  Wallet,
  Check,
  Settings,
  ChevronDown,
  Coffee,
  Beef,
  Zap,
  Shield,
  Gift,
  Crown,
  Flame,
  Lock
} from "lucide-react";
import { useLocation } from "wouter";
import { useNavigate } from "@/hooks/use-navigate";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ParallaxBackground } from "@/components/ui/parallax-background";

import minorHealingPotionImage from "@assets/CA06160D-7763-41DC-A734-6F29760C0BD8_1753214477623.png";
import majorHealingPotionImage from "@assets/1860C3F1-AEFB-419D-BAB2-306C00CA6321_1753215117108.png";
import characterImage from "@assets/263F10D0-DF8C-4E30-8FAE-9A934B3A8CB7_1753324678577.png";
import spiderMonsterImage from "@assets/1B395958-75E1-4297-8F5E-27BED5DC1608_1753196270170.png";
import armorImage from "@assets/0F1ED511-7E0E-4062-A429-FB8B7BC6B4FE_1753151490494.png";
import characterMaleImage from "@assets/IMG_3682_1753213695174.png";
import minorManaPotionImage from "@assets/A78C5316-EC32-40FF-8919-E20BF97740B3_1753733597516.png";
import majorManaPotionImage from "@assets/B3B92435-50B3-4B4F-BF95-30E009AA81EB_1753733641186.png";
import legendaryHunterSkin from "@assets/IMG_3775_1753737253422.png";
import legendaryHunterFemaleSkin from "@assets/D230131C-14F5-4DAA-97FC-D1B46D95ED7F_1753833880560.png";
import megaHealPotionImage from "@assets/08789489-C26E-40BE-BA19-1471C66163E2_1753500783697.png";
import megaManaPotionImage from "@assets/E87E3B27-6376-4A57-93C6-2CE3FE0EF645_1753733707898.png";

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

interface FoundersStatus {
  isAvailable: boolean;
  canClaim: boolean;
  claimsRemaining: number;
}

const rarityColors = {
  common: "bg-gray-500",
  rare: "bg-blue-500", 
  epic: "bg-purple-500",
  legendary: "bg-yellow-500"
};



export default function Shop() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const navigate = useNavigate();
  
  // SHOP COMPONENT - Isolated state management
  const [shopComponentState, setShopComponentState] = useState({
    activeTab: "consumables",
    selectedConsumableCategory: "all",
    showGoldPurchase: false,
    isProcessing: false
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const { data: shopItems } = useQuery<ShopItem[]>({
    queryKey: ["/api/shop/items"],
  });

  const { data: inventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: foundersStatus } = useQuery<FoundersStatus>({
    queryKey: ["/api/founders-pack/status"],
  });

  const { data: workoutPrograms } = useQuery({
    queryKey: ["/api/workout-programs"],
  });

  const purchaseItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest("/api/shop/purchase", { 
        method: "POST",
        body: { itemId }
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
      return apiRequest("/api/shop/buy-potion", { 
        method: "POST",
        body: { potionType, quantity }
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

  // Simple Founders Pack Card Component
  const FoundersPackCard = () => {
    const handlePurchase = () => {
      navigate("/gem-shop");
    };

    if (!foundersStatus?.isAvailable) {
      return (
        <Card className="bg-muted/50 border-muted-foreground/20 opacity-60">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">🔥</div>
            <CardTitle className="text-muted-foreground">Founders Pack</CardTitle>
            <div className="text-sm text-muted-foreground">Sold Out</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center">
              All 100 Founders Packs have been claimed!
            </p>
            <div className="text-center text-sm text-muted-foreground">
              Thank you to our first 100 supporters ❤️
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/50 hover:shadow-xl transition-shadow">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🔥</div>
          <CardTitle className="flex items-center justify-center space-x-2">
            <span className="text-orange-400">Founders Pack</span>
            <Crown className="w-5 h-5 text-yellow-500" />
          </CardTitle>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">$29.97</div>
            <div className="text-sm text-orange-300">
              Limited: {foundersStatus?.claimsRemaining || 0} remaining
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            Exclusive pack for the first 100 users! Get premium rewards and legendary status.
          </p>

          {/* Legendary Hunter Skin Preview - Both Variants */}
          <div className="flex justify-center gap-3 mb-4">
            <div className="relative">
              <div className="w-20 h-32 rounded-lg overflow-hidden border-4 border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 shadow-lg shadow-yellow-500/25">
                <img 
                  src={legendaryHunterSkin}
                  alt="The Legendary Hunter (Male)"
                  className="w-full h-full object-contain"
                  style={{
                    imageRendering: 'pixelated',
                    filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.5))'
                  }}
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs px-1 py-0.5 rounded font-bold">
                Male
              </div>
            </div>
            <div className="relative">
              <div className="w-20 h-32 rounded-lg overflow-hidden border-4 border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 shadow-lg shadow-yellow-500/25">
                <img 
                  src={legendaryHunterFemaleSkin}
                  alt="The Legendary Hunter (Female)"
                  className="w-full h-full object-contain"
                  style={{
                    imageRendering: 'pixelated',
                    filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.5))'
                  }}
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs px-1 py-0.5 rounded font-bold">
                Female
              </div>
            </div>
          </div>
          <div className="text-center text-yellow-400 text-sm font-semibold mb-3">
            "The Legendary Hunter" - Both Variants
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Star className="w-4 h-4 text-blue-400" />
              <span>12-Week At-Home Workout Plan</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>1,000 Gold Coins</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>200 Premium Gems</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span>Legendary "The First Flame" Title</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Shield className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-400 font-semibold">"The Legendary Hunter" Exclusive Skin</span>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
              onClick={handlePurchase}
              disabled={!foundersStatus?.canClaim}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {!foundersStatus?.canClaim ? "Already Claimed" : "Claim Founders Pack"}
            </Button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            Only {foundersStatus?.claimsRemaining || 0} packs remaining!
          </div>
        </CardContent>
      </Card>
    );
  };

  const getEquipmentImage = (item: ShopItem) => {
    // Map specific items to their pixel art images
    if (item.name.toLowerCase().includes('leather') || item.category === 'head') {
      return (
        <img 
          src={characterImage} 
          alt={item.name}
          className="w-16 h-16 object-contain"
          style={{ 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
          }}
        />
      );
    }
    
    if (item.name.toLowerCase().includes('armor') || item.name.toLowerCase().includes('chest') || item.category === 'chest') {
      return (
        <img 
          src={armorImage} 
          alt={item.name}
          className="w-16 h-16 object-contain"
          style={{ 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
          }}
        />
      );
    }
    
    if (item.name.toLowerCase().includes('casual') || item.category === 'clothing') {
      return (
        <img 
          src={characterMaleImage} 
          alt={item.name}
          className="w-16 h-16 object-contain"
          style={{ 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
          }}
        />
      );
    }

    // Default fallback based on category
    const categoryImages = {
      head: characterImage,
      chest: armorImage,
      shoulders: armorImage,
      hands: characterMaleImage,
      legs: characterMaleImage,
      feet: characterMaleImage,
      neck: characterImage,
      waist: armorImage
    };

    const defaultImage = categoryImages[item.category as keyof typeof categoryImages];
    
    if (defaultImage) {
      return (
        <img 
          src={defaultImage} 
          alt={item.name}
          className="w-16 h-16 object-contain"
          style={{ 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
          }}
        />
      );
    }

    // Final fallback - colored square with first letter
    return (
      <div 
        className="w-12 h-12 rounded flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: item.color }}
      >
        {item.name[0]}
      </div>
    );
  };



  const filterPotionsByCategory = (category: string) => {
    if (category === "all") {
      return potions;
    }
    if (category === "health") {
      return potions.filter((potion) => potion.type === "healing");
    }
    if (category === "mana") {
      return potions.filter((potion) => potion.type === "mana");
    }
    // For now, food and drink return empty arrays since we don't have those items yet
    return [];
  };



  const consumableCategories = [
    { id: "health", name: "Health", icon: Heart },
    { id: "mana", name: "Mana", icon: Sparkles },
    { id: "food", name: "Food", icon: Beef },
    { id: "drink", name: "Drink", icon: Coffee },
  ];

  const potions = [
    {
      id: "minor_healing",
      name: "Minor Health",
      description: "Restores 25% HP",
      price: 10,
      healing: "25%",
      color: "from-red-500 to-red-600",
      type: "healing"
    },
    {
      id: "major_healing", 
      name: "Major Health",
      description: "Restores 50% HP",
      price: 25,
      healing: "50%",
      color: "from-red-600 to-red-700",
      type: "healing"
    },
    {
      id: "full_healing",
      name: "Mega Health",
      description: "Restores 100% HP",
      price: 50,
      healing: "100%",
      color: "from-red-700 to-red-800",
      type: "healing"
    },
    {
      id: "minor_mana",
      name: "Minor Mana",
      description: "Restores 25% MP",
      price: 8,
      healing: "25%",
      color: "from-blue-500 to-blue-600",
      type: "mana"
    },
    {
      id: "major_mana", 
      name: "Major Mana",
      description: "Restores 50% MP",
      price: 20,
      healing: "50%",
      color: "from-blue-600 to-blue-700",
      type: "mana"
    },
    {
      id: "full_mana",
      name: "Mega Mana",
      description: "Restores 100% MP",
      price: 40,
      healing: "100%",
      color: "from-blue-700 to-blue-800",
      type: "mana"
    }
  ];

  return (
    <ParallaxBackground>
      <div className="shop-component min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Shop</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Purchase gear and cosmetics</p>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <Tabs value={shopComponentState.activeTab} onValueChange={(value) => {
          setShopComponentState(prev => ({ ...prev, activeTab: value }));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consumables">Consumables</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="gold" className="text-yellow-600 font-semibold data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-800 dark:text-yellow-400 dark:data-[state=active]:bg-yellow-900/30 dark:data-[state=active]:text-yellow-200">
              <Coins className="w-4 h-4 mr-1" />
              Currency
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {/* Consumables Filter */}
            {shopComponentState.activeTab === "consumables" && (
              <div className="mb-6">
                <Select value={shopComponentState.selectedConsumableCategory} onValueChange={(value) => {
                  setShopComponentState(prev => ({ ...prev, selectedConsumableCategory: value }));
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4" />
                        <span>All</span>
                      </div>
                    </SelectItem>
                    {consumableCategories.map((category) => {
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
              </div>
            )}
          </div>



          {/* Equipment Tab */}
          <TabsContent value="equipment">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Equipment Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Legendary armor, powerful weapons, and mystical accessories are being forged in the depths of the realm.
                </p>
                <div className="inline-flex items-center space-x-2 text-sm text-purple-400">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>In Development</span>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Consumables Tab */}
          <TabsContent value="consumables">
            <div className="grid grid-cols-2 gap-4">
              {filterPotionsByCategory(shopComponentState.selectedConsumableCategory).map((potion) => (
                <Card key={potion.id} className="bg-card border-border relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-foreground flex items-center">
                      {potion.type === 'healing' ? (
                        <Heart className="w-3 h-3 text-red-500 mr-1 flex-shrink-0" />
                      ) : (
                        <Zap className="w-3 h-3 text-blue-500 mr-1 flex-shrink-0" />
                      )}
                      <span className="truncate">{potion.name.replace(' Potion', '')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {/* Potion Visual */}
                    <div className="w-full h-20 rounded-lg mb-3 flex items-center justify-center border border-border bg-card">
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
                      ) : potion.id === 'full_healing' ? (
                        <img 
                          src={megaHealPotionImage} 
                          alt="Mega Healing Potion"
                          className="w-16 h-16 object-contain"
                          style={{ 
                            imageRendering: 'pixelated',
                            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
                          }}
                        />
                      ) : potion.id === 'minor_mana' ? (
                        <img 
                          src={minorManaPotionImage} 
                          alt="Minor Mana Potion"
                          className="w-16 h-16 object-contain"
                          style={{ 
                            imageRendering: 'pixelated',
                            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
                          }}
                        />
                      ) : potion.id === 'major_mana' ? (
                        <img 
                          src={majorManaPotionImage} 
                          alt="Major Mana Potion"
                          className="w-16 h-16 object-contain"
                          style={{ 
                            imageRendering: 'pixelated',
                            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
                          }}
                        />
                      ) : potion.id === 'full_mana' ? (
                        <img 
                          src={megaManaPotionImage} 
                          alt="Mega Mana Potion"
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
                    
                    {/* Number Owned */}
                    <div className="text-center text-xs text-muted-foreground mt-2">
                      Owned: {getInventoryQuantity(potion.id)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>



          {/* Currency Purchase Tab */}
          <TabsContent value="gold">
            <div className="space-y-8">
              {/* Gold Section */}
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center space-x-2">
                    <Coins className="w-6 h-6 text-yellow-500" />
                    <span>Gold Coins</span>
                  </h2>
                  <p className="text-muted-foreground">Buy items and potions</p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
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
                            ${(goldPackage.price / goldPackage.amount).toFixed(3)}/gold
                          </div>
                        </div>

                        <Button 
                          onClick={() => purchaseGoldMutation.mutate(goldPackage)}
                          disabled={purchaseGoldMutation.isPending}
                          className={`w-full h-12 text-white font-bold text-lg ${goldPackage.popular 
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg shadow-yellow-500/25' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                          }`}
                        >
                          <CreditCard className="w-5 h-5 mr-2" />
                          Buy
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
              </div>

              {/* Gems Section */}
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center space-x-2">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                    <span>Premium Gems</span>
                  </h2>
                  <p className="text-muted-foreground">Exclusive items & streak freezes</p>
                  <div className="mt-2 flex items-center justify-center space-x-2">
                    <span className="text-lg">💎</span>
                    <span className="text-lg font-semibold">Your Gems: {(userStats as any)?.gems || 0}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {[
                    { amount: 100, price: 1.99, popular: false },
                    { amount: 250, price: 4.99, popular: true },
                    { amount: 500, price: 9.99, popular: false },
                    { amount: 1000, price: 19.99, popular: false }
                  ].map((gemPackage) => (
                    <Card key={gemPackage.amount} className={`bg-card border-border relative overflow-hidden ${gemPackage.popular ? 'ring-2 ring-blue-500' : ''}`}>
                      {gemPackage.popular && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-1 text-xs font-bold">
                          BEST VALUE
                        </div>
                      )}
                      
                      <CardHeader className={gemPackage.popular ? "pt-8" : ""}>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <div className="text-3xl">💎</div>
                          </div>
                          <CardTitle className="text-xl font-bold text-foreground">
                            {gemPackage.amount} Gems
                          </CardTitle>
                        </div>
                      </CardHeader>

                      <CardContent className="text-center">
                        <div className="mb-4">
                          <div className="text-3xl font-bold text-foreground">
                            ${gemPackage.price}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            ${(gemPackage.price / gemPackage.amount).toFixed(3)}/gem
                          </div>
                        </div>

                        <Button 
                          onClick={() => navigate("/gem-shop")}
                          className={`w-full h-12 text-white font-bold text-lg ${gemPackage.popular 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25' 
                            : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                          }`}
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          Buy
                        </Button>
                      </CardContent>

                      {gemPackage.popular && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5 animate-pulse" />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              <div className="mt-8 text-center text-sm text-muted-foreground">
                <p>💳 Secure payment processing by Stripe</p>
                <p>✨ Currency added to your account instantly after payment</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </ParallaxBackground>
  );
}