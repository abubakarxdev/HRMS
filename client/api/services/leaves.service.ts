import { apiClient } from '../client';
import { LeaveBalance, LeaveRequest, CreateLeaveRequest, PaginatedResponse } from '../types/leaves';

export const leavesService = {
  getMyBalances: async (): Promise<LeaveBalance[]> => {
    const response = await apiClient.get<LeaveBalance[]>('/leaves/my-balances');
    return response.data;
  },

  getMyRequests: async (page = 1, limit = 10, status?: string): Promise<PaginatedResponse<LeaveRequest>> => {
    let url = `/leaves/my-requests?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    const response = await apiClient.get<PaginatedResponse<LeaveRequest>>(url);
    return response.data;
  },

  createRequest: async (data: CreateLeaveRequest): Promise<LeaveRequest> => {
    const response = await apiClient.post<LeaveRequest>('/leaves/request', data);
    return response.data;
  },

  getAllRequests: async (page = 1, limit = 10, status?: string, employeeId?: string, officeId?: string): Promise<PaginatedResponse<LeaveRequest>> => {
    let url = `/leaves/requests?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (employeeId) url += `&employeeId=${employeeId}`;
    if (officeId) url += `&officeId=${officeId}`;
    const response = await apiClient.get<PaginatedResponse<LeaveRequest>>(url);
    return response.data;
  },

  updateRequestStatus: async (id: string, status: string, approverComments?: string): Promise<LeaveRequest> => {
    const response = await apiClient.patch<LeaveRequest>(`/leaves/request/${id}/status`, { status, approverComments });
    return response.data;
  },
};
