import { apiClient } from '../client';
import type {
  AttendanceRecord,
  AttendanceStats,
  ClockInRequest,
  ClockInResponse,
  ClockOutRequest,
  StartBreakRequest,
  StartBreakResponse,
  EndBreakRequest,
  EndBreakResponse,
  FixMissingClockOutRequest,
} from '../types/attendance.types';

/**
 * Attendance Service
 * Handles attendance operations (clock in/out, breaks, stats)
 */
export const attendanceService = {
  /**
   * Get all attendance records
   */
  getAll: async (): Promise<AttendanceRecord[]> => {
    const response = await apiClient.get<AttendanceRecord[]>('/attendance');
    return response.data;
  },

  /**
   * Get attendance records for specific employee
   */
  getByEmployeeId: async (employeeId: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> => {
    let url = `/attendance/employee/${employeeId}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await apiClient.get<AttendanceRecord[]>(url);
    return response.data;
  },

  /**
   * Get attendance record by ID
   */
  getById: async (id: string): Promise<AttendanceRecord> => {
    const response = await apiClient.get<AttendanceRecord>(`/attendance/${id}`);
    return response.data;
  },

  /**
   * Get today's attendance for employee
   */
  getTodayAttendance: async (employeeId: string, date?: string): Promise<AttendanceRecord | null> => {
    const url = date
      ? `/attendance/today/${employeeId}?date=${date}`
      : `/attendance/today/${employeeId}`;
    const response = await apiClient.get<AttendanceRecord | null>(url);
    return response.data;
  },

  /**
   * Get attendance stats (today, week, month)
   */
  getStats: async (employeeId: string): Promise<AttendanceStats> => {
    const response = await apiClient.get<AttendanceStats>(`/attendance/stats/${employeeId}`);
    return response.data;
  },

  /**
   * Clock in
   */
  clockIn: async (data: ClockInRequest): Promise<ClockInResponse> => {
    const response = await apiClient.post<ClockInResponse>('/attendance/clock-in', data);
    return response.data;
  },

  /**
   * Clock out
   */
  clockOut: async (data: ClockOutRequest): Promise<AttendanceRecord> => {
    const response = await apiClient.post<AttendanceRecord>('/attendance/clock-out', data);
    return response.data;
  },

  /**
   * Start break
   */
  startBreak: async (data: StartBreakRequest): Promise<StartBreakResponse> => {
    const response = await apiClient.post<StartBreakResponse>('/attendance/break/start', data);
    return response.data;
  },

  /**
   * End break
   */
  endBreak: async (data: EndBreakRequest): Promise<EndBreakResponse> => {
    const response = await apiClient.post<EndBreakResponse>('/attendance/break/end', data);
    return response.data;
  },

  /**
   * Fix missing clock out (Admin/HR function)
   */
  fixMissingClockOut: async (data: FixMissingClockOutRequest): Promise<AttendanceRecord> => {
    const response = await apiClient.post<AttendanceRecord>('/attendance/fix-missing-clock-out', data);
    return response.data;
  },
};
