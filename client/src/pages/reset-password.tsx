import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { AuthMusicBanner } from "@/components/ui/auth-music-banner";
import logoImage from "@assets/24D3E703-7380-4E15-9893-55D6C971DD0C_1753833791530.png";
import forestBg from "@assets/38F18B04-AA5B-42A3-9A39-BAB6798C8D7B_1753887273683.png";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters long"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Extract token from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (!resetToken) {
      setIsValidToken(false);
      return;
    }
    
    setToken(resetToken);
    setIsValidToken(true);
  }, []);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Invalid reset token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Success",
          description: "Your password has been reset successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Network Error",
        description: "Unable to reset password. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === false) {
    return (
      <>
        <AuthMusicBanner />
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          <div 
            className="fixed inset-0 w-full h-full z-0"
            style={{
              backgroundImage: `url(${forestBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated'
            }}
          ></div>
          <div className="absolute inset-0 bg-black/40 z-0"></div>
          <FloatingParticles count={25} />
          
          <Card className="w-full max-w-md bg-black/10 backdrop-blur-sm border border-white/30 shadow-2xl relative z-10">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img 
                  src={logoImage} 
                  alt="The Guild: Gamified Fitness" 
                  className="w-48 h-auto"
                />
              </div>
              <CardTitle className="text-foreground">Invalid Reset Link</CardTitle>
              <CardDescription className="text-muted-foreground">
                The password reset link is missing or invalid.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                This link may have expired or been used already. Please request a new password reset.
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (isSuccess) {
    return (
      <>
        <AuthMusicBanner />
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          <div 
            className="fixed inset-0 w-full h-full z-0"
            style={{
              backgroundImage: `url(${forestBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated'
            }}
          ></div>
          <div className="absolute inset-0 bg-black/40 z-0"></div>
          <FloatingParticles count={25} />
          
          <Card className="w-full max-w-md bg-black/10 backdrop-blur-sm border border-white/30 shadow-2xl relative z-10">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img 
                  src={logoImage} 
                  alt="The Guild: Gamified Fitness" 
                  className="w-48 h-auto"
                />
              </div>
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <CardTitle className="text-foreground">Password Reset Successful!</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your password has been changed successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                You can now log in with your new password.
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="w-full"
              >
                Continue to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (isValidToken === null) {
    return (
      <>
        <AuthMusicBanner />
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          <div 
            className="fixed inset-0 w-full h-full z-0"
            style={{
              backgroundImage: `url(${forestBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated'
            }}
          ></div>
          <div className="absolute inset-0 bg-black/40 z-0"></div>
          <FloatingParticles count={25} />
          
          <Card className="w-full max-w-md bg-black/10 backdrop-blur-sm border border-white/30 shadow-2xl relative z-10">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthMusicBanner />
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div 
          className="fixed inset-0 w-full h-full z-0"
          style={{
            backgroundImage: `url(${forestBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated'
          }}
        ></div>
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <FloatingParticles count={25} />
        
        <Card className="w-full max-w-md bg-black/10 backdrop-blur-sm border border-white/30 shadow-2xl relative z-10 overflow-hidden">
          <FloatingParticles count={8} className="absolute inset-0 z-0" />
          <CardHeader className="text-center relative z-10">
            <div className="flex justify-center mb-6">
              <img 
                src={logoImage} 
                alt="The Guild: Gamified Fitness" 
                className="w-48 sm:w-56 md:w-64 h-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Enter your new password" 
                            type={showPassword ? "text" : "password"}
                            {...field} 
                            className="pr-10 bg-black/30 border-white/30 placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0 autofill-fix"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Confirm your new password" 
                            type={showConfirmPassword ? "text" : "password"}
                            {...field} 
                            className="pr-10 bg-black/30 border-white/30 placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0 autofill-fix"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <button 
                onClick={() => setLocation("/")}
                className="text-sm text-primary hover:text-primary/80 hover:underline"
              >
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}