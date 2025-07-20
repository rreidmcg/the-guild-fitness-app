import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { 
  Crown,
  Shield,
  Zap,
  Heart,
  Hand,
  Footprints,
  Plus,
  X
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EquipmentSlotsProps {
  userStats: any;
  wardrobeItems: any[];
}

interface EquipmentSlot {
  id: string;
  name: string;
  category: string;
  icon: any;
  position: 'left' | 'right';
  equippedItem?: any;
}

const rarityColors = {
  common: "border-gray-400",
  rare: "border-blue-400", 
  epic: "border-purple-400",
  legendary: "border-yellow-400"
};

export function EquipmentSlots({ userStats, wardrobeItems }: EquipmentSlotsProps) {
  const { toast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

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
      setSelectedSlot(null);
      toast({
        title: "Equipment Updated",
        description: "Your character's gear has been updated",
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
        title: "Equipment Removed",
        description: "Item has been unequipped",
      });
    }
  });

  // Equipment slots configuration
  const equipmentSlots: EquipmentSlot[] = [
    // Left side slots
    { id: "head", name: "Head", category: "head", icon: Crown, position: "left" },
    { id: "shoulders", name: "Shoulders", category: "shoulders", icon: Shield, position: "left" },
    { id: "chest", name: "Chest", category: "chest", icon: Heart, position: "left" },
    { id: "waist", name: "Waist", category: "waist", icon: Zap, position: "left" },
    
    // Right side slots
    { id: "neck", name: "Neck", category: "neck", icon: Zap, position: "right" },
    { id: "hands", name: "Hands", category: "hands", icon: Hand, position: "right" },
    { id: "legs", name: "Legs", category: "legs", icon: Shield, position: "right" },
    { id: "feet", name: "Feet", category: "feet", icon: Footprints, position: "right" },
  ];

  // Get equipped item for a category
  const getEquippedItem = (category: string) => {
    const fieldMap: Record<string, string> = {
      head: 'equippedHead',
      shoulders: 'equippedShoulders',
      neck: 'equippedNeck',
      chest: 'equippedChest',
      hands: 'equippedHands',
      waist: 'equippedWaist',
      legs: 'equippedLegs',
      feet: 'equippedFeet'
    };
    
    const field = fieldMap[category];
    const equippedName = userStats?.[field];
    
    if (!equippedName) return null;
    
    return wardrobeItems?.find(item => 
      item.category === category && 
      item.name === equippedName &&
      item.isOwned
    );
  };

  // Get available items for a category
  const getAvailableItems = (category: string) => {
    return wardrobeItems?.filter(item => 
      item.category === category && 
      item.isOwned && 
      !item.isEquipped
    ) || [];
  };

  const handleEquip = (itemId: number, category: string) => {
    equipItemMutation.mutate({ itemId, category });
  };

  const handleUnequip = (category: string) => {
    unequipItemMutation.mutate(category);
  };

  const leftSlots = equipmentSlots.filter(slot => slot.position === 'left');
  const rightSlots = equipmentSlots.filter(slot => slot.position === 'right');

  return (
    <div className="flex items-center justify-center space-x-8">
      {/* Left Equipment Slots */}
      <div className="flex flex-col space-y-4">
        {leftSlots.map((slot) => {
          const Icon = slot.icon;
          const equippedItem = getEquippedItem(slot.category);
          const isSelected = selectedSlot === slot.id;
          
          return (
            <div key={slot.id} className="relative">
              <Card 
                className={`w-16 h-16 cursor-pointer transition-all duration-200 ${
                  equippedItem ? `${rarityColors[equippedItem.rarity as keyof typeof rarityColors]} border-2` : 'border-dashed border-muted-foreground'
                } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedSlot(isSelected ? null : slot.id)}
              >
                <CardContent className="p-0 flex items-center justify-center h-full">
                  {equippedItem ? (
                    <div 
                      className="w-12 h-12 rounded flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: equippedItem.color }}
                    >
                      {equippedItem.name[0]}
                    </div>
                  ) : (
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>
              
              {/* Slot label */}
              <div className="text-xs text-center mt-1 text-muted-foreground">
                {slot.name}
              </div>
              
              {/* Item selector popup */}
              {isSelected && (
                <div className="absolute left-20 top-0 z-10 bg-card border border-border rounded-lg p-4 shadow-lg min-w-64">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{slot.name} Equipment</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedSlot(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Currently equipped */}
                  {equippedItem && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground mb-2">Currently Equipped:</p>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: equippedItem.color }}
                          >
                            {equippedItem.name[0]}
                          </div>
                          <span className="text-sm font-medium">{equippedItem.name}</span>
                          <Badge className={`${rarityColors[equippedItem.rarity as keyof typeof rarityColors]}`}>
                            {equippedItem.rarity}
                          </Badge>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleUnequip(slot.category)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Available items */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Available Items:</p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {getAvailableItems(slot.category).map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-2 bg-background rounded hover:bg-muted cursor-pointer"
                          onClick={() => handleEquip(item.id, slot.category)}
                        >
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: item.color }}
                            >
                              {item.name[0]}
                            </div>
                            <span className="text-sm font-medium">{item.name}</span>
                            <Badge className={`${rarityColors[item.rarity as keyof typeof rarityColors]}`}>
                              {item.rarity}
                            </Badge>
                          </div>
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                      {getAvailableItems(slot.category).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No items available for this slot
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Avatar in center */}
      <div className="flex flex-col items-center">
        <Avatar2D user={userStats} size="xl" />
        <div className="mt-4 text-center">
          <h3 className="font-bold text-lg">{userStats?.username || 'Player'}</h3>
          <p className="text-sm text-muted-foreground">Level {userStats?.level || 1}</p>
        </div>
      </div>

      {/* Right Equipment Slots */}
      <div className="flex flex-col space-y-4">
        {rightSlots.map((slot) => {
          const Icon = slot.icon;
          const equippedItem = getEquippedItem(slot.category);
          const isSelected = selectedSlot === slot.id;
          
          return (
            <div key={slot.id} className="relative">
              <Card 
                className={`w-16 h-16 cursor-pointer transition-all duration-200 ${
                  equippedItem ? `${rarityColors[equippedItem.rarity as keyof typeof rarityColors]} border-2` : 'border-dashed border-muted-foreground'
                } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedSlot(isSelected ? null : slot.id)}
              >
                <CardContent className="p-0 flex items-center justify-center h-full">
                  {equippedItem ? (
                    <div 
                      className="w-12 h-12 rounded flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: equippedItem.color }}
                    >
                      {equippedItem.name[0]}
                    </div>
                  ) : (
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>
              
              {/* Slot label */}
              <div className="text-xs text-center mt-1 text-muted-foreground">
                {slot.name}
              </div>
              
              {/* Item selector popup */}
              {isSelected && (
                <div className="absolute right-20 top-0 z-10 bg-card border border-border rounded-lg p-4 shadow-lg min-w-64">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{slot.name} Equipment</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedSlot(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Currently equipped */}
                  {equippedItem && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground mb-2">Currently Equipped:</p>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: equippedItem.color }}
                          >
                            {equippedItem.name[0]}
                          </div>
                          <span className="text-sm font-medium">{equippedItem.name}</span>
                          <Badge className={`${rarityColors[equippedItem.rarity as keyof typeof rarityColors]}`}>
                            {equippedItem.rarity}
                          </Badge>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleUnequip(slot.category)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Available items */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Available Items:</p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {getAvailableItems(slot.category).map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-2 bg-background rounded hover:bg-muted cursor-pointer"
                          onClick={() => handleEquip(item.id, slot.category)}
                        >
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: item.color }}
                            >
                              {item.name[0]}
                            </div>
                            <span className="text-sm font-medium">{item.name}</span>
                            <Badge className={`${rarityColors[item.rarity as keyof typeof rarityColors]}`}>
                              {item.rarity}
                            </Badge>
                          </div>
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                      {getAvailableItems(slot.category).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No items available for this slot
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}