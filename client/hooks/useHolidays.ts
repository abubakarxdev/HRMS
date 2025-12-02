import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { holidayService } from '../api/services/holiday.service';
import { toast } from 'sonner';
import { PublicHoliday } from '../types';

/**
 * Hook to get all public holidays
 */
export const useHolidays = () => {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: () => holidayService.getAll(),
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
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add holiday');
    },
  });
};
