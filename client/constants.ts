import { Role } from './types';


export const NAVIGATION_PATHS = {
    DASHBOARD: '/',
    EMPLOYEES: '/employees',
    ATTENDANCE: '/attendance',
    ATTENDANCE_LOG: '/attendance/log',
    TEAM_ATTENDANCE: '/attendance/team',
    LEAVES: '/leaves',
    LEAVE_REQUESTS: '/admin/leaves',
    OFFICES: '/admin/offices',
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
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR, Role.EMPLOYEE],
    },
    {
        path: NAVIGATION_PATHS.EMPLOYEES,
        label: 'Employees',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR],
    },
    {
        path: NAVIGATION_PATHS.ATTENDANCE_LOG,
        label: 'Attendance Log',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR, Role.EMPLOYEE],
    },
    {
        path: NAVIGATION_PATHS.TEAM_ATTENDANCE,
        label: 'Team Attendance',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR, Role.EMPLOYEE],
    },
    {
        path: NAVIGATION_PATHS.LEAVES,
        label: 'Leaves',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR, Role.EMPLOYEE],
    },
    {
        path: NAVIGATION_PATHS.LEAVE_REQUESTS,
        label: 'Leave Requests',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR],
    },
    {
        path: NAVIGATION_PATHS.OFFICES,
        label: 'Offices',
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
    },
];