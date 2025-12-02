import { apiClient } from '../client';
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from '../types/employee.types';

/**
 * Employee Service
 * Handles employee CRUD operations
 */
export const employeeService = {
  /**
   * Get all employees
   */
  getAll: async (): Promise<Employee[]> => {
    const response = await apiClient.get<Employee[]>('/employees');
    return response.data;
  },

  /**
   * Get employee by ID
   */
  getById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  /**
   * Create new employee
   */
  create: async (data: CreateEmployeeRequest): Promise<Employee> => {
    const response = await apiClient.post<Employee>('/employees', data);
    return response.data;
  },

  /**
   * Update employee
   */
  update: async (id: string, data: UpdateEmployeeRequest): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  /**
   * Delete employee
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },
};
