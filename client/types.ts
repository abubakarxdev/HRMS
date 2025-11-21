export enum Role {
  ADMIN_HR = 'ADMIN_HR',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
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
  name: string;
  role: Role;
  employeeId: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  position: string;
  department: string;
  managerId?: string;
  hireDate: string;
  avatar: string;
  status: 'Active' | 'Inactive';
  nid: string; // Encrypted
  bankDetails: string; // Encrypted
}

export interface AttendanceSession {
  id: number;
  attendanceRecordId: number;
  checkIn: string;
  checkOut: string | null;
  location: string | null;
  type: 'WORK' | 'BREAK';
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  status: 'Present' | 'Absent' | 'On Leave';
  breakHours?: number;
  totalHours?: number;
  sessions?: AttendanceSession[];
}

export interface AttendanceStats {
  hoursToday: number;
  hoursThisWeek: number;
  hoursThisMonth: number;
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