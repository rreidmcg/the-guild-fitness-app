import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

/**
 * Hook to automatically detect and set user's timezone for daily quest resets
 */
export function useTimezone() {
  const queryClient = useQueryClient();

  const setTimezoneMutation = useMutation({
    mutationFn: async (timezone: string) => {
      return apiRequest<{ success: boolean; timezone: string }>("/api/user/timezone", {
        method: "POST",
        body: { timezone },
      });
    },
    onSuccess: () => {
      // Invalidate user stats to refetch with updated timezone
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-progress"] });
    },
  });

  useEffect(() => {
    // Auto-detect and set user's timezone on first app load
    const detectAndSetTimezone = async () => {
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        if (userTimezone) {
          // Only set timezone if we haven't set it before (check localStorage)
          const hasSetTimezone = localStorage.getItem('timezoneSet');
          
          if (!hasSetTimezone) {
            await setTimezoneMutation.mutateAsync(userTimezone);
            localStorage.setItem('timezoneSet', 'true');
            console.log(`Timezone automatically set to: ${userTimezone}`);
          }
        }
      } catch (error) {
        console.warn('Failed to auto-detect timezone:', error);
      }
    };

    detectAndSetTimezone();
  }, [setTimezoneMutation]);

  return {
    setTimezone: setTimezoneMutation.mutateAsync,
    isSettingTimezone: setTimezoneMutation.isPending,
  };
}

/**
 * Get current user's local date in YYYY-MM-DD format
 */
export function getCurrentLocalDate(): string {
  return new Date().toLocaleDateString('en-CA'); // en-CA gives us YYYY-MM-DD format
}

/**
 * Check if it's past midnight in user's local time since a given date
 */
export function isNewDayLocal(lastDate: string): boolean {
  const today = getCurrentLocalDate();
  return today !== lastDate;
}