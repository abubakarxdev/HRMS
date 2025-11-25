import { Employee, AttendanceRecord, ApprovalRequest, AuditLog, PublicHoliday, User, Role, AttendanceSession, AttendanceStats } from '../types';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = 'http://localhost:5000/api';

interface DecodedToken {
  id: string;
  name: string;
  role: Role;
  employeeId: string;
  iat: number;
  exp: number;
}

const getToken = () => localStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refreshToken');

const getAuthHeader = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const { accessToken } = await response.json();
  localStorage.setItem('token', accessToken);
  return accessToken;
};

const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));

    // Check if token is expired
    if (errorData.code === 'TOKEN_EXPIRED') {
      if (isRefreshing) {
        // Wait for the current refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          // Retry the original request with new token
          return request<T>(endpoint, options);
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        isRefreshing = false;

        // Retry the original request with new token
        return request<T>(endpoint, options);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        isRefreshing = false;

        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || 'API request failed');
  }

  // Handle cases with no content in response body (like DELETE or successful PUT/PATCH without return)
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
};


export const api = {
  login: async (email: string, password: string): Promise<User | null> => {
    const { accessToken, refreshToken } = await request<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (accessToken && refreshToken) {
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      const decoded: DecodedToken = jwtDecode(accessToken);
      return {
        id: `user-${decoded.employeeId}`,
        name: decoded.name,
        role: decoded.role,
        employeeId: decoded.employeeId,
      };
    }
    return null;
  },

  logout: async (): Promise<void> => {
    try {
      await request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  },

  getProfile: async (): Promise<User | null> => {

    if (!getToken()) return null;

    const token = getToken();
    if (token) {
      const decoded: DecodedToken = jwtDecode(token);
      return {
        id: `user-${decoded.employeeId}`,
        name: decoded.name,
        role: decoded.role,
        employeeId: decoded.employeeId,
      };
    }
    return null;
  },

  // --- EMPLOYEE CRUD API INTEGRATION ---
  getEmployees: (): Promise<Employee[]> => request('/employees'),
  getEmployeeById: (id: string): Promise<Employee> => request(`/employees/${id}`),
  updateEmployee: (employeeData: Employee): Promise<Employee> => request(`/employees/${employeeData.id}`, {
    method: 'PUT',
    body: JSON.stringify(employeeData),
  }),
  addEmployee: (employeeData: Omit<Employee, 'id' | 'avatar'>): Promise<Employee> => request('/employees', {
    method: 'POST',
    body: JSON.stringify(employeeData),
  }),
  // New: Delete Employee
  deleteEmployee: (id: string): Promise<void> => request<void>(`/employees/${id}`, {
    method: 'DELETE',
  }),

  // --- ATTENDANCE APIS ---
  getAttendanceForEmployee: (employeeId: string): Promise<AttendanceRecord[]> => request(`/attendance/employee/${employeeId}`),
  getAllAttendance: (): Promise<AttendanceRecord[]> => request('/attendance'),

  clockIn: (employeeId: string, location?: string, customTime?: string, recordDate?: string): Promise<{ record: AttendanceRecord, session: AttendanceSession }> => request('/attendance/clock-in', {
    method: 'POST',
    body: JSON.stringify({ employeeId, location, customTime, recordDate }),
  }),
  clockOut: (employeeId: string, customTime?: string, breakStart?: string, breakEnd?: string, recordDate?: string): Promise<AttendanceRecord> => request('/attendance/clock-out', {
    method: 'POST',
    body: JSON.stringify({ employeeId, customTime, breakStart, breakEnd, recordDate }),
  }),
  startBreak: (employeeId: string, breakType: string, customTime?: string): Promise<AttendanceRecord> => request('/attendance/break/start', {
    method: 'POST',
    body: JSON.stringify({ employeeId, breakType, customTime }),
  }),
  endBreak: (employeeId: string): Promise<AttendanceRecord> => request('/attendance/break/end', {
    method: 'POST',
    body: JSON.stringify({ employeeId }),
  }),
  getStats: (employeeId: string): Promise<AttendanceStats> => request(`/attendance/stats/${employeeId}`),

  // Deprecated or unused
  fixMissingClockOut: (recordId: string, clockOutTime: string, breakStart?: string, breakEnd?: string): Promise<AttendanceRecord> => request(`/attendance/fix-missing-clock-out`, {
    method: 'POST',
    body: JSON.stringify({ recordId, clockOutTime, breakStart, breakEnd }),
  }),
  getTodayAttendanceForEmployee: (employeeId: string, date?: string): Promise<AttendanceRecord | null> => {
    const url = date ? `/attendance/today/${employeeId}?date=${date}` : `/attendance/today/${employeeId}`;
    return request(url);
  },
  getAttendanceById: (id: string): Promise<AttendanceRecord> => request(`/attendance/${id}`),

  // --- APPROVAL APIS ---
  getApprovalRequests: (): Promise<ApprovalRequest[]> => request('/approvals'),
  updateApprovalStatus: (id: string, status: 'Approved' | 'Rejected'): Promise<ApprovalRequest> => request(`/approvals/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // --- AUDIT LOGS ---
  getAuditLogsForEmployee: (employeeId: string): Promise<AuditLog[]> => request(`/audit-logs/${employeeId}`),

  // --- HOLIDAYS ---
  getPublicHolidays: (): Promise<PublicHoliday[]> => request('/holidays'),
  addPublicHoliday: (holiday: PublicHoliday): Promise<PublicHoliday> => request('/holidays', {
    method: 'POST',
    body: JSON.stringify(holiday),
  }),
};

// Simple jwt-decode polyfill
const b64Decode = (str: string) =>
  decodeURIComponent(
    atob(str.replace(/-/g, '+').replace(/_/g, '/'))
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );

// Add jwt-decode to the global scope if it's not already there.
if (typeof (window as any).jwt_decode === 'undefined') {
  (window as any).jwt_decode = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token');
      }
      const payload = parts[1];
      return JSON.parse(b64Decode(payload));
    } catch (e) {
      throw new Error('Failed to decode token');
    }
  };
}