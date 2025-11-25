import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import Button from '../ui/Button';
import { Role } from '../../types';

const formatRole = (role: Role) => {
    switch (role) {
        case Role.ADMIN_HR: return 'Admin HR';
        case Role.MANAGER: return 'Manager';
        case Role.EMPLOYEE: return 'Employee';
        default: return role;
    }
}

const Header: React.FC = () => {
    const { view, user, employees, logout } = useAppContext();
    
    if (!user) {
        return null;
    }

    const currentUserEmployee = employees.find(e => e.employeeId === user.employeeId);
    
    // Generate avatar URL with fallback
    const getAvatarUrl = () => {
        if (currentUserEmployee?.avatar) {
            return currentUserEmployee.avatar;
        }
        // Fallback to placeholder with user's initials
        const initials = user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        return `https://placehold.co/100x100/4F46E5/FFFFFF?text=${initials}`;
    };

    return (
        <header className="flex items-center justify-between h-20 px-6 bg-white border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800">{view}</h1>
            <div className="flex items-center space-x-4">
                <div className="flex items-center">
                    <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={getAvatarUrl()}
                        alt="User Avatar"
                        onError={(e) => {
                            // Fallback if image fails to load
                            const initials = user.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2);
                            e.currentTarget.src = `https://placehold.co/100x100/4F46E5/FFFFFF?text=${initials}`;
                        }}
                    />
                    <div className="ml-3">
                        <p className="text-sm font-semibold text-slate-800">{user.name}</p>
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