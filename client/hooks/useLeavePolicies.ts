import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavePolicyService, CreatePolicyPayload, LeavePolicy } from '../api/services/leavePolicy.service';
import { toast } from 'sonner';

export const useLeavePolicies = (params?: { officeId?: string; year?: string; contractType?: string; includeArchived?: boolean }) => {
  return useQuery({
    queryKey: ['leave-policies', params],
    queryFn: () => leavePolicyService.getAll(params),
  });
};

export const useLeavePolicyYears = (officeId?: string) => {
  return useQuery({
    queryKey: ['leave-policy-years', officeId],
    queryFn: () => leavePolicyService.getPolicyYears(officeId),
    // Stale time high as years don't change often
    staleTime: 5 * 60 * 1000
  });
};

export const useCreateLeavePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePolicyPayload) => leavePolicyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies'] });
      toast.success("Leave policy created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create policy");
    }
  });
};

export const useUpdateLeavePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePolicyPayload> }) => leavePolicyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies'] });
      toast.success("Leave policy updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update policy");
    }
  });
};

export const useDeleteLeavePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leavePolicyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies'] });
      toast.success("Leave policy archived successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to archive policy");
    }
  });
};
