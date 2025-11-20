import React from "react";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import EmployeeDirectory from "./components/employees/EmployeeDirectory";
import EmployeeProfile from "./components/employees/EmployeeProfile";
import AddEmployeeForm from "./components/employees/AddEmployeeForm";
import AttendanceReport from "./components/attendance/AttendanceReport";
import TeamSnapshot from "./components/attendance/TeamSnapshot";
import { View } from "./types";
import Login from "./components/auth/Login";
import Toaster from "./components/ui/Toaster";

const App: React.FC = () => {
  return (
    <AppProvider>
      <AuthGate />
      <Toaster />
    </AppProvider>
  );
};

const AuthGate: React.FC = () => {
  const { user, loading } = useAppContext();

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Toaster />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Main />;
};

const Main: React.FC = () => {
  const { view, selectedEmployeeId } = useAppContext();

  const renderView = () => {
    switch (view) {
      case View.DASHBOARD:
        return <Dashboard />;
      case View.EMPLOYEES:
        return <EmployeeDirectory />;
      case View.ADD_EMPLOYEE:
        return <AddEmployeeForm />;
      case View.PROFILE:
        return selectedEmployeeId ? (
          <EmployeeProfile employeeId={selectedEmployeeId} />
        ) : (
          <EmployeeDirectory />
        );
      case View.ATTENDANCE:
        return <AttendanceReport />;
      case View.TEAM_ATTENDANCE:
        return <TeamSnapshot />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout>{renderView()}</Layout>;
};

export default App;
