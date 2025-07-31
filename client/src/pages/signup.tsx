import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { validateUsername, formatUsernameInput } from "@/utils/username-validation";
import { LiabilityWaiverModal } from "@/components/liability-waiver-modal";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { AuthMusicBanner } from "@/components/ui/auth-music-banner";
import { Avatar2D } from "@/components/ui/avatar-2d";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import logoImage from "@assets/24D3E703-7380-4E15-9893-55D6C971DD0C_1753833791530.png";
import forestBg from "@assets/38F18B04-AA5B-42A3-9A39-BAB6798C8D7B_1753887273683.png";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(2, "Username must be at least 2 characters").max(20, "Username must be at most 20 characters").refine((val) => {
    const validation = validateUsername(val);
    return validation.isValid;
  }, {
    message: "Username contains inappropriate content or invalid characters"
  }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  height: z.number().min(1, "Height is required"),
  weight: z.number().min(1, "Weight is required"),
  fitnessGoal: z.enum(["lose_weight", "gain_muscle", "improve_endurance", "general_fitness"]),
  measurementUnit: z.enum(["imperial", "metric"]),
  gender: z.enum(["male", "female", "other"]),
  avatarGender: z.enum(["male", "female"])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [showLiabilityWaiver, setShowLiabilityWaiver] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState<SignupForm | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameToCheck, setUsernameToCheck] = useState<string>("");

  // Username availability check query
  const { data: usernameCheck, isLoading: isCheckingUsername } = useQuery({
    queryKey: ['/api/check-username', usernameToCheck],
    queryFn: async () => {
      if (!usernameToCheck || usernameToCheck.length < 2) return null;
      const response = await fetch(`/api/check-username/${encodeURIComponent(usernameToCheck)}`);
      return response.json();
    },
    enabled: usernameToCheck.length >= 2,
    staleTime: 5000, // Don't refetch for 5 seconds
  });

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      height: 0,
      weight: 0,
      fitnessGoal: "general_fitness",
      measurementUnit: "imperial",
      gender: "male",
      avatarGender: "male"
    },
  });

  // Debounce username input
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "username" && type === "change") {
        const timer = setTimeout(() => {
          setUsernameToCheck(value.username || "");
        }, 500); // Wait 500ms after user stops typing
        
        return () => clearTimeout(timer);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const signupMutation = useMutation({
    mutationFn: async (data: SignupForm) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          password: data.password,
          height: data.height,
          weight: data.weight,
          fitnessGoal: data.fitnessGoal,
          measurementUnit: data.measurementUnit,
          gender: data.gender,
          avatarGender: data.avatarGender
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Signup failed");
      }
      
      return result;
    },
    onSuccess: (data, variables) => {
      // Show liability waiver instead of proceeding directly
      setPendingSignupData(variables);
      setShowLiabilityWaiver(true);
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLiabilityWaiverAccept = () => {
    setShowLiabilityWaiver(false);
    queryClient.clear();
    
    toast({
      title: "Account created successfully!",
      description: "Welcome to The Guild: Gamified Fitness! Your liability waiver has been accepted.",
    });
    setLocation("/");
  };

  const handleLiabilityWaiverDecline = async () => {
    if (pendingSignupData) {
      try {
        // Delete the account that was just created since waiver was declined
        await apiRequest("/api/auth/cleanup-incomplete-signup", {
          method: "POST",
          body: {
            email: pendingSignupData.email,
            username: pendingSignupData.username
          }
        });
      } catch (error) {
        console.error("Error cleaning up incomplete signup:", error);
      }
    }
    
    setShowLiabilityWaiver(false);
    setPendingSignupData(null);
    toast({
      title: "Account creation cancelled",
      description: "You must accept the liability waiver to use The Guild: Gamified Fitness. You can try again later with the same email and username.",
      variant: "destructive",
    });
  };

  const onSubmit = (data: SignupForm) => {
    signupMutation.mutate(data);
  };

  const getFitnessGoalLabel = (goal: string) => {
    const goals = {
      lose_weight: "Lose Weight",
      gain_muscle: "Gain Muscle",
      improve_endurance: "Improve Endurance",
      general_fitness: "General Fitness"
    };
    return goals[goal as keyof typeof goals];
  };

  const formatHeight = (height: number, unit: string) => {
    if (unit === "imperial") {
      const feet = Math.floor(height / 12);
      const inches = height % 12;
      return `${feet}'${inches}"`;
    }
    return `${height} cm`;
  };

  const formatWeight = (weight: number, unit: string) => {
    return unit === "imperial" ? `${weight} lbs` : `${weight} kg`;
  };

  return (
    <>
      <AuthMusicBanner />
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden pt-16">
        {/* Fixed parallax background */}
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
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <FloatingParticles count={20} />
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
            Join The Guild: Gamified Fitness
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 1 ? "Create your account" : "Complete your profile"}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your email" 
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
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="Choose a username (letters and spaces only)" 
                              {...field}
                              maxLength={20}
                              onChange={(e) => {
                                const formatted = formatUsernameInput(e.target.value);
                                field.onChange(formatted);
                              }}
                              className="bg-black/30 border-white/30 placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0 pr-10"
                            />
                            {/* Username availability indicator */}
                            {field.value && field.value.length >= 2 && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {isCheckingUsername ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : usernameCheck ? (
                                  usernameCheck.available ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <X className="h-4 w-4 text-red-500" />
                                  )
                                ) : null}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                        {/* Show availability message */}
                        {field.value && field.value.length >= 2 && usernameCheck && !isCheckingUsername && (
                          <div className={`text-xs ${usernameCheck.available ? 'text-green-400' : 'text-red-400'}`}>
                            {usernameCheck.available ? 
                              `✓ "${field.value}" is available` : 
                              usernameCheck.error || `✗ "${field.value}" is already taken`
                            }
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          2-20 characters, letters and spaces only
                        </p>
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
                              placeholder="Create a password" 
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

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="Confirm your password" 
                              type={showConfirmPassword ? "text" : "password"}
                              {...field} 
                              className="pr-10 bg-black/30 border-white/30 placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0"
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
                    type="button" 
                    onClick={async () => {
                      const result = await form.trigger(["email", "username", "password", "confirmPassword"]);
                      if (result) {
                        setStep(2);
                      }
                    }}
                    className="w-full"
                  >
                    Next: Setup Profile
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="measurementUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Measurement System</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select measurement system" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="imperial">Imperial (lbs, ft/in)</SelectItem>
                            <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="avatarGender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar Appearance</FormLabel>
                        <div className="text-sm text-muted-foreground mb-4">
                          Choose your character's visual appearance
                        </div>
                        
                        {/* Avatar Preview Images */}
                        <div className="flex space-x-6 justify-center mb-4">
                          <div 
                            className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                              field.value === "male" 
                                ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25" 
                                : "border-gray-600 hover:border-gray-400"
                            }`}
                            onClick={() => field.onChange("male")}
                          >
                            <div className="text-center">
                              <Avatar2D 
                                user={{ gender: "male", level: 1, strength: 1, stamina: 1, agility: 1 } as any} 
                                size="sm" 
                              />
                              <p className="text-sm font-medium mt-2 text-foreground">Male</p>
                            </div>
                          </div>
                          
                          <div 
                            className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                              field.value === "female" 
                                ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/25" 
                                : "border-gray-600 hover:border-gray-400"
                            }`}
                            onClick={() => field.onChange("female")}
                          >
                            <div className="text-center">
                              <Avatar2D 
                                user={{ gender: "female", level: 1, strength: 1, stamina: 1, agility: 1 } as any} 
                                size="sm" 
                              />
                              <p className="text-sm font-medium mt-2 text-foreground">Female</p>
                            </div>
                          </div>
                        </div>
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Height {form.watch("measurementUnit") === "imperial" ? "(inches)" : "(cm)"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={form.watch("measurementUnit") === "imperial" ? "e.g. 70" : "e.g. 175"} 
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            className="bg-black/30 border-white/30 placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Weight {form.watch("measurementUnit") === "imperial" ? "(lbs)" : "(kg)"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={form.watch("measurementUnit") === "imperial" ? "e.g. 150" : "e.g. 70"} 
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            className="bg-black/30 border-white/30 placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fitnessGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fitness Goal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your primary goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lose_weight">Lose Weight</SelectItem>
                            <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                            <SelectItem value="improve_endurance">Improve Endurance</SelectItem>
                            <SelectItem value="general_fitness">General Fitness</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={signupMutation.isPending}
                    >
                      {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button 
                onClick={() => setLocation("/login")}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liability Waiver Modal */}
      {showLiabilityWaiver && pendingSignupData && (
        <LiabilityWaiverModal
          isOpen={showLiabilityWaiver}
          onAccept={handleLiabilityWaiverAccept}
          onDecline={handleLiabilityWaiverDecline}
          userName={pendingSignupData.username}
          userEmail={pendingSignupData.email}
        />
      )}
      </div>
    </>
  );
}