import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertCustomAvatarSchema } from "@shared/schema";
import type { CustomAvatar } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ui/object-uploader";
import { Trash2, Edit, Upload, ImageIcon, Save, X, Eye, EyeOff } from "lucide-react";
import type { UploadResult } from "@uppy/core";

const formSchema = insertCustomAvatarSchema.extend({
  price: z.coerce.number().min(0, "Price must be at least 0"),
});

type FormData = z.infer<typeof formSchema>;

const rarityOptions = [
  { value: "common", label: "Common", color: "bg-gray-500" },
  { value: "rare", label: "Rare", color: "bg-blue-500" },
  { value: "epic", label: "Epic", color: "bg-purple-500" },
  { value: "legendary", label: "Legendary", color: "bg-yellow-500" },
];

const currencyOptions = [
  { value: "gold", label: "Gold" },
  { value: "gems", label: "Gems" },
];

export function AdminAvatarManager() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState<CustomAvatar | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      rarity: "common",
      price: 0,
      currency: "gold",
      isActive: true,
    },
  });

  const { data: avatars = [], isLoading, error } = useQuery<CustomAvatar[]>({
    queryKey: ["/api/admin/avatars"],
    staleTime: 30000,
  });

  const createAvatarMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/admin/avatars", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/avatars"] });
      setIsCreateModalOpen(false);
      form.reset();
      setUploadedImageUrl("");
      toast({
        title: "Success",
        description: "Avatar created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create avatar",
        variant: "destructive",
      });
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CustomAvatar> }) => {
      return await apiRequest(`/api/admin/avatars/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/avatars"] });
      setEditingAvatar(null);
      form.reset();
      setUploadedImageUrl("");
      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update avatar",
        variant: "destructive",
      });
    },
  });

  const toggleAvatarMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest(`/api/admin/avatars/${id}/toggle`, {
        method: "PUT",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/avatars"] });
      toast({
        title: "Success",
        description: "Avatar status updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update avatar status",
        variant: "destructive",
      });
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/avatars/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/avatars"] });
      toast({
        title: "Success",
        description: "Avatar deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete avatar",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("/api/admin/avatars/upload-url", {
        method: "POST",
      });
      return {
        method: "PUT" as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error("Failed to get upload URL:", error);
      throw error;
    }
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageUrl = uploadedFile.uploadURL;
      setUploadedImageUrl(imageUrl);
      form.setValue("imageUrl", imageUrl);
      toast({
        title: "Success",
        description: "Avatar image uploaded successfully!",
      });
    }
  };

  const onSubmit = (data: FormData) => {
    if (!data.imageUrl && !uploadedImageUrl) {
      toast({
        title: "Error",
        description: "Please upload an avatar image",
        variant: "destructive",
      });
      return;
    }

    const finalData = {
      ...data,
      imageUrl: uploadedImageUrl || data.imageUrl,
    };

    if (editingAvatar) {
      updateAvatarMutation.mutate({ id: editingAvatar.id, data: finalData });
    } else {
      createAvatarMutation.mutate(finalData);
    }
  };

  const handleEdit = (avatar: CustomAvatar) => {
    setEditingAvatar(avatar);
    form.reset({
      name: avatar.name,
      description: avatar.description || "",
      imageUrl: avatar.imageUrl,
      rarity: avatar.rarity,
      price: avatar.price,
      currency: avatar.currency,
      isActive: avatar.isActive,
    });
    setUploadedImageUrl(avatar.imageUrl);
    setIsCreateModalOpen(true);
  };

  const handleCancel = () => {
    setIsCreateModalOpen(false);
    setEditingAvatar(null);
    form.reset();
    setUploadedImageUrl("");
  };

  const getRarityColor = (rarity: string) => {
    const option = rarityOptions.find(opt => opt.value === rarity);
    return option?.color || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avatar Management</CardTitle>
          <CardDescription>Loading avatars...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avatar Management</CardTitle>
          <CardDescription>Error loading avatars</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load avatars. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="avatar-manager">
      <CardHeader>
        <div className="avatar-manager__header flex justify-between items-center">
          <div>
            <CardTitle>Avatar Management</CardTitle>
            <CardDescription>
              Manage custom avatars, set rarity levels, and configure pricing
            </CardDescription>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="avatar-manager__create-btn">
                <Upload className="h-4 w-4 mr-2" />
                Add New Avatar
              </Button>
            </DialogTrigger>
            <DialogContent className="avatar-manager__modal max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAvatar ? "Edit Avatar" : "Create New Avatar"}
                </DialogTitle>
                <DialogDescription>
                  {editingAvatar 
                    ? "Update the avatar details and settings"
                    : "Upload a new avatar and configure its properties"
                  }
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="avatar-manager__form space-y-6">
                  {/* Image Upload Section */}
                  <div className="avatar-manager__upload-section">
                    <Label>Avatar Image</Label>
                    <div className="flex items-center gap-4">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleUploadComplete}
                        buttonClassName="avatar-manager__upload-btn"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {uploadedImageUrl ? "Change Image" : "Upload Image"}
                      </ObjectUploader>
                      {uploadedImageUrl && (
                        <div className="avatar-manager__preview">
                          <img 
                            src={uploadedImageUrl} 
                            alt="Avatar preview" 
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="avatar-manager__fields grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Information */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter avatar name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rarity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rarity</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rarity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {rarityOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${option.color}`} />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencyOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter avatar description..." 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="avatar-manager__actions flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancel}
                      className="avatar-manager__cancel-btn"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createAvatarMutation.isPending || updateAvatarMutation.isPending}
                      className="avatar-manager__save-btn"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingAvatar ? "Update Avatar" : "Create Avatar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="avatar-manager__content">
        {avatars.length === 0 ? (
          <div className="avatar-manager__empty text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Avatars Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first custom avatar to get started
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Add First Avatar
            </Button>
          </div>
        ) : (
          <div className="avatar-manager__grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avatars.map((avatar) => (
              <Card key={avatar.id} className="avatar-manager__card">
                <CardContent className="p-4">
                  <div className="avatar-manager__card-header flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getRarityColor(avatar.rarity)}`} />
                      <h4 className="font-semibold truncate">{avatar.name}</h4>
                    </div>
                    <Badge variant={avatar.isActive ? "default" : "secondary"}>
                      {avatar.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="avatar-manager__card-image mb-3">
                    <img 
                      src={avatar.imageUrl} 
                      alt={avatar.name}
                      className="w-full h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.src = "/api/placeholder/150/150";
                      }}
                    />
                  </div>

                  <div className="avatar-manager__card-details space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">
                        {avatar.price} {avatar.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Rarity:</span>
                      <span className="font-medium capitalize">{avatar.rarity}</span>
                    </div>
                    {avatar.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {avatar.description}
                      </p>
                    )}
                  </div>

                  <div className="avatar-manager__card-actions flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(avatar)}
                      className="avatar-manager__edit-btn flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAvatarMutation.mutate({ 
                        id: avatar.id, 
                        isActive: !avatar.isActive 
                      })}
                      disabled={toggleAvatarMutation.isPending}
                      className="avatar-manager__toggle-btn"
                    >
                      {avatar.isActive ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this avatar?")) {
                          deleteAvatarMutation.mutate(avatar.id);
                        }
                      }}
                      disabled={deleteAvatarMutation.isPending}
                      className="avatar-manager__delete-btn"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}