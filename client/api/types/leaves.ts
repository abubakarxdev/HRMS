export interface LeaveBalance {
  id: string;
  leaveType: string; // This is the code/name string usually
  leaveTypeId: string; // Added ID
  totalCredits: number;
  usedCredits: number;
  isArchived?: boolean; // Added Archival Status
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  isPaid: boolean;
  allowHalfDay: boolean;
  description?: string;
  isActive: boolean;
}

export interface LeaveRequest {
  id: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  approverComments?: string;
  createdAt: string;
  attachmentUrl?: string; // Optional attachment URL
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeIdNumber: string;
    avatarUrl?: string;
    workEmail?: string; // Added workEmail
  };
}

export interface CreateLeaveRequest {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  duration?: string;
  attachmentUrl?: string;
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
