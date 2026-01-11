import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { holidayService } from '../api/services/holiday.service';
import { toast } from 'sonner';
import { PublicHoliday } from '../types';

/**
 * Hook to get all public holidays
 */
export const useHolidays = (params?: { page?: number; limit?: number; search?: string; year?: string; officeId?: string }) => {
  return useQuery({
    queryKey: ['holidays', params],
    queryFn: () => holidayService.getAll(params),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new
  });
};

/**
 * Hook to add a new holiday
 */
export const useAddHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (holiday: PublicHoliday) => holidayService.add(holiday),
    onSuccess: (_, holiday) => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success(`Holiday "${holiday.name}" added successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add holiday');
    },
  });
};

/**
 * Hook to update a holiday
 */
export const useUpdateHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: PublicHoliday) => holidayService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success(`Holiday "${variables.name}" updated successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update holiday');
    },
  });
};

/**
 * Hook to delete a holiday
 */
export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => holidayService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Holiday deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete holiday');
    },
  });
};
