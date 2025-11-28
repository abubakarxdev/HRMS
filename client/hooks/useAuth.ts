import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../api/services';
import type { LoginRequest, UserProfile } from '../api/services';
import { queryKeys } from '../lib/queryClient';

/**
 * Hook to get current user
 */
export const useUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: () => authService.getProfile(),
    staleTime: Infinity, // User data rarely changes
  });
};

/**
 * Hook to login
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (user) => {
      // Set user in cache
      queryClient.setQueryData(queryKeys.auth.user, user);
    },
  });
};

/**
 * Hook to logout
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });
};
