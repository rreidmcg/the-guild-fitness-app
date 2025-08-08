import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export function useOnboarding() {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Check onboarding status
  const { data: onboardingStatus } = useQuery({
    queryKey: ["/api/user/onboarding-status"],
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/onboarding-status"] });
    },
  });

  // Open onboarding if user hasn't completed it
  useEffect(() => {
    if ((onboardingStatus as any)?.hasCompletedOnboarding === false) {
      setIsOnboardingOpen(true);
    }
  }, [onboardingStatus]);

  const completeOnboarding = () => {
    completeOnboardingMutation.mutate();
    setIsOnboardingOpen(false);
  };

  const skipOnboarding = () => {
    completeOnboardingMutation.mutate();
    setIsOnboardingOpen(false);
  };

  const openOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  return {
    isOnboardingOpen,
    setIsOnboardingOpen,
    completeOnboarding,
    skipOnboarding,
    openOnboarding,
    hasCompletedOnboarding: (onboardingStatus as any)?.hasCompletedOnboarding || false,
  };
}