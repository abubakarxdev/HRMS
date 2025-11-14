

import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import Button from '../ui/Button';

const Header: React.FC = () => {
    const { view, user, employees, logout } = useAppContext();
    
    if (!user) {
        return null;
    }

    const currentUserEmployee = employees.find(e => e.id === user.employeeId);

    return (
        <header className="flex items-center justify-between h-20 px-6 bg-white border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800">{view}</h1>
            <div className="flex items-center space-x-4">
                <div className="flex items-center">
                    <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={currentUserEmployee?.avatar}
                        alt="User Avatar"
                    />
                    <div className="ml-3">
                        <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.role}</p>
                    </div>
                </div>
                <div className="h-10 border-l border-slate-200"></div>
                <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
            </div>
        </header>
    );
};

export default Header;
