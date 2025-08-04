import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

interface UseApiQueryOptions<T> {
  queryKey: string[];
  endpoint: string;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useApiQuery<T = any>({
  queryKey,
  endpoint,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
  refetchInterval = false,
  onSuccess,
  onError
}: UseApiQueryOptions<T>) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      onSuccess?.(data);
      return data;
    },
    enabled,
    staleTime,
    refetchInterval,
    onError
  });
}

interface UseApiMutationOptions<TData, TVariables> {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  invalidateQueries?: string[][];
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useApiMutation<TData = any, TVariables = any>({
  endpoint,
  method = 'POST',
  invalidateQueries = [],
  onSuccess,
  onError,
  successMessage,
  errorMessage
}: UseApiMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await apiRequest(endpoint, {
        method,
        body: variables
      });
      
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate specified queries
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }
      
      onSuccess?.(data, variables);
    },
    onError: (error: Error, variables) => {
      console.error(`API mutation error (${method} ${endpoint}):`, error);
      
      if (errorMessage || error.message) {
        toast({
          title: "Error",
          description: errorMessage || error.message,
          variant: "destructive",
        });
      }
      
      onError?.(error, variables);
    }
  });
}

// Convenience hooks for common operations
export function useUserStats() {
  return useApiQuery({
    queryKey: ['/api/user/stats'],
    endpoint: '/api/user/stats',
    staleTime: 30 * 1000, // 30 seconds for frequently updated data
  });
}

export function useAchievements() {
  return useApiQuery({
    queryKey: ['/api/achievements'],
    endpoint: '/api/achievements',
    staleTime: 10 * 60 * 1000, // 10 minutes for static data
  });
}

export function useUserAchievements() {
  return useApiQuery({
    queryKey: ['/api/user-achievements'],
    endpoint: '/api/user-achievements',
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useWorkoutSessions() {
  return useApiQuery({
    queryKey: ['/api/workout-sessions'],
    endpoint: '/api/workout-sessions',
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useInventory() {
  return useApiQuery({
    queryKey: ['/api/inventory'],
    endpoint: '/api/inventory',
    staleTime: 60 * 1000, // 1 minute
  });
}