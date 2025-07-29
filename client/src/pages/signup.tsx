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
import { Avatar2D } from "@/components/ui/avatar-2d";
import logoImage from "@assets/1208A981-BCE0-47F4-9A78-AD830AA0432A_1753818737424.png";

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
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  avatarStyle: z.enum(["male", "female"])
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
      avatarStyle: "male"
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
          gender: data.avatarStyle // Use avatarStyle for the avatar appearance
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-amber-300/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-40 h-40 bg-orange-300/15 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-300/20 rounded-full blur-lg"></div>
        <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-amber-400/10 rounded-full blur-xl"></div>
        {/* Rustic texture pattern */}
        <div 
          className="absolute inset-0 opacity-20" 
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(139, 69, 19, 0.1) 1px, transparent 0)',
            backgroundSize: '30px 30px'
          }}
        ></div>
        {/* Paper-like texture */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d2691e' fill-opacity='0.03'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='13' r='1'/%3E%3Ccircle cx='23' cy='31' r='1'/%3E%3Ccircle cx='41' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>
      {/* Logo */}
      <div className="mb-8 relative z-10">
        <img 
          src={logoImage} 
          alt="The Guild: Gamified Fitness"
          className="w-80 h-auto max-w-full drop-shadow-lg"
        />
      </div>
      
      <Card className="w-full max-w-md bg-white/80 border-amber-200 relative z-10 shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Join The Guild: Gamified Fitness
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 1 ? "Create your account" : "Complete your profile"}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                            className="placeholder:text-muted-foreground/50 placeholder:transition-opacity focus:placeholder:opacity-0"
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
                            className="placeholder:text-muted-foreground/50 placeholder:transition-opacity focus:placeholder:opacity-0"
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
                            className="placeholder:text-muted-foreground/50 placeholder:transition-opacity focus:placeholder:opacity-0"
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
                            className="placeholder:text-muted-foreground/50 placeholder:transition-opacity focus:placeholder:opacity-0"
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
                    name="avatarStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choose Your Avatar Style</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              { value: "male", label: "Male Avatar" },
                              { value: "female", label: "Female Avatar" }
                            ].map((option) => (
                              <div 
                                key={option.value}
                                className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
                                  field.value === option.value 
                                    ? "border-primary bg-primary/10" 
                                    : "border-muted hover:border-muted-foreground"
                                }`}
                                onClick={() => field.onChange(option.value)}
                              >
                                <div className="mb-2 flex justify-center">
                                  <Avatar2D 
                                    user={{ gender: option.value, level: 1, strength: 10, stamina: 10, agility: 10 } as any} 
                                    size="sm" 
                                  />
                                </div>
                                <p className="text-sm font-medium">{option.label}</p>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-2">
                          Choose your preferred avatar appearance - you can change this later in settings
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          This information is for personalization and analytics only
                        </p>
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
  );
}