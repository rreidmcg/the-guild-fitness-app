import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "@/hooks/use-navigate";
import { 
  Trophy, 
  Clock, 
  Calendar, 
  Star,
  CheckCircle2,
  Lock,
  CreditCard,
  Target,
  Zap,
  Activity,
  Play
} from "lucide-react";
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface WorkoutProgram {
  id: number;
  name: string;
  description: string;
  durationWeeks: number;
  difficultyLevel: string;
  price: number;
  workoutsPerWeek: number;
  estimatedDuration: number;
  targetAudience: string;
  features: string[];
  isPurchased: boolean;
  priceFormatted: string;
}

function PurchaseForm({ program, onSuccess }: { program: WorkoutProgram; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/workout-programs",
      },
      redirect: "if_required"
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Confirm the purchase on our backend
      try {
        await apiRequest("/api/confirm-program-purchase", {
          method: "POST",
          body: { paymentIntentId: paymentIntent.id }
        });
        
        toast({
          title: "Purchase Successful!",
          description: `You now have access to ${program.name}`,
        });
        
        onSuccess();
      } catch (confirmError) {
        toast({
          title: "Purchase Confirmation Failed",
          description: "Payment succeeded but confirmation failed. Contact support.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe} className="w-full">
        <CreditCard className="w-4 h-4 mr-2" />
        Complete Purchase - {program.priceFormatted}
      </Button>
    </form>
  );
}

function ProgramCard({ program }: { program: WorkoutProgram }) {
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const difficultyColors = {
    novice: "bg-green-500",
    intermediate: "bg-yellow-500", 
    advanced: "bg-red-500"
  };

  const difficultyIcons = {
    novice: <Target className="w-4 h-4" />,
    intermediate: <Activity className="w-4 h-4" />,
    advanced: <Zap className="w-4 h-4" />
  };

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/purchase-program/${program.id}`, {
        method: "POST"
      });
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initialize purchase",
        variant: "destructive",
      });
    }
  });

  const handlePurchase = () => {
    purchaseMutation.mutate();
  };

  const handlePurchaseSuccess = () => {
    setShowPayment(false);
    setClientSecret("");
    queryClient.invalidateQueries({ queryKey: ["/api/workout-programs"] });
  };

  if (showPayment && clientSecret) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Complete Purchase</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPayment(false)}
            >
              Cancel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="font-semibold">{program.name}</h3>
            <p className="text-sm text-muted-foreground">One-time payment for lifetime access</p>
          </div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PurchaseForm program={program} onSuccess={handlePurchaseSuccess} />
          </Elements>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center space-x-2">
              <span>{program.name}</span>
              {program.isPurchased ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={`${difficultyColors[program.difficultyLevel as keyof typeof difficultyColors]} text-white border-0`}
              >
                {difficultyIcons[program.difficultyLevel as keyof typeof difficultyIcons]}
                <span className="ml-1 capitalize">{program.difficultyLevel}</span>
              </Badge>
              <Badge variant="outline">
                <Calendar className="w-3 h-3 mr-1" />
                {program.durationWeeks} weeks
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{program.priceFormatted}</div>
            <div className="text-xs text-muted-foreground">One-time purchase</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{program.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span>{program.workoutsPerWeek}x per week</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>{program.estimatedDuration} min sessions</span>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Target Audience:</h4>
          <p className="text-sm text-muted-foreground">{program.targetAudience}</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Program Features:</h4>
          <ul className="space-y-1">
            {program.features.map((feature, index) => (
              <li key={index} className="text-sm flex items-center space-x-2">
                <Star className="w-3 h-3 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 space-y-2">
          {program.isPurchased ? (
            <>
              <Button 
                className="w-full" 
                onClick={() => {
                  navigate(`/program-overview?program=${program.id}`);
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Program
              </Button>
              <Button className="w-full" variant="outline" size="sm">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Owned
              </Button>
            </>
          ) : (
            <Button 
              className="w-full" 
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {purchaseMutation.isPending ? "Processing..." : `Purchase for ${program.priceFormatted}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WorkoutPrograms() {
  const { data: programs, isLoading } = useQuery<WorkoutProgram[]>({
    queryKey: ["/api/workout-programs"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 bg-muted animate-pulse rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Workout Programs</h1>
          <p className="text-muted-foreground">
            Professional fitness programs designed for every level. One-time purchase, lifetime access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs?.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>

        <div className="bg-muted/30 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Why Choose Our Programs?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p>Professional fitness programs designed by experts</p>
            </div>
            <div>
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p>One-time purchase for lifetime access</p>
            </div>
            <div>
              <Star className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p>Progressive difficulty and detailed instructions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}