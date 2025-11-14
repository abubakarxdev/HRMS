
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { ROLES } from '../../constants';
import { Role } from '../../types';

const Header: React.FC = () => {
    const { view, user, setUserRole, employees } = useAppContext();
    const currentUserEmployee = employees.find(e => e.id === user.employeeId);

    return (
        <header className="flex items-center justify-between h-20 px-6 bg-white border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800">{view}</h1>
            <div className="flex items-center space-x-4">
                <div>
                    <label htmlFor="role-switcher" className="text-sm font-medium text-slate-600 mr-2">Switch Role:</label>
                    <select
                        id="role-switcher"
                        value={user.role}
                        onChange={(e) => setUserRole(e.target.value as Role)}
                        className="p-2 border rounded-md bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
                <div className="h-10 border-l border-slate-200"></div>
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
            </div>
        </header>
    );
};

export default Header;
