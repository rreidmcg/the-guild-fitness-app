import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

// Import pixel art potion images
import minorPotionImage from "@assets/CA06160D-7763-41DC-A734-6F29760C0BD8_1753331144145.png";
import majorPotionImage from "@assets/E411AC73-DD9A-4E21-A550-8BC4020515A1_1753054064391.jpeg";
import fullPotionImage from "@assets/1E6048BE-FB34-44E6-ADA7-C01DB1832E42_1753068533574.png";
import manaPotionImage from "@assets/A78C5316-EC32-40FF-8919-E20BF97740B3_1753733597516.png";

interface InventoryItem {
  id: number;
  itemName: string;
  itemType: string; // Changed from category to itemType to match API
  quantity: number;
  description?: string;
  color?: string;
  rarity?: string; // Made optional since API might not always include it
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

// Item visual representations based on category and name
const getItemVisual = (item: InventoryItem) => {
  const { itemType, itemName, color, rarity } = item;
  
  // For potions, use pixel art images
  if (itemType === 'potion') {
    if (itemName.toLowerCase().includes('minor')) {
      return (
        <img 
          src={minorPotionImage} 
          alt="Minor Potion"
          className="w-full h-full object-contain"
          style={{ 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))',
            transform: 'scale(1.4)'
          }}
        />
      );
    }
    if (itemName.toLowerCase().includes('major')) {
      return (
        <img 
          src={majorPotionImage} 
          alt="Major Potion"
          className="w-full h-full object-contain"
          style={{ 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))',
            transform: 'scale(1.4)'
          }}
        />
      );
    }
    if (itemName.toLowerCase().includes('full')) {
      return (
        <img 
          src={fullPotionImage} 
          alt="Full Potion"
          className="w-full h-full object-contain"
          style={{ 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))',
            transform: 'scale(1.4)'
          }}
        />
      );
    }
    if (itemName.toLowerCase().includes('mana')) {
      return (
        <img 
          src={manaPotionImage} 
          alt="Mana Potion"
          className="w-full h-full object-contain"
          style={{ 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))',
            transform: 'scale(1.4)'
          }}
        />
      );
    }
    // Default potion fallback
    return (
      <img 
        src={minorPotionImage} 
        alt="Potion"
        className="w-full h-full object-contain"
        style={{ 
          imageRendering: 'pixelated',
          filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))',
          transform: 'scale(1.4)'
        }}
      />
    );
  }
  
  // For equipment, create SVG-based visuals
  const createEquipmentSVG = () => {
    let path = '';
    let viewBox = '0 0 24 24';
    
    switch (itemType) {
      case 'head':
        if (itemName.toLowerCase().includes('crown')) {
          path = 'M5 16L3 22h18l-2-6M12 2L8 6v4h8V6l-4-4zM8 10h8v2H8v-2z';
        } else if (itemName.toLowerCase().includes('helmet')) {
          path = 'M12 2C8 2 5 5 5 9v7h14V9c0-4-3-7-7-7zM7 14v-3h10v3H7z';
        } else {
          path = 'M12 2C8.69 2 6 4.69 6 8v8h12V8c0-3.31-2.69-6-6-6z';
        }
        break;
      case 'chest':
        if (itemName.toLowerCase().includes('chainmail')) {
          path = 'M12 2L8 6v10c0 3.31 2.69 6 6 6s6-2.69 6-6V6l-4-4zM10 8h4v8h-4V8z';
        } else if (itemName.toLowerCase().includes('dragonscale')) {
          path = 'M12 2L6 8v8c0 3.31 2.69 6 6 6s6-2.69 6-6V8l-6-6zM8 10l4-3 4 3v6c0 2.21-1.79 4-4 4s-4-1.79-4-4v-6z';
        } else {
          path = 'M12 2L7 7v9c0 2.76 2.24 5 5 5s5-2.24 5-5V7l-5-5z';
        }
        break;
      case 'hands':
        path = 'M9 5v2H7V5c0-1.1.9-2 2-2s2 .9 2 2zM7 9v6c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V9H7zM17 5v2h-2V5c0-1.1.9-2 2-2s2 .9 2 2z';
        break;
      case 'feet':
        path = 'M12 2C8.69 2 6 4.69 6 8v4l2 8h8l2-8V8c0-3.31-2.69-6-6-6zM8 8c0-2.21 1.79-4 4-4s4 1.79 4 4v3H8V8z';
        break;
      case 'neck':
        path = 'M12 2l-2 4v4c0 2.21 1.79 4 4 4s4-1.79 4-4V6l-2-4-4 0zM10 8l2-2 2 2v2c0 1.1-.9 2-2 2s-2-.9-2-2V8z';
        break;
      case 'shoulders':
        path = 'M4 8l4-4h8l4 4v6l-2 6H6l-2-6V8zM6 10v4l1 4h10l1-4v-4H6z';
        break;
      case 'waist':
        path = 'M8 6l8 0c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2zM10 8v8h4V8h-4z';
        break;
      case 'legs':
        path = 'M9 2h6c1.1 0 2 .9 2 2v12l-2 6h-2l-1-6v-6l-1 6-1 6H8l-2-6V4c0-1.1.9-2 2-2h1z';
        break;
      default:
        path = 'M12 2L6 8v8c0 3.31 2.69 6 6 6s6-2.69 6-6V8l-6-6z';
    }
    
    return (
      <svg 
        viewBox={viewBox} 
        className="w-full h-full" 
        fill={color || '#666'}
        stroke="currentColor" 
        strokeWidth="1"
      >
        <path d={path} />
      </svg>
    );
  };
  
  return createEquipmentSVG();
};

