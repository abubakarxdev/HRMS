
import { Employee, AttendanceRecord, ApprovalRequest, AuditLog, PublicHoliday } from '../types';

// --- SEED DATA ---
let employees: Employee[] = [
  { id: 'emp-001', name: 'Alice Johnson', email: 'alice.j@example.com', position: 'Senior Frontend Engineer', department: 'Technology', managerId: 'emp-002', hireDate: '2022-03-15', avatar: 'https://picsum.photos/seed/alice/200', status: 'Active', nid: 'encrypted_nid_1', bankDetails: 'encrypted_bank_1' },
  { id: 'emp-002', name: 'Bob Williams', email: 'bob.w@example.com', position: 'Engineering Manager', department: 'Technology', hireDate: '2021-08-01', avatar: 'https://picsum.photos/seed/bob/200', status: 'Active', nid: 'encrypted_nid_2', bankDetails: 'encrypted_bank_2' },
  { id: 'emp-003', name: 'Charlie Brown', email: 'charlie.b@example.com', position: 'UI/UX Designer', department: 'Design', managerId: 'emp-002', hireDate: '2023-01-20', avatar: 'https://picsum.photos/seed/charlie/200', status: 'Active', nid: 'encrypted_nid_3', bankDetails: 'encrypted_bank_3' },
  { id: 'emp-004', name: 'Diana Prince', email: 'diana.p@example.com', position: 'HR Specialist', department: 'Human Resources', managerId: 'emp-005', hireDate: '2022-09-10', avatar: 'https://picsum.photos/seed/diana/200', status: 'Active', nid: 'encrypted_nid_4', bankDetails: 'encrypted_bank_4' },
  { id: 'emp-005', name: 'Ethan Hunt', email: 'ethan.h@example.com', position: 'HR Director', department: 'Human Resources', hireDate: '2020-05-25', avatar: 'https://picsum.photos/seed/ethan/200', status: 'Active', nid: 'encrypted_nid_5', bankDetails: 'encrypted_bank_5' },
];

let attendance: AttendanceRecord[] = [
  { id: 'att-001', employeeId: 'emp-001', date: '2024-07-28', clockIn: '09:02', clockOut: '17:30', status: 'Present', breakHours: 0.5 },
  { id: 'att-002', employeeId: 'emp-003', date: '2024-07-28', clockIn: '08:55', clockOut: '17:35', status: 'Present', breakHours: 1 },
  { id: 'att-003', employeeId: 'emp-004', date: '2024-07-28', clockIn: null, clockOut: null, status: 'On Leave' },
  { id: 'att-004', employeeId: 'emp-001', date: '2024-07-29', clockIn: '08:58', clockOut: '17:25', status: 'Present', breakHours: 1 },
];

let approvals: ApprovalRequest[] = [
  { id: 'appr-001', employeeId: 'emp-003', employeeName: 'Charlie Brown', type: 'Attendance Correction', date: '2024-07-26', details: 'Forgot to clock out. Actual clock out time: 18:00', status: 'Pending' },
  { id: 'appr-002', employeeId: 'emp-001', employeeName: 'Alice Johnson', type: 'Leave Request', date: '2024-08-05', details: 'Family event.', status: 'Pending' },
];

let auditLogs: { [employeeId: string]: AuditLog[] } = {
  'emp-001': [
    { id: 'log-001', timestamp: '2024-07-20 10:00', user: 'Diana Prince (HR)', action: 'UPDATE', details: 'Updated bank details.' },
    { id: 'log-002', timestamp: '2022-03-15 09:00', user: 'System', action: 'CREATE', details: 'Employee record created.' },
  ]
};

let holidays: PublicHoliday[] = [
  { date: '2024-01-01', name: "New Year's Day" },
  { date: '2024-12-25', name: 'Christmas Day' },
];

const simulateDelay = <T,>(data: T): Promise<T> => {
  // FIX: Handle undefined, as JSON.stringify(undefined) is not valid for JSON.parse.
  // We convert undefined to null, which is a valid JSON value.
  const serializableData = data === undefined ? null : data;
  return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(serializableData))), 500));
};

// --- API FUNCTIONS ---

export const api = {
  getEmployees: () => simulateDelay(employees),
  getEmployeeById: (id: string) => simulateDelay(employees.find(e => e.id === id)),
  updateEmployee: (employeeData: Employee) => {
    employees = employees.map(e => e.id === employeeData.id ? employeeData : e);
    return simulateDelay(employeeData);
  },
  addEmployee: (employeeData: Omit<Employee, 'id' | 'avatar'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: `emp-${String(Date.now()).slice(-4)}`,
      avatar: `https://picsum.photos/seed/${employeeData.name.split(' ')[0]}/200`,
    };
    employees.push(newEmployee);
    return simulateDelay(newEmployee);
  },
  getAttendanceForEmployee: (employeeId: string) => simulateDelay(attendance.filter(a => a.employeeId === employeeId)),
  getAllAttendance: () => simulateDelay(attendance),
  clockIn: (employeeId: string, time?: string) => {
    const today = new Date().toISOString().split('T')[0];
    let record = attendance.find(a => a.employeeId === employeeId && a.date === today);
    const clockInTime = time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit'});
    if (!record) {
      record = { id: `att-${Date.now()}`, employeeId, date: today, clockIn: clockInTime, clockOut: null, status: 'Present' };
      attendance.push(record);
    } else if (!record.clockIn) {
      record.clockIn = clockInTime;
      record.status = 'Present';
    }
    return simulateDelay(record);
  },
  clockOut: (employeeId: string, time?: string, breakHours?: number) => {
    const today = new Date().toISOString().split('T')[0];
    const record = attendance.find(a => a.employeeId === employeeId && a.date === today);
    if (record && record.clockIn) {
      record.clockOut = time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit'});
      if (breakHours !== undefined) {
        record.breakHours = breakHours;
      }
    }
    return simulateDelay(record);
  },
  fixMissingClockOut: (recordId: string, clockOutTime: string) => {
    const record = attendance.find(a => a.id === recordId);
    if (record) {
      record.clockOut = clockOutTime;
    }
    return simulateDelay(record);
  },
  getTodayAttendanceForEmployee: (employeeId: string) => {
     const today = new Date().toISOString().split('T')[0];
     const record = attendance.find(a => a.employeeId === employeeId && a.date === today);
     return simulateDelay(record);
  },
  getApprovalRequests: () => simulateDelay(approvals),
  updateApprovalStatus: (id: string, status: 'Approved' | 'Rejected') => {
    const request = approvals.find(a => a.id === id);
    if (request) {
      request.status = status;
    }
    return simulateDelay(request);
  },
  getAuditLogsForEmployee: (employeeId: string) => simulateDelay(auditLogs[employeeId] || []),
  
  getPublicHolidays: () => simulateDelay(holidays),
  addPublicHoliday: (holiday: PublicHoliday) => {
    if (!holidays.some(h => h.date === holiday.date)) {
      holidays.push(holiday);
      holidays.sort((a, b) => a.date.localeCompare(b.date));
    }
    return simulateDelay(holiday);
  },
};