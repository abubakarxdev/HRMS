import React from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import EmployeeDirectory from './components/employees/EmployeeDirectory';
import EmployeeProfile from './components/employees/EmployeeProfile';
import AttendanceReport from './components/attendance/AttendanceReport';
import TeamSnapshot from './components/attendance/TeamSnapshot';
import { View } from './types';
import Login from './components/auth/Login';

const App: React.FC = () => {
  return (
    <AppProvider>
      <AuthGate />
    </AppProvider>
  );
};

const AuthGate: React.FC = () => {
  const { user, loading } = useAppContext();

  if (loading && !user) {
    // A simple loading state before we know if user is logged in or not
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
      case View.PROFILE:
        return selectedEmployeeId ? <EmployeeProfile employeeId={selectedEmployeeId} /> : <EmployeeDirectory />;
      case View.ATTENDANCE:
        return <AttendanceReport />;
      case View.TEAM_ATTENDANCE:
        return <TeamSnapshot />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
};

export default App;
