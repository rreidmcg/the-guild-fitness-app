import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Sparkles, CheckCircle } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/workouts",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to Premium! You now have access to AI recommendations.",
      });
    }
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isLoading ? "Processing..." : "Subscribe to Premium"}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Create subscription as soon as the page loads
    apiRequest("POST", "/api/get-or-create-subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error.message || "Failed to create subscription");
        } else {
          setClientSecret(data.clientSecret);
        }
      })
      .catch((err) => {
        setError("Failed to initialize subscription");
        console.error("Subscription error:", err);
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-red-400">Subscription Error</CardTitle>
            <CardDescription className="text-slate-300">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = "/workouts"}
              className="w-full"
            >
              Return to Workouts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Premium Features Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Crown className="w-16 h-16 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Upgrade to Premium</h1>
          <p className="text-slate-300 max-w-md mx-auto">
            Unlock AI-powered workout recommendations and take your fitness journey to the next level
          </p>
        </div>

        {/* Features List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Premium Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>AI-powered personalized workout recommendations</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Smart training plans based on your stats and goals</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Dynamic difficulty adjustment for optimal progress</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Priority support and early access to new features</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Complete Your Subscription</CardTitle>
            <CardDescription className="text-slate-300">
              $9.99/month - Cancel anytime
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}