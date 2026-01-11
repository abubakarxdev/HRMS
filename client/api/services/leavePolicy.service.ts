import { apiClient as api } from '../client';

export interface LeavePolicy {
  id: string;
  officeId: string;
  contractType: string;
  leaveTypeId: string;
  effectiveFrom: string; // ISO Date
  effectiveTo?: string; // ISO Date
  annualQuotaMinutes: number;
  carryForwardAllowed: boolean;
  maxCarryForwardMinutes?: number;

  // Relations
  office: { name: string };
  leaveType: { name: string; code: string };
}

export interface CreatePolicyPayload {
  officeId: string;
  contractType: string;
  leaveTypeId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  annualQuotaMinutes: number;
  carryForwardAllowed: boolean;
  maxCarryForwardMinutes?: number;
}

export interface PolicyYear {
  year: number;
  hasActive: boolean;
  hasFuture: boolean;
  hasArchived: boolean;
}

export const leavePolicyService = {
  getAll: async (params?: { officeId?: string; year?: string; contractType?: string; includeArchived?: boolean }) => {
    const response = await api.get<LeavePolicy[]>('/leave-policies', { params });
    return response.data;
  },

  getPolicyYears: async (officeId?: string) => {
    const response = await api.get<PolicyYear[]>('/leave-policies/years', { params: { officeId } });
    return response.data;
  },

  create: async (data: CreatePolicyPayload) => {
    const response = await api.post<LeavePolicy>('/leave-policies', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreatePolicyPayload>) => {
    const response = await api.put<LeavePolicy>(`/leave-policies/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/leave-policies/${id}`);
  }
};
