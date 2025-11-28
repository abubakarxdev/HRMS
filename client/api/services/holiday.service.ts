import { apiClient } from '../client';
import type { PublicHoliday } from '../../types';

export const holidayService = {
  /**
   * Get all public holidays
   */
  getAll: async (): Promise<PublicHoliday[]> => {
    const response = await apiClient.get<PublicHoliday[]>('/holidays');
    return response.data;
  },

  /**
   * Add a new public holiday
   */
  add: async (holiday: PublicHoliday): Promise<PublicHoliday> => {
    const response = await apiClient.post<PublicHoliday>('/holidays', holiday);
    return response.data;
  },
};
