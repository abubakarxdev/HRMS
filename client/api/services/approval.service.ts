import { apiClient } from '../client';
import type { ApprovalRequest } from '../../types';

export const approvalService = {
  /**
   * Get all approval requests
   */
  getAll: async (): Promise<ApprovalRequest[]> => {
    const response = await apiClient.get<ApprovalRequest[]>('/approvals');
    return response.data;
  },

  /**
   * Update approval status
   */
  updateStatus: async (id: string, status: 'Approved' | 'Rejected'): Promise<ApprovalRequest> => {
    const response = await apiClient.patch<ApprovalRequest>(`/approvals/${id}/status`, { status });
    return response.data;
  },
};
