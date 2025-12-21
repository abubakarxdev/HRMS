import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../api/services';
import type { CreateEmployeeRequest, UpdateEmployeeRequest } from '../api/services';
import { queryKeys } from '../lib/queryClient';
import { toast } from 'sonner';

/**
 * Hook to get all employees
 */
export const useEmployees = (officeId?: string, params?: any) => {
  return useQuery({
    queryKey: [...queryKeys.employees.all(officeId), params],
    queryFn: () => employeeService.getAll(officeId, params),
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook to get employee by ID
 */
export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeeService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create employee
 */
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeeRequest) => employeeService.create(data),
    onSuccess: () => {
      // Invalidate employees list
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create employee';
      toast.error(message);
    },
  });
};

/**
 * Hook to update employee
 */
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeRequest }) =>
      employeeService.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate employees list and specific employee
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(variables.id) });
      toast.success('Employee updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update employee';
      toast.error(message);
    },
  });
};

/**
 * Hook to delete employee
 */
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeService.delete(id),
    onSuccess: () => {
      // Invalidate employees list
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete employee';
      toast.error(message);
    },
  });
};
