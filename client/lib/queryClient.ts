import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query keys for better organization
export const queryKeys = {
  // Auth
  auth: {
    user: ['auth', 'user'] as const,
  },

  // Employees
  employees: {
    all: ['employees'] as const,
    detail: (id: string) => ['employees', id] as const,
  },

  // Attendance
  attendance: {
    all: ['attendance'] as const,
    byEmployee: (employeeId: string) => ['attendance', 'employee', employeeId] as const,
    detail: (id: string) => ['attendance', id] as const,
    today: (employeeId: string, date?: string) =>
      ['attendance', 'today', employeeId, date] as const,
    stats: (employeeId: string) => ['attendance', 'stats', employeeId] as const,
  },

  // Audit Logs
  auditLogs: {
    byEmployee: (employeeId: string) => ['auditLogs', 'employee', employeeId] as const,
  },
};
