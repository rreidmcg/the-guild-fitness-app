import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Clock, Shield } from "lucide-react";

export default function DemoAdmin() {
  const [description, setDescription] = useState("");
  const [magicLink, setMagicLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateMagicLink = async () => {
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a description for this magic link.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/generate-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Server response:", response.status, errorData);
        throw new Error(`Server error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      setMagicLink(data.magicLink);
      
      toast({
        title: "Magic Link Generated",
        description: "Demo access link has been created successfully.",
      });
    } catch (error) {
      console.error("Magic link generation error:", error);
      toast({
        title: "Generation Failed", 
        description: `Failed to generate magic link: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(magicLink);
      toast({
        title: "Copied!",
        description: "Magic link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Demo Access Generator
        </h1>
        <p className="text-muted-foreground text-center">
          Create secure magic links for external audits and demonstrations
        </p>
      </div>

      <div className="grid gap-6">
        {/* Generation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Generate New Magic Link
            </CardTitle>
            <CardDescription>
              Create a secure demo access link that bypasses authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., External Security Audit - Q1 2025"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isGenerating}
              />
              <p className="text-sm text-muted-foreground">
                Enter a description to identify the purpose of this magic link
              </p>
            </div>
            
            <Button 
              onClick={generateMagicLink} 
              disabled={isGenerating || !description.trim()}
              className="w-full"
            >
              {isGenerating ? "Generating..." : "Generate Magic Link"}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Link Display */}
        {magicLink && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                Generated Magic Link
              </CardTitle>
              <CardDescription>
                Share this link with external auditors or demo users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Demo Access URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={magicLink} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    onClick={copyToClipboard}
                    variant="outline"
                    size="icon"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">
                      Important Security Notes
                    </h4>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                      <li>• Link expires in 24 hours</li>
                      <li>• Single-use only (becomes invalid after first access)</li>
                      <li>• Creates a temporary demo account with sample data</li>
                      <li>• Demo account is automatically cleaned up after expiry</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  onClick={() => {
                    setMagicLink("");
                    setDescription("");
                  }}
                  variant="outline"
                >
                  Clear
                </Button>
                <Button 
                  onClick={() => window.open(magicLink, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Test Link
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">For External Auditors:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                <li>Click the provided magic link</li>
                <li>Automatically logged into a demo account</li>
                <li>Explore the full application functionality</li>
                <li>No registration or credentials required</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Demo Account Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Pre-populated with sample workout data</li>
                <li>Level 3 character with some progression</li>
                <li>Basic equipment and currency</li>
                <li>Completed onboarding flow</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}