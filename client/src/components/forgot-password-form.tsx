import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address."
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEmailSent(true);
        toast({
          title: "Reset Link Sent",
          description: "If an account with that email exists, a password reset link has been sent.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to send reset email. Please try again.",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Unable to send reset email. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground">Check Your Email</CardTitle>
          <CardDescription className="text-muted-foreground">
            If an account with that email exists, we've sent a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Check your email inbox and click the link to reset your password. 
            The link will expire in 1 hour.
          </p>
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-card border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-foreground">Forgot Password</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="placeholder:text-muted-foreground/50 placeholder:transition-opacity focus:placeholder:opacity-0"
              required
            />
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}