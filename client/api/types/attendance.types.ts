// Attendance Types (Updated for new Session/Break schema)

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'ON_LEAVE';
export type SessionStatus = 'ACTIVE' | 'COMPLETED';

export interface Break {
  id: string;
  sessionId: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  sessions: Session[];
  createdAt: string;
  updatedAt: string;

  // Optional employee info
  employee?: {
    id: string;
    employeeIdNumber: string;
    firstName: string;
    lastName: string;
  };
}

export interface AttendanceStats {
  minutesToday: number;
  minutesThisWeek: number;
  minutesThisMonth: number;
  hoursToday: string;
  hoursThisWeek: string;
  hoursThisMonth: string;
}

export interface ClockInRequest {
  employeeId: string;
  location?: string;
  customTime?: string;
}

export interface ClockInResponse {
  record: AttendanceRecord;
  session: Session;
}

export interface ClockOutRequest {
  employeeId: string;
  customTime?: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface StartBreakRequest {
  employeeId: string;
  customTime?: string;
}

export interface StartBreakResponse {
  session: Session;
  break: Break;
}

export interface EndBreakRequest {
  employeeId: string;
  customTime?: string;
}

export interface EndBreakResponse {
  session: Session;
  break: Break;
}

export interface FixMissingClockOutRequest {
  recordId: string;
  clockOutTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
