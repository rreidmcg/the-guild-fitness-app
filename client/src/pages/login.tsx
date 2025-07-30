import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Eye, EyeOff } from "lucide-react";
import ForgotPasswordForm from "@/components/forgot-password-form";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { AuthMusicBanner } from "@/components/ui/auth-music-banner";
import logoImage from "@assets/24D3E703-7380-4E15-9893-55D6C971DD0C_1753833791530.png";
import forestBg from "@assets/38F18B04-AA5B-42A3-9A39-BAB6798C8D7B_1753887273683.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Login failed");
      }
      
      return result;
    },
    onSuccess: (data) => {
      // Clear any cached data to ensure fresh data for the new user
      queryClient.clear();
      
      // Store user data if needed (for offline access)
      if (data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.user));
      }
      
      toast({
        title: "Login successful!",
        description: "Welcome back to The Guild: Gamified Fitness!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      
      if (errorMessage.includes("verify your email")) {
        toast({
          title: "Email Verification Required",
          description: "Please check your email and verify your account before logging in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: errorMessage || "Invalid username or password.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <>
      <AuthMusicBanner />
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden pt-16"
        style={{
          backgroundImage: `url(${forestBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          imageRendering: 'pixelated'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <FloatingParticles count={25} />
      {showForgotPassword ? (
        <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
      ) : (
        <Card className="w-full max-w-sm sm:max-w-md bg-black/10 backdrop-blur-sm border border-white/30 shadow-2xl relative z-10 overflow-hidden">
          <FloatingParticles count={8} className="absolute inset-0 z-0" />
          <CardHeader className="text-center relative z-10">
            <div className="flex justify-center mb-6">
              <img 
                src={logoImage} 
                alt="The Guild: Gamified Fitness" 
                className="w-48 sm:w-56 md:w-64 lg:w-72 h-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your The Guild: Gamified Fitness account
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your email address" 
                          type="email"
                          {...field} 
                          className="bg-black/30 border-white/30 placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Enter your password" 
                            type={showPassword ? "text" : "password"}
                            {...field} 
                            className="pr-10 bg-black/30 border-white/30 placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0"
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

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <button 
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:text-primary/80 hover:underline"
              >
                Forgot your password?
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button 
                  onClick={() => setLocation("/signup")}
                  className="text-primary hover:text-primary/80 hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  );
}