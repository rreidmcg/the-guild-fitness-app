import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Package, 
  Coins, 
  Crown,
  Shirt,
  Zap,
  Footprints,
  Star,
  Sparkles,
  Heart,
  Plus,
  Trash2
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import minorHealingPotionImage from "@assets/CA06160D-7763-41DC-A734-6F29760C0BD8_1753214477623.png";
import majorHealingPotionImage from "@assets/1860C3F1-AEFB-419D-BAB2-306C00CA6321_1753215117108.png";

interface InventoryItem {
  id: number;
  itemName: string;
  category: string;
  rarity: string;
  quantity: number;
  description?: string;
  color?: string;
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
  feet: Footprints,
  potion: Heart
};

export default function Inventory() {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Create a 50-slot grid (5x10)
  const totalSlots = 50;
  const slotsPerRow = 5;
  const inventoryGrid = Array(totalSlots).fill(null);

  // Fill the grid with inventory items
  inventory.forEach((item: InventoryItem, index: number) => {
    if (index < totalSlots) {
      inventoryGrid[index] = item;
    }
  });

  const getItemIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Package;
    return IconComponent;
  };

  const getItemImage = (itemName: string) => {
    const itemNameLower = itemName.toLowerCase();
    if (itemNameLower.includes('minor healing potion')) {
      return minorHealingPotionImage;
    }
    if (itemNameLower.includes('major healing potion')) {
      return majorHealingPotionImage;
    }
    return null;
  };

  const renderSlot = (index: number) => {
    const item = inventoryGrid[index];
    const isEmpty = !item;

    return (
      <div
        key={index}
        className={`
          relative aspect-square border-2 rounded-lg flex items-center justify-center
          ${isEmpty 
            ? 'border-border bg-muted/30 hover:bg-muted/50' 
            : 'border-border bg-card hover:bg-accent'
          }
          ${selectedSlot === index ? 'ring-2 ring-primary' : ''}
          cursor-pointer transition-colors
        `}
        onClick={() => setSelectedSlot(selectedSlot === index ? null : index)}
      >
        {item ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full h-full p-1 flex flex-col items-center justify-center relative">
                {/* Item Visual */}
                <div className="w-8 h-8 rounded flex items-center justify-center mb-1 overflow-hidden">
                  {getItemImage(item.itemName) ? (
                    <img 
                      src={getItemImage(item.itemName)!} 
                      alt={item.itemName}
                      className="w-full h-full object-contain"
                    />
                  ) : item.category === 'potion' ? (
                    <span className="text-lg">🧪</span>
                  ) : (
                    <div 
                      className="w-full h-full rounded flex items-center justify-center"
                      style={{ backgroundColor: item.color || '#666' }}
                    >
                      <span className="text-white text-xs font-bold">
                        {item.itemName[0]}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Quantity - Show for any quantity > 1, max 99 */}
                {item.quantity > 1 && (
                  <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground text-xs rounded px-1 min-w-[16px] text-center">
                    {Math.min(item.quantity, 99)}
                  </div>
                )}
                
                {/* Rarity indicator */}
                <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${rarityColors[item.rarity as keyof typeof rarityColors]}`} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div className="font-medium">{item.itemName}</div>
                {item.description && (
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                )}
                <div className="flex items-center space-x-2 text-xs">
                  <Badge className={`${rarityColors[item.rarity as keyof typeof rarityColors]} text-white`}>
                    {item.rarity}
                  </Badge>
                  <span>Qty: {item.quantity}</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="text-muted-foreground/50 text-xs">
            {index + 1}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <PageHeader 
        title="Inventory" 
        subtitle={`Manage your items and equipment • ${inventory.length}/${totalSlots} slots used`}
      />

      <div className="max-w-4xl mx-auto p-6">
        {/* Inventory Grid */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Storage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3 mb-6">
              {Array.from({ length: totalSlots }, (_, index) => renderSlot(index))}
            </div>
            
            {selectedSlot !== null && inventoryGrid[selectedSlot] && (
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded flex items-center justify-center overflow-hidden">
                      {getItemImage(inventoryGrid[selectedSlot].itemName) ? (
                        <img 
                          src={getItemImage(inventoryGrid[selectedSlot].itemName)!} 
                          alt={inventoryGrid[selectedSlot].itemName}
                          className="w-full h-full object-contain"
                        />
                      ) : inventoryGrid[selectedSlot].category === 'potion' ? (
                        <span className="text-2xl">🧪</span>
                      ) : (
                        <div 
                          className="w-full h-full rounded flex items-center justify-center"
                          style={{ backgroundColor: inventoryGrid[selectedSlot].color || '#666' }}
                        >
                          <span className="text-white font-bold">
                            {inventoryGrid[selectedSlot].itemName[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{inventoryGrid[selectedSlot].itemName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {inventoryGrid[selectedSlot].description || 'No description available'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`${rarityColors[inventoryGrid[selectedSlot].rarity as keyof typeof rarityColors]} text-white`}>
                          {inventoryGrid[selectedSlot].rarity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Quantity: {inventoryGrid[selectedSlot].quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {inventoryGrid[selectedSlot].category === 'potion' && (
                      <Button size="sm" variant="outline">
                        <Heart className="w-4 h-4 mr-2" />
                        Use
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Drop
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Package className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-lg font-bold">{inventory.length}</div>
              <div className="text-xs text-muted-foreground">Items</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
              <div className="text-lg font-bold">
                {inventory.filter((item: InventoryItem) => item.category === 'potion' && item.itemName.includes('Healing')).reduce((sum: number, item: InventoryItem) => sum + item.quantity, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Health Potions</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-lg font-bold">
                {inventory.filter((item: InventoryItem) => item.category === 'potion' && item.itemName.includes('Mana')).reduce((sum: number, item: InventoryItem) => sum + item.quantity, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Mana Potions</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Crown className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-lg font-bold">
                {inventory.filter((item: InventoryItem) => item.category !== 'potion').length}
              </div>
              <div className="text-xs text-muted-foreground">Equipment</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}