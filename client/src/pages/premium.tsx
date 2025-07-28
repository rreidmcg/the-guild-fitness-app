import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Shield, Zap, Target, TrendingUp, Users } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

interface PlanDetails {
  name: string;
  duration: string;
  price: string;
  installments: string;
  moneyBackGuarantee: boolean;
  features: string[];
}

const SubscriptionForm = ({ clientSecret, planDetails }: { clientSecret: string; planDetails: PlanDetails }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/premium?success=true`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-card p-6 rounded-lg border">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-center mb-2">{planDetails.name}</h3>
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold text-primary">{planDetails.price}</div>
          <div className="text-sm text-muted-foreground">{planDetails.installments}</div>
          {planDetails.moneyBackGuarantee && (
            <Badge variant="secondary" className="mt-2">
              <Shield className="w-3 h-3 mr-1" />
              30-Day Money Back Guarantee
            </Badge>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <Button type="submit" disabled={!stripe || isLoading} className="w-full">
          {isLoading ? "Processing..." : "Start Premium Training"}
        </Button>
      </form>

      <div className="mt-4 text-xs text-muted-foreground text-center">
        Cancel anytime. Full refund guaranteed within 30 days.
      </div>
    </div>
  );
};

export default function Premium() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientSecret, setClientSecret] = useState("");
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);

  // Check subscription status
  const { data: user } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Handle subscription creation
  const createSubscription = useMutation({
    mutationFn: () => apiRequest("POST", "/api/create-subscription"),
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setPlanDetails(data.planDetails);
      toast({
        title: "Subscription Created",
        description: "Complete your payment to start your premium training plan!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  // Handle subscription cancellation
  const cancelSubscription = useMutation({
    mutationFn: (reason: string) => 
      apiRequest("POST", "/api/cancel-subscription", { reason }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Subscription Canceled",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Error", 
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  // Check for success URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Payment Successful!",
        description: "Welcome to Premium! Your AI coach is ready to create personalized workouts.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
    }
  }, []);

  const isSubscribed = user?.subscriptionStatus === 'active';

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "AI-Powered Recommendations",
      description: "Personalized workout plans created by advanced AI based on your goals, equipment, and progress"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Adaptive Training Plans",
      description: "Plans that evolve based on your feedback, adjusting volume and intensity automatically"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Smart Progress Tracking",
      description: "Intelligent analytics that identify patterns and suggest optimizations to accelerate results"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Equipment Flexibility",
      description: "Workouts tailored to your available equipment - from full gym to bodyweight only"
    },
  ];

  if (isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Crown className="w-5 h-5" />
              <span className="font-semibold">Premium Active</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Premium Training!</h1>
            <p className="text-muted-foreground">Your AI fitness coach is ready to create personalized workouts</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-primary">{feature.icon}</div>
                    <div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Manage Subscription</CardTitle>
              <CardDescription>
                Your premium features are active and ready to use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span className="text-sm">Plan Status</span>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  Active
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span className="text-sm">Billing</span>
                <span className="text-sm font-medium">$9.99/month</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => cancelSubscription.mutate("User requested cancellation")}
                disabled={cancelSubscription.isPending}
              >
                {cancelSubscription.isPending ? "Canceling..." : "Cancel Subscription"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Crown className="w-5 h-5" />
            <span className="font-semibold">Premium AI Coach</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Unlock Your Fitness Potential</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get personalized AI workout recommendations that adapt to your equipment, goals, and progress.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-primary mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing */}
        <div className="max-w-md mx-auto mb-12">
          <Card className="border-primary shadow-xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <CardTitle className="text-2xl">Premium Plan</CardTitle>
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
              </div>
              <CardDescription>3-month minimum commitment</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div>
                <div className="text-4xl font-bold text-primary">$29.97</div>
                <div className="text-muted-foreground">$9.99/month for 3 months</div>
              </div>
              
              <div className="space-y-2">
                {[
                  "Personalized AI workout plans",
                  "Adaptive training that learns from your feedback", 
                  "Equipment-specific recommendations",
                  "Progress tracking & volume adjustments",
                  "Priority customer support"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Badge variant="secondary" className="mt-4">
                <Shield className="w-3 h-3 mr-1" />
                30-Day Money Back Guarantee
              </Badge>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full text-lg py-6" 
                onClick={() => createSubscription.mutate()}
                disabled={createSubscription.isPending}
              >
                {createSubscription.isPending ? "Creating..." : "Start Premium Training"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Subscription Form */}
        {clientSecret && planDetails && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscriptionForm clientSecret={clientSecret} planDetails={planDetails} />
          </Elements>
        )}

        {/* Testimonials/Social Proof */}
        <div className="text-center text-sm text-muted-foreground mt-12">
          <p>Join thousands of users already achieving their fitness goals with AI-powered training</p>
        </div>
      </div>
    </div>
  );
}