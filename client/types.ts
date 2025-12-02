export enum Role {
  ADMIN = 'ADMIN',
  HR = 'HR',
  FINANCE = 'FINANCE',
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER', // Deprecated
}

export enum View {
  DASHBOARD = 'Dashboard',
  EMPLOYEES = 'Employees',
  PROFILE = 'Profile',
  ATTENDANCE = 'Attendance',
  TEAM_ATTENDANCE = 'Team Attendance',
  ADD_EMPLOYEE = 'Add Employee Form'
}

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: Role;
  employeeId: string | null;
  timezone: string;
}

// Updated Employee Interface
export interface Employee {
  id: string;
  employeeIdNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail?: string | null;
  avatarUrl?: string | null;
  status: string;
  joiningDate: string;

  // Relations
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'HR' | 'FINANCE' | 'EMPLOYEE';
    timezone: string;
  };
  legalEntity?: {
    id: string;
    name: string;
  } | null;
  office?: {
    id: string;
    name: string;
  } | null;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;

  // Legacy fields (optional for compatibility during migration)
  name?: string;
  position?: string;
  department?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'ON_LEAVE';
export type SessionStatus = 'ACTIVE' | 'COMPLETED';

export interface Break {
  id: string;
  sessionId: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
}

export interface Session {
  id: string;
  attendanceRecordId: string;
  checkInTime: string;
  checkOutTime: string | null;
  location: string;
  durationMinutes: number;
  status: SessionStatus;
  breaks: Break[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  sessions: Session[];

  // Optional employee info
  employee?: {
    id: string;
    employeeIdNumber: string;
    firstName: string;
    lastName: string;
  };

  // Legacy fields
  totalHours?: number;
  clockIn?: string;
  clockOut?: string;
  breakHours?: number;
}

export interface AttendanceStats {
  minutesToday: number;
  minutesThisWeek: number;
  minutesThisMonth: number;
  hoursToday: string;
  hoursThisWeek: string;
  hoursThisMonth: string;
}

export interface ApprovalRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Attendance Correction' | 'Leave Request';
  date: string;
  details: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface PublicHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}