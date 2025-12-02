import { apiClient } from '../client';
import { AuditLog } from '../../types';

export const auditService = {
  getByEmployeeId: async (employeeId: string): Promise<AuditLog[]> => {
    const response = await apiClient.get(`/audit-logs/${employeeId}`);
    return response.data;
  },
};
