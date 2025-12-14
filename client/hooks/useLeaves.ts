import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leavesService } from '../api/services/leaves.service';
import type { CreateLeaveRequest } from '../api/services/leaves.service';
import { queryKeys } from '../lib/queryClient'; // Need to update queryKeys
import { toast } from 'sonner';

// Extend queryKeys (assuming it's an object we can extend or I'll just use string keys for now if I can't edit it easily)
// Actually, I should check queryKeys first. But I'll define local keys for now to avoid breaking changes there if it's complex.
const leaveKeys = {
  balances: ['leaves', 'balances'],
  myRequests: (page: number, limit: number, status?: string) => ['leaves', 'my-requests', page, limit, status],
  allRequests: (page: number, limit: number, status?: string, employeeId?: string, officeId?: string) => ['leaves', 'all-requests', page, limit, status, employeeId, officeId],
};

export const useLeaveBalances = () => {
  return useQuery({
    queryKey: leaveKeys.balances,
    queryFn: () => leavesService.getMyBalances(),
  });
};

export const useMyLeaveRequests = (page = 1, limit = 10, status?: string) => {
  return useQuery({
    queryKey: leaveKeys.myRequests(page, limit, status),
    queryFn: () => leavesService.getMyRequests(page, limit, status),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeaveRequest) => leavesService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.myRequests(1, 10) }); // Invalidate first page at least
      // Also invalidate balances? Usually creating a request doesn't change balance until approved.
      // But if we wanted to show pending...
      toast.success('Leave request submitted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to submit leave request';
      toast.error(message);
    },
  });
};

export const useAllLeaveRequests = (page = 1, limit = 10, status?: string, employeeId?: string, officeId?: string) => {
  return useQuery({
    queryKey: leaveKeys.allRequests(page, limit, status, employeeId, officeId),
    queryFn: () => leavesService.getAllRequests(page, limit, status, employeeId, officeId),
    placeholderData: (previousData) => previousData,
  });
};

export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, approverComments }: { id: string; status: string; approverComments?: string }) =>
      leavesService.updateRequestStatus(id, status, approverComments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'all-requests'] });
      toast.success('Leave status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update leave status';
      toast.error(message);
    },
  });
};
