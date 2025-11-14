import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Role, View, Employee, AttendanceRecord, ApprovalRequest, PublicHoliday } from '../types';
import { api } from '../services/apiService';
import { ROLES } from '../constants';

interface AppContextType {
  user: User;
  setUserRole: (role: Role) => void;
  view: View;
  setView: (view: View, employeeId?: string) => void;
  employees: Employee[];
  attendance: AttendanceRecord[];
  approvals: ApprovalRequest[];
  holidays: PublicHoliday[];
  loading: boolean;
  selectedEmployeeId: string | null;
  fetchEmployees: () => Promise<void>;
  fetchAttendance: () => Promise<void>;
  fetchApprovals: () => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id' | 'avatar'>) => Promise<void>;
  handleApproval: (id: string, status: 'Approved' | 'Rejected') => Promise<void>;
  performClockAction: (employeeId: string, action: 'in' | 'out', time?: string, breakHours?: number) => Promise<void>;
  fixMissingClockOut: (recordId: string, clockOutTime: string) => Promise<void>;
  addHoliday: (holiday: PublicHoliday) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>({ id: 'user-1', name: 'Admin User', role: Role.ADMIN_HR, employeeId: 'emp-005' });
  const [view, setViewInternal] = useState<View>(View.DASHBOARD);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  const setUserRole = (role: Role) => {
    // In a real app, this would be a full login flow. Here we just switch roles.
    const employeeForRole = employees.find(e => {
        if (role === Role.ADMIN_HR) return e.department === 'Human Resources';
        if (role === Role.MANAGER) return employees.some(emp => emp.managerId === e.id);
        return e.department !== 'Human Resources' && !employees.some(emp => emp.managerId === e.id);
    }) || employees[0];

    setUser({ id: `user-${employeeForRole.id}`, name: employeeForRole.name, role, employeeId: employeeForRole.id });
    setViewInternal(View.DASHBOARD);
  };
  
  const setView = (newView: View, employeeId?: string) => {
    setViewInternal(newView);
    if (employeeId) {
      setSelectedEmployeeId(employeeId);
    } else if (newView !== View.PROFILE) {
      setSelectedEmployeeId(null);
    }
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const data = await api.getEmployees();
    setEmployees(data);
    setLoading(false);
  }, []);

  const fetchAttendance = useCallback(async () => {
    const data = await api.getAllAttendance();
    setAttendance(data);
  }, []);

  const fetchApprovals = useCallback(async () => {
    const data = await api.getApprovalRequests();
    setApprovals(data);
  }, []);
  
  const fetchHolidays = useCallback(async () => {
    const data = await api.getPublicHolidays();
    setHolidays(data);
  }, []);

  const updateEmployee = async (employeeData: Employee) => {
    await api.updateEmployee(employeeData);
    await fetchEmployees(); // Refresh list
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'avatar'>) => {
    await api.addEmployee(employeeData);
    await fetchEmployees();
  };

  const handleApproval = async (id: string, status: 'Approved' | 'Rejected') => {
    await api.updateApprovalStatus(id, status);
    await fetchApprovals();
  };

  const performClockAction = async (employeeId: string, action: 'in' | 'out', time?: string, breakHours?: number) => {
    if (action === 'in') {
      await api.clockIn(employeeId, time);
    } else {
      await api.clockOut(employeeId, time, breakHours);
    }
    await fetchAttendance();
  };

  const fixMissingClockOut = async (recordId: string, clockOutTime: string) => {
    await api.fixMissingClockOut(recordId, clockOutTime);
    await fetchAttendance();
  };

  const addHoliday = async (holiday: PublicHoliday) => {
    await api.addPublicHoliday(holiday);
    await fetchHolidays();
  };
  
  useEffect(() => {
    // FIX: Corrected typo from `constfetchAllData` to `const fetchAllData`.
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchAttendance(), fetchApprovals(), fetchHolidays()]);
      setLoading(false);
    }
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider value={{
      user, setUserRole,
      view, setView,
      employees,
      attendance,
      approvals,
      holidays,
      loading,
      selectedEmployeeId,
      fetchEmployees,
      fetchAttendance,
      fetchApprovals,
      updateEmployee,
      addEmployee,
      handleApproval,
      performClockAction,
      fixMissingClockOut,
      addHoliday
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};