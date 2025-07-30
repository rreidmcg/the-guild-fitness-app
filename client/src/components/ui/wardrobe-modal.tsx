import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getTitleComponent } from "@/lib/title-rarity";
import { Crown, Shirt, Check } from "lucide-react";

interface WardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

// Define available titles based on dungeon boss progression system
const AVAILABLE_TITLES = [
  { name: "Recruit", rarity: "common", requirement: "Starting title (E-rank: Lv 1-10)" },
  { name: "Goblin Slayer", rarity: "common", requirement: "Defeat Goblin King (E-rank: Lv 1-10)" },
  { name: "Orc Crusher", rarity: "uncommon", requirement: "Defeat Orc Warlord (D-rank: Lv 11-20)" },
  { name: "Dragon Vanquisher", rarity: "rare", requirement: "Defeat Ancient Wyrm (C-rank: Lv 21-30)" },
  { name: "Demon Hunter", rarity: "epic", requirement: "Defeat Demon Lord (B-rank: Lv 31-40) - In Development" },
  { name: "Titan Slayer", rarity: "legendary", requirement: "Defeat Primordial Titan (A-rank: Lv 41-50) - In Development" },
  { name: "God Killer", rarity: "mythic", requirement: "Defeat Fallen God (S-rank: Lv 51+) - In Development" },
  { name: "The First Flame", rarity: "legendary", requirement: "Founders Pack Exclusive" },
  { name: "<G.M.>", rarity: "relic", requirement: "Admin Only" },
];

// Define available avatar skins
const AVAILABLE_SKINS = [
  { name: "Default Male", id: "male", requirement: "Default", preview: "male" },
  { name: "Default Female", id: "female", requirement: "Default", preview: "female" },
  { name: "The Legendary Hunter (Male)", id: "legendary_hunter_male", requirement: "Founders Pack Exclusive", preview: "legendary_hunter", gender: "male" },
  { name: "The Legendary Hunter (Female)", id: "legendary_hunter_female", requirement: "Founders Pack Exclusive", preview: "legendary_hunter", gender: "female" },
  { name: "G.M. Avatar", id: "gm_avatar", requirement: "Admin Only", preview: "gm_avatar" },
];

