import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from "./components/layout/Layout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import EmployeeDirectoryPage from "./pages/employees/EmployeeDirectoryPage";
import EmployeeProfilePage from "./pages/employees/EmployeeProfilePage";
import AddEmployeePage from "./pages/employees/AddEmployeePage";
import EmployeeContractsPage from "./pages/admin/EmployeeContractsPage";
import LeavePoliciesPage from "./pages/admin/LeavePoliciesPage";
import AttendanceLogPage from "./pages/attendance/AttendanceLogPage";
import SessionDetailsPage from "./pages/attendance/SessionDetailsPage";
import TeamSnapshotPage from "./pages/attendance/TeamSnapshotPage";
import LeavesPage from "./pages/leaves/LeavesPage";
import LeaveRequestsPage from "./pages/admin/LeaveRequestsPage";
import { NAVIGATION_PATHS } from "./constants";
import Login from "./components/auth/Login";
import Toaster from "./components/ui/Toaster";
import FourSquare from "./components/ui/FourSquare";
import PlatformLayout from "./components/layout/PlatformLayout";
import TenantsPage from "./pages/platform/TenantsPage";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import GlobalAdminsPage from "./pages/platform/GlobalAdminsPage";
import PlatformSettingsPage from "./pages/platform/PlatformSettingsPage";
import OfficesPage from "./pages/admin/OfficesPage";
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import LeaveRequestDetailsPage from "./pages/admin/LeaveRequestDetailsPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import HolidayManagementPage from "./pages/admin/HolidayManagementPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthGate />
          <Toaster />
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const AuthGate: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FourSquare />
      </div>
    );
  }

  // Not Authenticated: Redirect to Login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Super Admin: Authenticated but restricted to Platform
  if (user.role === 'SUPER_ADMIN') {
      return <PlatformRoutes />;
  }

  // Company Admin: Authenticated but restricted to Admin Dashboard & Office Mgmt
  if (user.role === 'ADMIN') {
      return <AdminRoutes />;
  }

  // Authenticated Standard User: Render the Main application routes (Employees, etc.)
  // Actually, Main uses 'Layout' which has Sidebar. 
  // If we split Admin, Main might be just for Employee/HR roles.
  return <Main />;
};

const PlatformRoutes: React.FC = () => {
    return (
        <Routes>
            <Route element={<PlatformLayout />}>
                <Route path="/platform" element={<PlatformDashboard />} />
                <Route path="/platform/tenants" element={<TenantsPage />} />
                <Route path="/platform/admins" element={<GlobalAdminsPage />} />
                <Route path="/platform/settings" element={<PlatformSettingsPage />} />
                <Route path="*" element={<Navigate to="/platform" replace />} />
            </Route>
        </Routes>
    );
};

const AdminRoutes: React.FC = () => {
    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/notifications" element={<NotificationsPage />} />
                <Route path="/admin/employees" element={<EmployeeDirectoryPage />} /> 
                <Route path="/admin/employees/add" element={<AddEmployeePage />} />
                <Route path="/admin/employees/:employeeId" element={<EmployeeProfileWrapper />} />
                <Route path="/admin/employees/edit/:employeeId" element={<AddEmployeePage />} />
                <Route path="/admin/contracts" element={<EmployeeContractsPage />} />
                <Route path="/admin/attendance" element={<AttendanceLogPage />} />
                <Route path="/attendance/session/:sessionId" element={<SessionDetailsPage />} />
                <Route path="/admin/team" element={<TeamSnapshotPage />} />
                <Route path="/admin/my-leaves" element={<LeavesPage />} /> 
                <Route path="/admin/leaves/requests" element={<LeaveRequestsPage />} />
                <Route path="/admin/leave-request/:id" element={<LeaveRequestDetailsPage />} />
                {/* Alias for robust routing */}
                <Route path="/hr-request/:id" element={<LeaveRequestDetailsPage />} />
                <Route path="/admin/offices" element={<OfficesPage />} />
                <Route path="/admin/holidays" element={<HolidayManagementPage />} />
                <Route path="/admin/policies" element={<LeavePoliciesPage />} />
                {/* Fallback to dashboard */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
        </Routes>
    );
}

