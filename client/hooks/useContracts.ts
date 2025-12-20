import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { toast } from "sonner";

export interface EmploymentContract {
  id: string;
  employeeId: string;
  type: "FULL_TIME" | "PART_TIME" | "CONTRACTUAL" | "INTERN" | "PROBATION";
  position: string;
  department: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  currency: string;
  salary: number;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeIdNumber: string;
    avatarUrl?: string;
    workEmail?: string;
    department?: string;
  };
}

// Fetch all contracts (Admin/HR view)
export const useContracts = (officeId?: string) => {
  return useQuery({
    queryKey: ["contracts", officeId],
    queryFn: async () => {
      const params = officeId ? { officeId } : {};
      const { data } = await apiClient.get<EmploymentContract[]>("/contracts", { params });
      return data;
    },
  });
};

// Fetch contracts for a specific employee
export const useEmployeeContracts = (employeeId: string) => {
  return useQuery({
    queryKey: ["contracts", "employee", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data } = await apiClient.get<EmploymentContract[]>(`/contracts/employee/${employeeId}`);
      return data;
    },
    enabled: !!employeeId,
  });
};

// Create a new contract (or renew)
export const useCreateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractData: Partial<EmploymentContract>) => {
      const { data } = await apiClient.post("/contracts", contractData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      if (variables.employeeId) {
        queryClient.invalidateQueries({ queryKey: ["contracts", "employee", variables.employeeId] });
      }
      toast.success("Contract created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create contract");
    },
  });
};

// Update a contract
export const useUpdateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmploymentContract> }) => {
      const response = await apiClient.put(`/contracts/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      // We might need to look up the employeeId to invalidate specific cache, 
      // but invalidating 'contracts' usually covers the main list. 
      // Deep invalidation might be safest.
      queryClient.invalidateQueries({ queryKey: ["contracts", "employee"] });
      toast.success("Contract updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update contract");
    },
  });
};

// Delete a contract
export const useDeleteContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contracts", "employee"] });
      toast.success("Contract deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete contract");
    },
  });
};
