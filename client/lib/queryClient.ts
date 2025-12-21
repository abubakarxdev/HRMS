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
    all: (officeId?: string) => ['employees', { officeId }] as const,
    detail: (id: string) => ['employees', id] as const,
  },

  // Attendance
  attendance: {
    all: ['attendance'] as const,
    list: (params: any) => ['attendance', 'list', params] as const,
    byEmployee: (employeeId: string, startDate?: string, endDate?: string, status?: string, page?: number, limit?: number) =>
      ['attendance', 'employee', employeeId, startDate, endDate, status, page, limit] as const,
    detail: (id: string) => ['attendance', id] as const,
    today: (employeeId: string, date?: string) =>
      ['attendance', 'today', employeeId, date] as const,
    stats: (employeeId: string) => ['attendance', 'stats', employeeId] as const,
  },

  // Leaves
  leaves: {
    all: (page?: number, limit?: number, status?: string, employeeId?: string, officeId?: string, startDate?: string, endDate?: string) =>
      ['leaves', 'all', { page, limit, status, employeeId, officeId, startDate, endDate }] as const,
    myRequests: (page?: number, limit?: number, status?: string, startDate?: string, endDate?: string) =>
      ['leaves', 'my', { page, limit, status, startDate, endDate }] as const,
    detail: (id: string) => ['leaves', 'detail', id] as const,
    balances: (employeeId?: string) => ['leaves', 'balances', { employeeId }] as const,
    types: ['leaves', 'types'] as const,
  },

  // Contracts
  contracts: {
    all: (page?: number, limit?: number, status?: string, employeeId?: string, officeId?: string) =>
      ['contracts', 'all', { page, limit, status, employeeId, officeId }] as const,
    detail: (id: string) => ['contracts', 'detail', id] as const,
    types: ['contracts', 'types'] as const,
  },

  // Audit Logs
  auditLogs: {
    byEmployee: (employeeId: string) => ['auditLogs', 'employee', employeeId] as const,
  },
};
