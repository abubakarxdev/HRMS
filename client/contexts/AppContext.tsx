import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  User,
  Role,
  Employee,
  AttendanceRecord,
  ApprovalRequest,
  PublicHoliday,
} from "../types";
import { api } from "../services/apiService";
interface AppContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  employees: Employee[];
  attendance: AttendanceRecord[];
  approvals: ApprovalRequest[];
  holidays: PublicHoliday[];
  loading: boolean;

  fetchEmployees: () => Promise<void>;
  fetchAttendance: () => Promise<void>;
  fetchApprovals: () => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  addEmployee: (employee: Omit<Employee, "id" | "avatar">) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  handleApproval: (
    id: string,
    status: "Approved" | "Rejected"
  ) => Promise<void>;
  performClockAction: (
    employeeId: string,
    action: "in" | "out",
    time?: string,
    breakStart?: string,
    breakEnd?: string,
    recordDate?: string,
    location?: string
  ) => Promise<void>;
  fixMissingClockOut: (recordId: string, clockOutTime: string, breakStart?: string, breakEnd?: string) => Promise<void>;
  addHoliday: (holiday: PublicHoliday) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // view and selectedEmployeeId are removed
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
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

  const login = async (email: string, password: string): Promise<void> => {
    // Do not set global loading here, let the UI handle it
    try {
      const loggedInUser = await api.login(email, password);
      if (loggedInUser) {
        setUser(loggedInUser);
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  // setView function is removed

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
    } catch (e) {
      console.error("Failed to fetch attendance:", e);
    }
  }, []);

  const fetchApprovals = useCallback(async () => {
    try {
      const data = await api.getApprovalRequests();
      setApprovals(data);
    } catch (e) {
      console.error("Failed to fetch approvals:", e);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const data = await api.getPublicHolidays();
      setHolidays(data);
    } catch (e) {
      console.error("Failed to fetch holidays:", e);
    }
  }, []);

  // Fetch all required data on user login
  useEffect(() => {
    if (user) {
      const fetchAllData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchEmployees(),
            fetchAttendance(),
            fetchApprovals(),
            fetchHolidays(),
          ]);
        } catch (error) {
          console.error("Error fetching initial data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchAllData();
    }
  }, [user, fetchEmployees, fetchAttendance, fetchApprovals, fetchHolidays]);

  // Implementations for actions using the API

  const updateEmployee = async (employeeData: Employee) => {
    try {
      await api.updateEmployee(employeeData);
      await fetchEmployees();
      console.log("Employee updated successfully:", employeeData.id);
    } catch (error) {
      console.error("Failed to update employee:", error);
      throw error;
    }
  };

  const addEmployee = async (employeeData: Omit<Employee, "id" | "avatar">) => {
    try {
      await api.addEmployee(employeeData);
      await fetchEmployees();
      console.log("Employee added successfully:", employeeData.email);
    } catch (error) {
      console.error("Failed to add employee:", error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await api.deleteEmployee(id);
      await fetchEmployees();
      console.log("Employee deleted successfully:", id);
    } catch (error) {
      console.error("Failed to delete employee:", error);
      throw error;
    }
  };

  const handleApproval = async (
    id: string,
    status: "Approved" | "Rejected"
  ) => {
    try {
      await api.updateApprovalStatus(id, status);
      await fetchApprovals();
      console.log(`Approval request ${id} ${status}`);
    } catch (error) {
      console.error(`Failed to handle approval ${id}:`, error);
      throw error;
    }
  };

  const performClockAction = async (
    employeeId: string,
    action: "in" | "out",
    time?: string,
    breakStart?: string,
    breakEnd?: string,
    recordDate?: string,
    location?: string
  ) => {
    try {
      if (action === "in") {
        await api.clockIn(employeeId, location, time, recordDate);
      } else {
        await api.clockOut(employeeId, time, breakStart, breakEnd, recordDate);
      }
      await fetchAttendance();
      console.log(`Clock ${action} successful for ${employeeId}`);
    } catch (error) {
      console.error(`Failed to perform clock ${action} action:`, error);
      throw error;
    }
  };

  const fixMissingClockOut = async (recordId: string, clockOutTime: string, breakStart?: string, breakEnd?: string) => {
    try {
      await api.fixMissingClockOut(recordId, clockOutTime, breakStart, breakEnd);
      await fetchAttendance();
      console.log(`Fixed missing clock out for record ${recordId}`);
    } catch (error) {
      console.error(`Failed to fix missing clock out:`, error);
      throw error;
    }
  };

  const addHoliday = async (holiday: PublicHoliday) => {
    try {
      await api.addPublicHoliday(holiday);
      await fetchHolidays();
      console.log("Holiday added successfully:", holiday.name);
    } catch (error) {
      console.error("Failed to add holiday:", error);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        employees,
        attendance,
        approvals,
        holidays,
        loading,
        fetchEmployees,
        fetchAttendance,
        fetchApprovals,
        updateEmployee,
        addEmployee,
        deleteEmployee,
        handleApproval,
        performClockAction,
        fixMissingClockOut,
        addHoliday,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
