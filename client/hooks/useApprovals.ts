import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approvalService } from '../api/services/approval.service';
import { queryKeys } from '../lib/queryClient';
import { toast } from 'sonner';

/**
 * Hook to get all approval requests
 */
export const useApprovals = () => {
  return useQuery({
    queryKey: ['approvals'], // Adding this to queryKeys in next step if needed, or just use string for now
    queryFn: () => approvalService.getAll(),
  });
};

/**
 * Hook to update approval status
 */
export const useUpdateApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Approved' | 'Rejected' }) =>
      approvalService.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast.success(`Request ${status.toLowerCase()} successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update request');
    },
  });
};
