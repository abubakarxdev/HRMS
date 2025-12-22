import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../api/services';
import type {
  ClockInRequest,
  ClockOutRequest,
  StartBreakRequest,
  EndBreakRequest,
  FixMissingClockOutRequest,
} from '../api/services';
import { queryKeys } from '../lib/queryClient';
import { toast } from 'sonner';

/**
 * Hook to get all attendance records
 */
/**
 * Hook to get all attendance records
 */
export const useAttendanceRecords = (page = 1, limit = 10, startDate?: string, endDate?: string, status?: string, officeId?: string) => {
  return useQuery({
    queryKey: queryKeys.attendance.list({ page, limit, startDate, endDate, status, officeId }),
    queryFn: () => attendanceService.getAll(page, limit, startDate, endDate, status, officeId),
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to get attendance by employee ID
 */
export const useEmployeeAttendance = (employeeId: string, startDate?: string, endDate?: string, status?: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: queryKeys.attendance.byEmployee(employeeId, startDate, endDate, status, page, limit),
    queryFn: () => attendanceService.getByEmployeeId(employeeId, startDate, endDate, status, page, limit),
    enabled: !!employeeId,
    placeholderData: (previousData) => previousData,
    staleTime: 0,
  });
};

/**
 * Hook to get attendance by ID
 */
export const useAttendance = (id: string) => {
  return useQuery({
    queryKey: queryKeys.attendance.detail(id),
    queryFn: () => attendanceService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to get today's attendance
 */
export const useTodayAttendance = (employeeId: string, date?: string) => {
  return useQuery({
    queryKey: queryKeys.attendance.today(employeeId, date),
    queryFn: () => attendanceService.getTodayAttendance(employeeId, date),
    enabled: !!employeeId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to get attendance stats
 */
export const useAttendanceStats = (employeeId: string) => {
  return useQuery({
    queryKey: queryKeys.attendance.stats(employeeId),
    queryFn: () => attendanceService.getStats(employeeId),
    enabled: !!employeeId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to get team stats
 */
export const useTeamStats = (officeId?: string) => {
  return useQuery({
    queryKey: ['attendance', 'team-stats', { officeId }],
    queryFn: () => attendanceService.getTeamStats(officeId),
    staleTime: 0,
  });
};

/**
 * Hook to clock in
 */
export const useClockIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClockInRequest) => attendanceService.clockIn(data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.byEmployee(variables.employeeId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.today(variables.employeeId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.stats(variables.employeeId)
      });
      toast.success('Clocked in successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clock in');
    },
  });
};

/**
 * Hook to clock out
 */
export const useClockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClockOutRequest) => attendanceService.clockOut(data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.byEmployee(variables.employeeId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.today(variables.employeeId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.stats(variables.employeeId)
      });
      toast.success('Clocked out successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clock out');
    },
  });
};

/**
 * Hook to start break
 */
export const useStartBreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartBreakRequest) => attendanceService.startBreak(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.today(variables.employeeId)
      });
      toast.success('Break started');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start break');
    },
  });
};

/**
 * Hook to end break
 */
export const useEndBreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EndBreakRequest) => attendanceService.endBreak(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.today(variables.employeeId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.stats(variables.employeeId)
      });
      toast.success('Break ended');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to end break');
    },
  });
};

/**
 * Hook to fix missing clock out
 */
export const useFixMissingClockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FixMissingClockOutRequest) =>
      attendanceService.fixMissingClockOut(data),
    onSuccess: () => {
      // Invalidate all attendance queries
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      toast.success('Clock out fixed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to fix clock out');
    },
  });
};
