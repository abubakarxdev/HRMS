import { apiClient } from '../client';

export interface LeaveBalance {
  id: string;
  leaveType: string;
  totalCredits: number;
  usedCredits: number;
}

export interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  managerComments?: string;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeIdNumber: string;
    avatarUrl?: string;
  };
}

export interface CreateLeaveRequest {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

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

  getAllRequests: async (page = 1, limit = 10, status?: string, employeeId?: string): Promise<PaginatedResponse<LeaveRequest>> => {
    let url = `/leaves/requests?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (employeeId) url += `&employeeId=${employeeId}`;
    const response = await apiClient.get<PaginatedResponse<LeaveRequest>>(url);
    return response.data;
  },

  updateRequestStatus: async (id: string, status: string, managerComments?: string): Promise<LeaveRequest> => {
    const response = await apiClient.patch<LeaveRequest>(`/leaves/request/${id}/status`, { status, managerComments });
    return response.data;
  },
};
