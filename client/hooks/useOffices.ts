import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { officeService, Office } from '../api/services/office.service';
import { toast } from 'sonner';

export const useOffices = () => {
  return useQuery({
    queryKey: ['offices'],
    queryFn: () => officeService.getAll(),
  });
};

export const useCreateOffice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Office>) => officeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast.success('Office created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create office');
    }
  });
};

export const useUpdateOffice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Office> }) => officeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast.success('Office updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update office');
    }
  });
};

export const useDeleteOffice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => officeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast.success('Office deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete office');
    }
  });
};
