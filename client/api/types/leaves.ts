export interface LeaveBalance {
  id: string;
  leaveType: string;
  totalCredits: number;
  usedCredits: number;
}

export interface LeaveRequest {
  id: string;
  leaveType: string;
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
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
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
