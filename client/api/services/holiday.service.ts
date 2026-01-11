import { apiClient } from '../client';
import type { PublicHoliday } from '../../types';

export const holidayService = {
  /**
   * Get all public holidays (paginated or list)
   */
  getAll: async (params?: { page?: number; limit?: number; search?: string; year?: string; officeId?: string }): Promise<any> => {
    const response = await apiClient.get('/holidays', { params });
    return response.data;
  },

  /**
   * Add a new public holiday
   */
  add: async (holiday: PublicHoliday): Promise<PublicHoliday> => {
    const response = await apiClient.post<PublicHoliday>('/holidays', holiday);
    return response.data;
  },

  /**
   * Update a holiday
   */
  update: async (id: string, holiday: Partial<PublicHoliday>): Promise<PublicHoliday> => {
    const response = await apiClient.put<PublicHoliday>(`/holidays/${id}`, holiday);
    return response.data;
  },

  /**
   * Delete a holiday
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/holidays/${id}`);
  },
};
