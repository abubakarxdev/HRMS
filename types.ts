export enum Role {
  ADMIN_HR = 'Admin HR',
  MANAGER = 'Manager',
  EMPLOYEE = 'Employee',
}

export enum View {
  DASHBOARD = 'Dashboard',
  EMPLOYEES = 'Employees',
  PROFILE = 'Profile',
  ATTENDANCE = 'Attendance',
  TEAM_ATTENDANCE = 'Team Attendance',
}

export interface User {
  id: string;
  name: string;
  role: Role;
  employeeId: string;
}

export interface Employee {
  id:string;
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

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: 'Present' | 'Absent' | 'On Leave';
  breakHours?: number;
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