export default function Inventory() {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [itemActionDialog, setItemActionDialog] = useState<{ open: boolean; item: InventoryItem | null }>({ open: false, item: null });
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ open: boolean; item: InventoryItem | null }>({ open: false, item: null });
  const { toast } = useToast();

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Mutation for using potions
  const usePotionMutation = useMutation({
    mutationFn: async (itemName: string) => {
      return apiRequest(`/api/use-potion`, {
        method: 'POST',
        body: JSON.stringify({ potionType: itemName }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Potion Used",
        description: data.message || "Potion used successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      setItemActionDialog({ open: false, item: null });
    },
    onError: (error: any) => {
      const message = error.message || "Could not use the potion";
      const isFullHealthOrMana = message.includes("full health") || message.includes("full mana");
      
      toast({
        title: isFullHealthOrMana ? "Potion Not Needed" : "Failed to Use Potion",
        description: message,
        variant: isFullHealthOrMana ? "default" : "destructive",
      });
    }
  });

  // Mutation for deleting items
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest(`/api/delete-item/${itemId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Item Deleted",
        description: "Item has been removed from your inventory",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setDeleteConfirmDialog({ open: false, item: null });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Item",
        description: error.message || "Could not delete the item",
        variant: "destructive",
      });
    }
  });

  // Create a 50-slot grid (5x10)
  const totalSlots = 50;
  const slotsPerRow = 5;
  const inventoryGrid = Array(totalSlots).fill(null);

  // Fill the grid with inventory items
  (inventory as InventoryItem[] || []).forEach((item: InventoryItem, index: number) => {
    if (index < totalSlots) {
      inventoryGrid[index] = item;
    }
  });

  const getItemIcon = (itemType: string) => {
    const IconComponent = categoryIcons[itemType as keyof typeof categoryIcons] || Package;
    return IconComponent;
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
        onClick={() => {
          if (item) {
            setItemActionDialog({ open: true, item });
          } else {
            setSelectedSlot(selectedSlot === index ? null : index);
          }
        }}
      >
        {item ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full h-full p-1 flex flex-col items-center justify-center relative">
                {/* Item Visual */}
                <div className="w-8 h-8 rounded flex items-center justify-center mb-1 overflow-hidden">
                  {typeof getItemVisual(item) === 'string' ? (
                    <span className="text-lg">{getItemVisual(item)}</span>
                  ) : (
                    <div className="w-6 h-6">
                      {getItemVisual(item)}
                    </div>
                  )}
                </div>
                
                {/* Quantity - Always show if > 0 */}
                {item.quantity > 0 && (
                  <div className="absolute bottom-1 right-1 text-xs px-1.5 py-0.5 min-w-[20px] text-center font-bold" style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {item.quantity}
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
            {/* Empty slot - no number */}
          </div>
        )}
      </div>
    );
  };

  // Calculate total potion count
  const totalPotions = (inventory as InventoryItem[] || [])
    .filter((item: InventoryItem) => item.itemType === 'potion')
    .reduce((sum: number, item: InventoryItem) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Manage your items and equipment • {Array.isArray(inventory) ? inventory.length : 0}/{totalSlots} slots used
              </p>
            </div>

          </div>
        </div>
      </div>

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
                      {typeof getItemVisual(inventoryGrid[selectedSlot]) === 'string' ? (
                        <span className="text-3xl">{getItemVisual(inventoryGrid[selectedSlot])}</span>
                      ) : (
                        <div className="w-10 h-10">
                          {getItemVisual(inventoryGrid[selectedSlot])}
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
                    {inventoryGrid[selectedSlot].itemType === 'potion' && (
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

        {/* Item Action Dialog */}
        <Dialog open={itemActionDialog.open} onOpenChange={(open) => !open && setItemActionDialog({ open: false, item: null })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Item Actions</DialogTitle>
              <DialogDescription>
                {itemActionDialog.item?.itemName} - What would you like to do?
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-4 py-4">
              <div className="w-16 h-16 rounded flex items-center justify-center overflow-hidden border border-border">
                {itemActionDialog.item && (
                  <>
                    {typeof getItemVisual(itemActionDialog.item) === 'string' ? (
                      <span className="text-4xl">{getItemVisual(itemActionDialog.item)}</span>
                    ) : (
                      <div className="w-12 h-12">
                        {getItemVisual(itemActionDialog.item)}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{itemActionDialog.item?.itemName}</h3>
                <p className="text-sm text-muted-foreground">{itemActionDialog.item?.description || 'No description available'}</p>
                <p className="text-xs text-muted-foreground mt-1">Quantity: {itemActionDialog.item?.quantity}</p>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {itemActionDialog.item?.itemType === 'potion' && (
                <Button 
                  onClick={() => usePotionMutation.mutate(itemActionDialog.item!.itemName)}
                  disabled={usePotionMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Use Potion
                </Button>
              )}
              <Button 
                variant="destructive"
                onClick={() => {
                  setItemActionDialog({ open: false, item: null });
                  setDeleteConfirmDialog({ open: true, item: itemActionDialog.item });
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Item
              </Button>
              <Button variant="outline" onClick={() => setItemActionDialog({ open: false, item: null })}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmDialog.open} onOpenChange={(open) => !open && setDeleteConfirmDialog({ open: false, item: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteConfirmDialog.item?.itemName}"? 
                {deleteConfirmDialog.item?.quantity && deleteConfirmDialog.item.quantity > 1 
                  ? ` This will delete all ${deleteConfirmDialog.item.quantity} items.` 
                  : ''
                } This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteItemMutation.mutate(deleteConfirmDialog.item!.id)}
                disabled={deleteItemMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteItemMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}