const Main: React.FC = () => {
  return (
    <Layout>
      <Routes>
        {/* Dashboard - Default Route */}
        <Route path={NAVIGATION_PATHS.DASHBOARD} element={<DashboardPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Employee Self-Service Routes */}
        {/* Helper function to keep generic routes working for Employees */}
        
        {/* 
            TODO: Refactor EmployeeDirectory etc to be simpler for standard employees? 
            Or reused.
            For now, Main handles Employee View.
        */}

        <Route
          path={NAVIGATION_PATHS.EMPLOYEES}
          element={<EmployeeDirectoryPage />}
        />
        <Route
          path={`${NAVIGATION_PATHS.EMPLOYEES}/add`}
          element={<AddEmployeePage />}
        />
        <Route
          path={`${NAVIGATION_PATHS.EMPLOYEES}/edit/:employeeId`}
          element={<AddEmployeePage />}
        />
        <Route
          path={`${NAVIGATION_PATHS.EMPLOYEES}/:employeeId`}
          element={<EmployeeProfileWrapper />}
        />

        {/* Attendance Routes */}
        <Route
          path={NAVIGATION_PATHS.TEAM_ATTENDANCE}
          element={<TeamSnapshotPage />}
        />
        <Route
          path={`${NAVIGATION_PATHS.TEAM_ATTENDANCE}/:officeId`}
          element={<TeamSnapshotPage />}
        />
        <Route
          path="/attendance/log"
          element={<AttendanceLogPage />}
        />
        <Route
          path="/attendance/session/:sessionId"
          element={<SessionDetailsPage />}
        />
        <Route
          path={NAVIGATION_PATHS.LEAVES}
          element={<LeavesPage />}
        />
        <Route
          path={NAVIGATION_PATHS.LEAVE_REQUESTS}
          element={<LeaveRequestsPage />}
        />
        {/* Helper route for HR access to details */}
        <Route 
          path="/leave-request/:id" 
          element={<LeaveRequestDetailsPage />} 
        />
        {/* Allow HR to access the detail page via the same path used by the component */}
        <Route 
          path="/hr-request/:id" 
          element={<LeaveRequestDetailsPage />} 
        />
        {/* Alias for robust routing */}
        <Route 
          path="/admin/leave-request/:id" 
          element={<LeaveRequestDetailsPage />} 
        />
        <Route
          path={NAVIGATION_PATHS.CONTRACTS}
          element={<EmployeeContractsPage />}
        />
        <Route
          path={NAVIGATION_PATHS.HOLIDAYS}
          element={<HolidayManagementPage />}
        />
        <Route
          path="/policies"
          element={<LeavePoliciesPage />}
        />
        
        {/* Remove Admin Routes from Main since they are now in AdminRoutes */}
        {/* 
            Note: EmployeeDirectory was used by "HR" role too in Main. 
            If "HR" role exists, we need to decide if they use AdminRoutes or Main.
            Assuming HR uses Main or a similar HR layout. 
            For now, simpler to leave Main as is for "HR" and "EMPLOYEE".
        */}

        <Route
          path="*"
          element={<Navigate to={NAVIGATION_PATHS.DASHBOARD} replace />}
        />
      </Routes>
    </Layout>
  );
};

// Wrapper component to extract employeeId from URL param and pass it as prop
const EmployeeProfileWrapper: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();

  // Ensure the employeeId exists before rendering the profile
  if (!employeeId) {
    return <Navigate to={NAVIGATION_PATHS.EMPLOYEES} replace />;
  }

  return <EmployeeProfilePage employeeId={employeeId} />;
};

export default App;
