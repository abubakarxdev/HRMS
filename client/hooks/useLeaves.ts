import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leavesService } from '../api/services/leaves.service';
import type { CreateLeaveRequest } from '../api/types/leaves';
import { queryKeys } from '../lib/queryClient'; // Need to update queryKeys
import { toast } from 'sonner';

const leaveKeys = queryKeys.leaves;

export const useLeaveBalances = () => {
  return useQuery({
    queryKey: leaveKeys.balances(), // My balances (no employeeId)
    queryFn: () => leavesService.getMyBalances(),
  });
};

export const useMyLeaveRequests = (page = 1, limit = 10, status?: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: leaveKeys.myRequests(page, limit, status, startDate, endDate),
    queryFn: () => leavesService.getMyRequests(page, limit, status, startDate, endDate),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeaveRequest) => leavesService.createRequest(data),
    onSuccess: () => {
      // Invalidate my requests (broad match for all pages/filters)
      queryClient.invalidateQueries({ queryKey: ['leaves', 'my'] });
      // Invalidate pending approvals/all requests (broad match)
      queryClient.invalidateQueries({ queryKey: ['leaves', 'all'] });
      // Invalidate balances (credits are reserved on creation)
      queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
      toast.success('Leave request submitted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to submit leave request';
      toast.error(message);
    },
  });
};

export const useAllLeaveRequests = (page = 1, limit = 10, status?: string, employeeId?: string, officeId?: string, startDate?: string, endDate?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: leaveKeys.all(page, limit, status, employeeId, officeId, startDate, endDate),
    queryFn: () => leavesService.getAllRequests(page, limit, status, employeeId, officeId, startDate, endDate),
    placeholderData: (previousData) => previousData,
    enabled,
    staleTime: 1000 * 60, // Keep fresh for 1 minute
  });
};

export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, approverComments }: { id: string; status: string; approverComments?: string }) =>
      leavesService.updateRequestStatus(id, status, approverComments),
    onSuccess: (data, variables) => {
      // Invalidate list to remove/update item
      queryClient.invalidateQueries({ queryKey: ['leaves', 'all'] });
      // Invalidate specific detail view
      queryClient.invalidateQueries({ queryKey: leaveKeys.detail(variables.id) });
      // Invalidate balances as approval changes them
      if (variables.status === 'Approved') {
        queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
      }
      toast.success('Leave status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update leave status';
      toast.error(message);
    },
  });
};

export const useEmployeeLeaveBalances = (employeeId?: string) => {
  return useQuery({
    queryKey: leaveKeys.balances(employeeId),
    queryFn: () => {
      if (!employeeId) return Promise.resolve([]);
      return leavesService.getEmployeeBalances(employeeId);
    },
    enabled: !!employeeId,
  });
};
export const useLeaveRequestDetails = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: leaveKeys.detail(id),
    queryFn: () => leavesService.getRequestById(id),
    enabled: !!id && enabled,
  });
};

export const useMyUpcomingApprovedLeaves = () => {
  return useQuery({
    queryKey: ['leaves', 'my', 'approved', 'upcoming'],
    queryFn: () => leavesService.getMyUpcomingApprovedLeaves(),
  });
};

export const useLeaveStats = (employeeId?: string, officeId?: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['leaves', 'stats', employeeId, officeId, startDate, endDate],
    queryFn: () => leavesService.getStats(employeeId, officeId, startDate, endDate),
    // Keep stats fresh but don't over-fetch
    staleTime: 1000 * 30, // 30 seconds
  });
};
