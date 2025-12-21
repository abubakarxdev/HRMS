import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import NotificationBell from '../notifications/NotificationBell';

const formatRole = (role: string) => {
    switch (role) {
        case 'ADMIN': return 'Admin';
        case 'HR': return 'HR';
        case 'FINANCE': return 'Finance';
        case 'EMPLOYEE': return 'Employee';
        default: return role;
    }
}

const getPageTitle = (pathname: string): string => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/employees')) return 'Employees';
    if (pathname.startsWith('/attendance')) return 'Attendance';
    if (pathname.startsWith('/admin/leaves')) return 'Leave Requests';
    if (pathname.startsWith('/leaves')) return 'Leaves';
    return 'Dashboard';
};

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    
    if (!user) {
        return null;
    }

    const pageTitle = getPageTitle(location.pathname);
    
    // Generate avatar URL with fallback
    const getAvatarUrl = () => {
        // Fallback to placeholder with user's initials
        const name = (user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.email) || 'User';
            
        const initials = name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        return `https://placehold.co/100x100/4F46E5/FFFFFF?text=${initials}`;
    };

    const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email;

    return (
        <header className="flex items-center justify-between h-20 px-6 bg-white border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
            <div className="flex items-center space-x-6">
                <div className="flex items-center">
                    <NotificationBell />
                </div>
                <div className="h-8 border-l border-slate-200"></div>
                <div className="flex items-center">
                    <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={getAvatarUrl()}
                        alt="User Avatar"
                    />
                    <div className="ml-3">
                        <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                        <p className="text-xs text-slate-500">{formatRole(user.role)}</p>
                    </div>
                </div>
                <div className="h-10 border-l border-slate-200"></div>
                <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
            </div>
        </header>
    );
};

export default Header;