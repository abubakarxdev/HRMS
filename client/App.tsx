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
import Dashboard from "./components/dashboard/Dashboard";
import EmployeeDirectory from "./components/employees/EmployeeDirectory";
import EmployeeProfile from "./components/employees/EmployeeProfile";
import AddEmployeeForm from "./components/employees/AddEmployeeForm";
import AttendanceLog from "./components/attendance/AttendanceLog";
import SessionDetailsPage from "./components/attendance/SessionDetailsPage";
import TeamSnapshot from "./components/attendance/TeamSnapshot";
import { NAVIGATION_PATHS } from "./constants";
import Login from "./components/auth/Login";
import Toaster from "./components/ui/Toaster";
import FourSquare from "./components/ui/FourSquare";

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

  // Authenticated: Render the Main application routes
  return <Main />;
};

const Main: React.FC = () => {
  return (
    <Layout>
      <Routes>
        {/* Dashboard - Default Route */}
        <Route path={NAVIGATION_PATHS.DASHBOARD} element={<Dashboard />} />

        {/* Employee Management Routes */}
        <Route
          path={NAVIGATION_PATHS.EMPLOYEES}
          element={<EmployeeDirectory />}
        />
        <Route
          path={`${NAVIGATION_PATHS.EMPLOYEES}/add`}
          element={<AddEmployeeForm />}
        />
        <Route
          path={`${NAVIGATION_PATHS.EMPLOYEES}/edit/:employeeId`}
          element={<AddEmployeeForm />}
        />
        <Route
          path={`${NAVIGATION_PATHS.EMPLOYEES}/:employeeId`}
          element={<EmployeeProfileWrapper />}
        />

        {/* Attendance Routes */}
        <Route
          path={NAVIGATION_PATHS.TEAM_ATTENDANCE}
          element={<TeamSnapshot />}
        />
        <Route
          path="/attendance/log"
          element={<AttendanceLog />}
        />
        <Route
          path="/attendance/session/:sessionId"
          element={<SessionDetailsPage />}
        />
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

  return <EmployeeProfile employeeId={employeeId} />;
};

export default App;
