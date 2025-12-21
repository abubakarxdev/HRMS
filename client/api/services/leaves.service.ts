import { apiClient } from '../client';
import { LeaveBalance, LeaveRequest, CreateLeaveRequest, PaginatedResponse } from '../types/leaves';

export const leavesService = {
  getMyBalances: async (): Promise<LeaveBalance[]> => {
    const response = await apiClient.get<LeaveBalance[]>('/leaves/my-balances');
    return response.data;
  },

  getMyRequests: async (page = 1, limit = 10, status?: string, startDate?: string, endDate?: string): Promise<PaginatedResponse<LeaveRequest>> => {
    let url = `/leaves/my-requests?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const response = await apiClient.get<PaginatedResponse<LeaveRequest>>(url);
    return response.data;
  },

  createRequest: async (data: CreateLeaveRequest): Promise<LeaveRequest> => {
    const response = await apiClient.post<LeaveRequest>('/leaves/request', data);
    return response.data;
  },

  getAllRequests: async (page = 1, limit = 10, status?: string, employeeId?: string, officeId?: string, startDate?: string, endDate?: string): Promise<PaginatedResponse<LeaveRequest>> => {
    let url = `/leaves/requests?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (employeeId) url += `&employeeId=${employeeId}`;
    if (officeId) url += `&officeId=${officeId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const response = await apiClient.get<PaginatedResponse<LeaveRequest>>(url);
    return response.data;
  },

  updateRequestStatus: async (id: string, status: string, approverComments?: string): Promise<LeaveRequest> => {
    const response = await apiClient.patch<LeaveRequest>(`/leaves/request/${id}/status`, { status, approverComments });
    return response.data;
  },

  getEmployeeBalances: async (employeeId: string): Promise<LeaveBalance[]> => {
    const response = await apiClient.get<LeaveBalance[]>(`/leaves/balances/${employeeId}`);
    return response.data;
  },

  getRequestById: async (id: string): Promise<LeaveRequest> => {
    const response = await apiClient.get<LeaveRequest>(`/leaves/request/${id}`);
    return response.data;
  },

  getMyUpcomingApprovedLeaves: async (): Promise<LeaveRequest[]> => {
    const today = new Date().toISOString().split('T')[0];
    const url = `/leaves/my-requests?status=Approved&startDate=${today}&limit=100`;
    const response = await apiClient.get<PaginatedResponse<LeaveRequest>>(url);
    return response.data.data;
  },

  getStats: async (employeeId?: string, officeId?: string, startDate?: string, endDate?: string): Promise<{ Pending: number; Approved: number; Rejected: number }> => {
    let url = `/leaves/stats?`;
    if (employeeId) url += `&employeeId=${employeeId}`;
    if (officeId) url += `&officeId=${officeId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const response = await apiClient.get(url);
    return response.data;
  },
};
