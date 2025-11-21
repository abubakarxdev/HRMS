import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import EmployeeDirectory from "./components/employees/EmployeeDirectory";
import EmployeeProfile from "./components/employees/EmployeeProfile";
import AddEmployeeForm from "./components/employees/AddEmployeeForm";
import AttendanceDashboard from "./components/attendance/AttendanceDashboard";
import TeamSnapshot from "./components/attendance/TeamSnapshot";
import { NAVIGATION_PATHS } from "./constants";
import Login from "./components/auth/Login";
import Toaster from "./components/ui/Toaster";
import FourSquare from "./components/ui/FourSquare";

const App: React.FC = () => {
  // We wrap the entire application in BrowserRouter to enable routing
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthGate />
        <Toaster />
      </AppProvider>
    </BrowserRouter>
  );
};

const AuthGate: React.FC = () => {
  const { user, loading } = useAppContext();

  // Loading State
  if (loading) {
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
        {/* Use hardcoded /login path as it's outside the main authenticated routes */}
        <Route path="/login" element={<Login />} />
        {/* Redirect any other attempts to /login */}
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
          path={NAVIGATION_PATHS.ATTENDANCE}
          element={<AttendanceDashboard />}
        />
        <Route
          path={NAVIGATION_PATHS.TEAM_ATTENDANCE}
          element={<TeamSnapshot />}
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
    // Redirect to the directory if the ID is missing in the URL
    return <Navigate to={NAVIGATION_PATHS.EMPLOYEES} replace />;
  }

  return <EmployeeProfile employeeId={employeeId} />;
};

export default App;
