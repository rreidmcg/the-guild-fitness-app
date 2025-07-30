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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { validateUsername, formatUsernameInput } from "@/utils/username-validation";
import { LiabilityWaiverModal } from "@/components/liability-waiver-modal";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { AuthMusicBanner } from "@/components/ui/auth-music-banner";
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

  const handleLiabilityWaiverDecline = () => {
    setShowLiabilityWaiver(false);
    setPendingSignupData(null);
    toast({
      title: "Account creation cancelled",
      description: "You must accept the liability waiver to use The Guild: Gamified Fitness.",
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
                          <Input 
                            placeholder="Choose a username (letters and spaces only)" 
                            {...field}
                            maxLength={20}
                            onChange={(e) => {
                              const formatted = formatUsernameInput(e.target.value);
                              field.onChange(formatted);
                            }}
                            className="bg-black/30 border-white/30 placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0"
                          />
                        </FormControl>
                        <FormMessage />
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
                          <Input 
                            placeholder="Create a password" 
                            type="password"
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
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Confirm your password" 
                            type="password"
                            {...field} 
                            className="bg-black/30 border-white/30 placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0"
                          />
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
                        <div className="text-sm text-muted-foreground mb-2">
                          Choose your character's visual appearance
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant={field.value === "male" ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange("male")}
                            className="flex-1"
                          >
                            Male Avatar
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === "female" ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange("female")}
                            className="flex-1"
                          >
                            Female Avatar
                          </Button>
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