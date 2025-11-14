import { Role, View } from './types';

export const ROLES: Role[] = [Role.ADMIN_HR, Role.MANAGER, Role.EMPLOYEE];

export const NAVIGATION_ITEMS = [
  { view: View.DASHBOARD, label: 'Dashboard', roles: [Role.ADMIN_HR, Role.MANAGER, Role.EMPLOYEE] },
  { view: View.TEAM_ATTENDANCE, label: 'Team Attendance', roles: [Role.ADMIN_HR, Role.MANAGER, Role.EMPLOYEE] },
  { view: View.EMPLOYEES, label: 'Employees', roles: [Role.ADMIN_HR, Role.MANAGER] },
  { view: View.ATTENDANCE, label: 'Attendance', roles: [Role.ADMIN_HR, Role.MANAGER] },
];