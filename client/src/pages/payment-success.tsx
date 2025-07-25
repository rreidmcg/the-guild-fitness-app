import { useEffect, useState } from 'react';
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Coins, ArrowLeft, Home, XCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [goldAmount, setGoldAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntent = urlParams.get('payment_intent');
    const goldParam = urlParams.get('gold');
    
    if (goldParam) {
      setGoldAmount(parseInt(goldParam));
    }

    // Verify payment with backend
    if (paymentIntent) {
      fetch(`/api/payment-success?payment_intent=${paymentIntent}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Invalidate cache to refresh user stats with new gold
            queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
            setIsLoading(false);
          } else {
            setError(data.error || "Payment verification failed");
            setIsLoading(false);
          }
        })
        .catch(err => {
          setError("Failed to verify payment");
          setIsLoading(false);
        });
    } else {
      setError("No payment information found");
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-red-600 dark:text-red-400">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">{error}</p>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/shop")}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
              </Button>
              <Button 
                onClick={() => setLocation("/dashboard")}
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-green-600 dark:text-green-400">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Coins className="w-6 h-6 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">{goldAmount}</span>
            </div>
            <p className="text-muted-foreground">
              Gold coins have been added to your account!
            </p>
          </div>
          
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground text-center">
              Your gold coins are now available in your inventory. 
              Use them to purchase equipment, potions, and other items in the shop.
            </p>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/shop")}
              className="flex-1"
            >
              <Coins className="w-4 h-4 mr-2" />
              Shop More
            </Button>
            <Button 
              onClick={() => setLocation("/dashboard")}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}