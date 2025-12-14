import React from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { NAVIGATION_ITEMS, NAVIGATION_PATHS } from "../../constants";

const LogoIcon = () => (
  <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    <path d="M19.34 10.34C20.37 11.2 21 12.53 21 14v2h2v-2c0-2.21-1.26-4.14-3.11-5.14l-1.55 1.48zM4.66 10.34l-1.55-1.48C1.26 9.86 0 11.79 0 14v2h2v-2c0-1.47.63-2.8 1.66-3.66z" />
  </svg>
);

// Reworked NavItem to use React Router hooks
const NavItem: React.FC<{
  path: string;
  label: string;
  icon: React.ReactElement;
  isActive: boolean;
}> = ({ path, label, icon, isActive }) => {
  const navigate = useNavigate();

  // Determine primary color dynamically
  const primaryColorClass = "bg-indigo-700"; // Assuming primary-700 maps to indigo-700
  const hoverColorClass = "hover:bg-indigo-700";

  return (
    <button
      onClick={() => navigate(path)}
      className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors ${
        isActive
          ? `${primaryColorClass} text-white`
          : `text-indigo-100 ${hoverColorClass} hover:text-white`
      }`}
    >
      {icon}
      <span className="ml-4 font-medium">{label}</span>
    </button>
  );
};

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation(); // Hook to get current path
  const [searchParams] = useSearchParams();
  const officeId = searchParams.get('officeId');

  if (!user) {
    return null; // Don't show sidebar if not logged in
  }

  const icons: { [key: string]: React.ReactElement } = {
    [NAVIGATION_PATHS.DASHBOARD]: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
    [NAVIGATION_PATHS.EMPLOYEES]: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-3M15 21a3 3 0 01-3-3V15"
        />
      </svg>
    ),

    [NAVIGATION_PATHS.ATTENDANCE_LOG]: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
    [NAVIGATION_PATHS.TEAM_ATTENDANCE]: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    [NAVIGATION_PATHS.LEAVES]: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    [NAVIGATION_PATHS.LEAVE_REQUESTS]: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
    [NAVIGATION_PATHS.OFFICES]: (
       <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  };

  const isLinkActive = (path: string) => {
    // Special case for dashboard roots: only active if path is exactly '/' or '/admin' or '/platform'
    if (path === "/" || path === "/admin" || path === "/platform") {
      return location.pathname === path;
    }
    // Prevent Leaves tab from being active when on Leave Requests sub-route
    if (path === NAVIGATION_PATHS.LEAVES && location.pathname.startsWith(NAVIGATION_PATHS.LEAVE_REQUESTS)) {
        return false;
    }

    // For all other links, check if the current path starts with the link path
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-indigo-600 text-white flex-col hidden md:flex">
      <div className="flex items-center justify-center h-20 border-b border-indigo-700">
        <LogoIcon />
        <h1 className="text-2xl font-bold ml-2">HRIS Pro</h1>
      </div>
      <nav className="flex-1 p-4">
        {NAVIGATION_ITEMS.filter(
          (item) => user && item.roles.includes(user.role)
        ) // Added user check
          .map((item) => {
             let path = item.path;
             // Dynamic path adjustment for Admin
             if (user.role === 'ADMIN') {
                 if (item.path === NAVIGATION_PATHS.DASHBOARD) path = '/admin';
                 else if (item.path === NAVIGATION_PATHS.EMPLOYEES) path = '/admin/employees';
                 else if (item.path === NAVIGATION_PATHS.ATTENDANCE_LOG) path = '/admin/attendance';
                 else if (item.path === NAVIGATION_PATHS.LEAVES) path = '/admin/my-leaves';
                 else if (item.path === NAVIGATION_PATHS.TEAM_ATTENDANCE) path = '/admin/team';
                 else if (item.path === NAVIGATION_PATHS.TEAM_ATTENDANCE) path = '/admin/team';
             }

             // For Employee/HR: Append officeId to Team Attendance path
             if ((user.role === 'EMPLOYEE' || user.role === 'HR') && item.path === NAVIGATION_PATHS.TEAM_ATTENDANCE) {
                 const empOfficeId = user.officeId;
                 if (empOfficeId) {
                     path = `${NAVIGATION_PATHS.TEAM_ATTENDANCE}/${empOfficeId}`;
                 }
             }
             
             // Append officeId query param if it exists and path doesn't already have it (mostly for Admin context switching)
             if (officeId && !path.includes('?') && !path.includes(officeId)) {
                 path += `?officeId=${officeId}`;
             }

             return (
                <NavItem
                  key={item.path}
                  path={path}
                  label={item.label}
                  icon={icons[item.path]}
                  isActive={isLinkActive(path.split('?')[0])} 
                />
            );
          })}
      </nav>
    </div>
  );
};

export default Sidebar;
