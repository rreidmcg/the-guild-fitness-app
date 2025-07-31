import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Send } from "lucide-react";
import { useLocation } from "wouter";

interface AppRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppRequestModal({ isOpen, onClose }: AppRequestModalProps) {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  const submitRequestMutation = useMutation({
    mutationFn: async (data: {
      category: string;
      title: string;
      description: string;
      priority: string;
      currentPage: string;
    }) => {
      const response = await fetch("/api/app-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit request");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Request Submitted Successfully!",
        description: data.message || "Thanks for your feedback. We'll review your request soon.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/app-requests"] });
      
      // Reset form
      setCategory("");
      setTitle("");
      setDescription("");
      setPriority("medium");
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !title || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    submitRequestMutation.mutate({
      category,
      title,
      description,
      priority,
      currentPage: location,
    });
  };

  const categoryOptions = [
    { value: "feature_request", label: "New Feature Request" },
    { value: "bug_report", label: "Bug Report" },
    { value: "improvement", label: "Improvement Suggestion" },
    { value: "general_feedback", label: "General Feedback" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low Priority" },
    { value: "medium", label: "Medium Priority" },
    { value: "high", label: "High Priority" },
    { value: "critical", label: "Critical Issue" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-black/90 border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertCircle className="h-5 w-5 text-orange-400" />
            Submit App Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-white">
              Request Type *
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-black/30 border-white/30 text-white">
                <SelectValue placeholder="Select request type..." />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your request..."
              className="bg-black/30 border-white/30 text-white placeholder:text-white/50"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about your request. Include steps to reproduce for bug reports, or specific details for feature requests..."
              className="bg-black/30 border-white/30 text-white placeholder:text-white/50 min-h-[100px]"
              maxLength={500}
            />
            <div className="text-xs text-white/50 text-right">
              {description.length}/500 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-white">
              Priority Level
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-black/30 border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-black/30 border-white/30 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitRequestMutation.isPending || !category || !title || !description}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {submitRequestMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Submit Request
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}