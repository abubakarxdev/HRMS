import { Employee, AttendanceRecord, ApprovalRequest, AuditLog, PublicHoliday, User, Role } from '../types';
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

const getAuthHeader = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
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
    // Implementation remains the same
    const { token } = await request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (token) {
      localStorage.setItem('token', token);
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

  getProfile: async (): Promise<User | null> => {

    if (!getToken()) return null;
    
    const token = getToken();
    if(token) {
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
  
  clockIn: (employeeId: string, time?: string): Promise<AttendanceRecord> => request('/attendance/clock-in', {
    method: 'POST',
    body: JSON.stringify({ employeeId, time }),
  }),
  clockOut: (employeeId: string, time?: string, breakHours?: number): Promise<AttendanceRecord> => request('/attendance/clock-out', {
    method: 'POST',
    body: JSON.stringify({ employeeId, time, breakHours }),
  }),
  fixMissingClockOut: (recordId: string, clockOutTime: string): Promise<AttendanceRecord> => request(`/attendance/fix-missing-clock-out`, {
      method: 'POST',
      body: JSON.stringify({ recordId, clockOutTime }),
  }),
  getTodayAttendanceForEmployee: (employeeId: string): Promise<AttendanceRecord | null> => request(`/attendance/today/${employeeId}`),

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