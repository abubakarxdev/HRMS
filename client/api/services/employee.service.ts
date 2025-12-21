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
  getAll: async (officeId?: string, params: any = {}): Promise<any> => {
    let url = '/employees';
    const queryParams = new URLSearchParams();

    if (officeId) queryParams.append('officeId', officeId);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.role && params.role !== 'all') queryParams.append('role', params.role);
    if (params.department && params.department !== 'all') queryParams.append('department', params.department);
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await apiClient.get<any>(url);
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
