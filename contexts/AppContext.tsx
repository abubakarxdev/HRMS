import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Role, View, Employee, AttendanceRecord, ApprovalRequest, PublicHoliday } from '../types';
import { api } from '../services/apiService';

interface AppContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [view, setViewInternal] = useState<View>(View.DASHBOARD);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setViewInternal(View.DASHBOARD);
    setSelectedEmployeeId(null);
    setEmployees([]);
    setAttendance([]);
    setApprovals([]);
    setHolidays([]);
  }, []);

  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);
      try {
        const userProfile = await api.getProfile();
        if (userProfile) {
          setUser(userProfile);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, [logout]);


  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const loggedInUser = await api.login(email, password);
      if (loggedInUser) {
        setUser(loggedInUser);
        setViewInternal(View.DASHBOARD);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
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
    try {
        const data = await api.getEmployees();
        setEmployees(data);
    } catch (error) {
        console.error("Failed to fetch employees", error);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const data = await api.getAllAttendance();
      setAttendance(data);
    } catch(e) { console.error(e); }
  }, []);

  const fetchApprovals = useCallback(async () => {
    try {
      const data = await api.getApprovalRequests();
      setApprovals(data);
    } catch(e) { console.error(e); }
  }, []);
  
  const fetchHolidays = useCallback(async () => {
    try {
      const data = await api.getPublicHolidays();
      setHolidays(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (user) {
      const fetchAllData = async () => {
        setLoading(true);
        // Mocking data fetching for now, replace with API calls
        await new Promise(res => setTimeout(res, 500));
        setEmployees([]);
        setAttendance([]);
        setApprovals([]);
        setHolidays([]);
        // await Promise.all([fetchEmployees(), fetchAttendance(), fetchApprovals(), fetchHolidays()]);
        setLoading(false);
      }
      fetchAllData();
    }
  }, [user, fetchEmployees, fetchAttendance, fetchApprovals, fetchHolidays]);

  // Placeholder implementations for actions
  const updateEmployee = async (employeeData: Employee) => { console.log('updateEmployee', employeeData); };
  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'avatar'>) => { console.log('addEmployee', employeeData); };
  const handleApproval = async (id: string, status: 'Approved' | 'Rejected') => { console.log('handleApproval', id, status); };
  const performClockAction = async (employeeId: string, action: 'in' | 'out', time?: string, breakHours?: number) => { console.log('performClockAction', employeeId, action); };
  const fixMissingClockOut = async (recordId: string, clockOutTime: string) => { console.log('fixMissingClockOut', recordId, clockOutTime); };
  const addHoliday = async (holiday: PublicHoliday) => { console.log('addHoliday', holiday); };
  

  return (
    <AppContext.Provider value={{
      user, login, logout,
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