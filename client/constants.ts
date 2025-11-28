import { Role } from './types';


export const NAVIGATION_PATHS = {
    DASHBOARD: '/',
    EMPLOYEES: '/employees',
    ATTENDANCE: '/attendance',
    ATTENDANCE_LOG: '/attendance/log',
    TEAM_ATTENDANCE: '/attendance/team',
};


interface NavigationItem {
    path: string;
    label: string;
    roles: Role[];
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
    {
        path: NAVIGATION_PATHS.DASHBOARD,
        label: 'Dashboard',
        roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE],
    },
    {
        path: NAVIGATION_PATHS.EMPLOYEES,
        label: 'Employees',
        roles: [Role.ADMIN, Role.HR, Role.MANAGER],
    },
    {
        path: NAVIGATION_PATHS.ATTENDANCE_LOG,
        label: 'Attendance Log',
        roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE],
    },
    {
        path: NAVIGATION_PATHS.TEAM_ATTENDANCE,
        label: 'Team Attendance',
        roles: [Role.MANAGER, Role.ADMIN, Role.HR, Role.EMPLOYEE],
    },
];