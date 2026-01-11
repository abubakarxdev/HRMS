import { apiClient } from "../client";

export interface Office {
  id: string;
  name: string;
  address?: string;
  timezone: string;
  _count?: {
    employees: number;
  }
}

export const officeService = {
  getAll: async () => {
    const response = await apiClient.get("/offices");
    return response.data as Office[];
  },

  create: async (data: Partial<Office>) => {
    const response = await apiClient.post("/offices", data);
    return response.data;
  },

  update: async (id: string, data: Partial<Office>) => {
    const response = await apiClient.put(`/offices/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/offices/${id}`);
  },
};
