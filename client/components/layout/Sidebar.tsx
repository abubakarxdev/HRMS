import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { NAVIGATION_ITEMS } from '../../constants';
import { View } from '../../types';

const LogoIcon = () => (
    <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        <path d="M19.34 10.34C20.37 11.2 21 12.53 21 14v2h2v-2c0-2.21-1.26-4.14-3.11-5.14l-1.55 1.48zM4.66 10.34l-1.55-1.48C1.26 9.86 0 11.79 0 14v2h2v-2c0-1.47.63-2.8 1.66-3.66z"/>
    </svg>
);

// FIX: Replaced `JSX.Element` with `React.ReactElement` to resolve namespace error.
const NavItem: React.FC<{ view: View, label: string, icon: React.ReactElement, isActive: boolean }> = ({ view, label, icon, isActive }) => {
    const { setView } = useAppContext();
    return (
        <button
            onClick={() => setView(view)}
            className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors ${
                isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-indigo-100 hover:bg-primary-700 hover:text-white'
            }`}
        >
            {icon}
            <span className="ml-4 font-medium">{label}</span>
        </button>
    );
};

const Sidebar: React.FC = () => {
    const { view, user } = useAppContext();

    if (!user) {
        return null;
    }

    // FIX: Replaced `JSX.Element` with `React.ReactElement` to resolve namespace error.
    const icons: { [key in View]: React.ReactElement } = {
        [View.DASHBOARD]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
        [View.EMPLOYEES]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-3M15 21a3 3 0 01-3-3V15" /></svg>,
        [View.PROFILE]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
        [View.ATTENDANCE]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
        [View.TEAM_ATTENDANCE]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    };

    return (
        <div className="w-64 bg-primary-600 text-white flex-col hidden md:flex">
            <div className="flex items-center justify-center h-20 border-b border-primary-700">
                <LogoIcon />
                <h1 className="text-2xl font-bold ml-2">HRIS Pro</h1>
            </div>
            <nav className="flex-1 p-4">
                {NAVIGATION_ITEMS.filter(item => item.roles.includes(user.role)).map(item => (
                    <NavItem key={item.view} view={item.view} label={item.label} icon={icons[item.view]} isActive={view === item.view} />
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;