import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { validateUsername, formatUsernameInput } from "@/utils/username-validation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar2D } from "@/components/ui/avatar-2d";

interface ProfileEditDialogProps {
  children: React.ReactNode;
}

export function ProfileEditDialog({ children }: ProfileEditDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const [formData, setFormData] = useState({
    username: "",
    gender: "male",
  });

  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Update form data when user stats change
  useEffect(() => {
    if (userStats) {
      setFormData({
        username: (userStats as any).username || "",
        gender: (userStats as any).gender || "male",
      });
      setUsernameError(null);
    }
  }, [userStats]);

  const handleUsernameChange = (value: string) => {
    const formatted = formatUsernameInput(value);
    setFormData(prev => ({ ...prev, username: formatted }));
    
    // Validate username in real-time
    if (formatted) {
      const validation = validateUsername(formatted);
      setUsernameError(validation.isValid ? null : validation.error || null);
    } else {
      setUsernameError(null);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { username?: string; gender?: string }) => {
      // Validate username before submission
      if (updates.username) {
        const validation = validateUsername(updates.username);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
      }
      
      console.log("Mutation received updates:", updates);
      console.log("Current userStats:", userStats);
      
      // Split updates into profile and gender updates
      const { gender, ...profileUpdates } = updates;
      
      console.log("Profile updates:", profileUpdates);
      console.log("Gender update:", gender, "vs current:", (userStats as any)?.gender);
      
      // Update profile first
      if (Object.keys(profileUpdates).length > 0) {
        try {
          const profileResult = await apiRequest("/api/user/profile", {
            method: "PATCH",
            body: profileUpdates,
          });
          console.log("Profile update result:", profileResult);
        } catch (error) {
          console.error("Profile update error:", error);
          throw error;
        }
      }
      
      // Update gender if changed
      if (gender && gender !== (userStats as any)?.gender) {
        const genderResult = await apiRequest("/api/user/gender", {
          method: "PATCH",
          body: { gender },
        });
        console.log("Gender update result:", genderResult);
      }
      
      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      setOpen(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
    },
    onError: (error) => {
      console.error("Update profile mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation check
    if (usernameError) {
      toast({
        title: "Invalid Username",
        description: usernameError,
        variant: "destructive",
      });
      return;
    }
    
    console.log("Submitting form data:", formData);
    updateProfileMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your character profile and appearance settings.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          {/* Avatar Preview */}
          <div className="flex justify-center">
            <Avatar2D user={{...(userStats as any), ...formData}} size="sm" />
          </div>

          {/* Gender Selection */}
          <div className="space-y-2">
            <Label>Avatar Gender</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={formData.gender === "male" ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData({ ...formData, gender: "male" })}
              >
                Male
              </Button>
              <Button
                type="button"
                variant={formData.gender === "female" ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData({ ...formData, gender: "female" })}
              >
                Female
              </Button>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Enter username (letters and spaces only)"
              maxLength={20}
              className={`placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0 ${usernameError ? "border-red-500" : ""}`}
            />
            {usernameError && (
              <p className="text-sm text-red-500">{usernameError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              2-20 characters, letters and spaces only
            </p>
          </div>



          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending || !!usernameError}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}