export function WardrobeModal({ isOpen, onClose, user }: WardrobeModalProps) {
  const { toast } = useToast();
  const [selectedTitle, setSelectedTitle] = useState(user?.currentTitle || "Recruit");
  
  // Set default selected skin based on user's current status
  const getDefaultSkin = () => {
    if (user?.title === "The First Flame" || user?.hasLegendaryHunterSkin) {
      return user?.gender === "female" ? "legendary_hunter_female" : "legendary_hunter_male";
    }
    return user?.gender || "male";
  };
  
  const [selectedSkin, setSelectedSkin] = useState(getDefaultSkin());

  // Update title mutation
  const updateTitleMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const response = await apiRequest("/api/user/update-title", {
        method: "PATCH",
        body: { title: newTitle },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Title Updated",
        description: "Your character title has been changed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Title",
        description: error.message || "Unable to change title",
        variant: "destructive",
      });
    },
  });

  // Update avatar skin mutation
  const updateSkinMutation = useMutation({
    mutationFn: async (newSkin: string) => {
      const response = await apiRequest("/api/user/update-avatar", {
        method: "PATCH",
        body: { gender: newSkin },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Avatar Updated",
        description: "Your character appearance has been changed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Avatar",
        description: error.message || "Unable to change avatar",
        variant: "destructive",
      });
    },
  });

  // Check if user has earned a title based on dungeon progression
  const hasEarnedTitle = (title: string) => {
    const username = user?.username?.toLowerCase();
    
    // Zero has access to ALL titles
    if (username === "zero") return true;
    
    if (title === "Recruit") return true; // Starting title
    // G.M. title is only available to Zero and Rob
    if (title === "<G.M.>") {
      return username === "rob";
    }
    if (title === "The First Flame" && (user?.currentTitle === "The First Flame" || user?.hasLegendaryHunterSkin)) return true;
    
    // Boss-based progression titles - based on level ranges
    const userLevel = user?.level || 1;
    if (title === "Goblin Slayer" && userLevel >= 10) return true; // Defeat Goblin King (Lv 1-10)
    if (title === "Orc Crusher" && userLevel >= 20) return true; // Defeat Orc Warlord (Lv 11-20)  
    if (title === "Dragon Vanquisher" && userLevel >= 30) return true; // Defeat Ancient Wyrm (Lv 21-30)
    
    // Higher rank boss titles are locked for future development
    if (title === "Demon Hunter" || title === "Titan Slayer" || title === "God Killer") {
      return false; // In Development
    }
    
    return false;
  };

  // Check if user has earned a skin
  const hasEarnedSkin = (skinId: string) => {
    const username = user?.username?.toLowerCase();
    
    // Zero has access to ALL skins
    if (username === "zero") return true;
    
    if (skinId === "male" || skinId === "female") return true;
    if ((skinId === "legendary_hunter_male" || skinId === "legendary_hunter_female") && (user?.currentTitle === "The First Flame" || user?.hasLegendaryHunterSkin)) return true;
    if (skinId === "gm_avatar") {
      return username === "rob";
    }
    return false;
  };

  const handleApplyChanges = () => {
    if (selectedTitle !== user?.currentTitle) {
      updateTitleMutation.mutate(selectedTitle);
    }
    
    // Convert legendary hunter skin IDs back to gender-based system for backend compatibility
    let genderToSend = selectedSkin;
    if (selectedSkin === "legendary_hunter_male") {
      genderToSend = "male";
    } else if (selectedSkin === "legendary_hunter_female") {
      genderToSend = "female";
    }
    
    if (genderToSend !== user?.gender) {
      updateSkinMutation.mutate(genderToSend);
    }
    
    if (selectedTitle === user?.currentTitle && genderToSend === user?.gender) {
      toast({
        title: "No Changes",
        description: "Your current title and avatar are already selected.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shirt className="w-6 h-6 text-purple-400" />
            Character Wardrobe
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="titles" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="titles" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Titles
            </TabsTrigger>
            <TabsTrigger value="avatars" className="flex items-center gap-2">
              <Shirt className="w-4 h-4" />
              Avatar Skins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="titles" className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Character Titles</h3>
              <p className="text-sm text-muted-foreground">Titles are earned through progression and show your achievements</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_TITLES.filter(title => {
                // Hide G.M. title from everyone except Zero and Rob
                if (title.name === "<G.M.>") {
                  const username = user?.username?.toLowerCase();
                  return username === "zero" || username === "rob";
                }
                return true;
              }).map((title) => {
                const isEarned = hasEarnedTitle(title.name);
                const isSelected = selectedTitle === title.name;
                const titleComponent = getTitleComponent(title.name, "sm");

                return (
                  <Card 
                    key={title.name}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected ? "ring-2 ring-purple-500 bg-purple-900/20" : "hover:bg-gray-800"
                    } ${!isEarned ? "opacity-50" : ""}`}
                    onClick={() => isEarned && setSelectedTitle(title.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className={titleComponent.className}>
                          {titleComponent.displayTitle || title.name}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-green-400" />}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{title.requirement}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${isEarned ? "text-green-400 border-green-400" : "text-red-400 border-red-400"}`}
                      >
                        {isEarned ? "Earned" : "Locked"}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="avatars" className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Avatar Skins</h3>
              <p className="text-sm text-muted-foreground">Change your character's appearance with earned avatar skins</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_SKINS.map((skin) => {
                const isEarned = hasEarnedSkin(skin.id);
                const isSelected = selectedSkin === skin.id;

                return (
                  <Card 
                    key={skin.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected ? "ring-2 ring-purple-500 bg-purple-900/20" : "hover:bg-gray-800"
                    } ${!isEarned ? "opacity-50" : ""}`}
                    onClick={() => isEarned && setSelectedSkin(skin.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        <div className={`mb-3 border-2 rounded-lg p-2 ${
                          (skin.id === "legendary_hunter_male" || skin.id === "legendary_hunter_female") 
                            ? "border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 shadow-lg shadow-yellow-500/25" 
                            : "border-gray-600"
                        }`}>
                          <Avatar2D 
                            user={{ 
                              ...user, 
                              gender: skin.id === "gm_avatar" ? "gm_avatar" : (skin.preview === "legendary_hunter" ? skin.gender : skin.preview),
                              title: (skin.id === "legendary_hunter_male" || skin.id === "legendary_hunter_female") ? "The First Flame" : skin.id === "gm_avatar" ? "<G.M.>" : user?.title,
                              hasLegendaryHunterSkin: (skin.id === "legendary_hunter_male" || skin.id === "legendary_hunter_female"),
                              customAvatarUrl: skin.id === "gm_avatar" ? "/src/assets/IMG_3731_1753561497035.png" : undefined
                            }} 
                            size="md" 
                          />
                        </div>
                        <div className="flex items-center justify-between w-full mb-2">
                          <h4 className="font-semibold text-foreground">{skin.name}</h4>
                          {isSelected && <Check className="w-4 h-4 text-green-400" />}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 text-center">{skin.requirement}</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${isEarned ? "text-green-400 border-green-400" : "text-red-400 border-red-400"}`}
                        >
                          {isEarned ? "Earned" : "Locked"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={handleApplyChanges}
            disabled={updateTitleMutation.isPending || updateSkinMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {updateTitleMutation.isPending || updateSkinMutation.isPending ? "Applying..." : "Apply Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}