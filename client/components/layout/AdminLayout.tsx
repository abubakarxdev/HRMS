import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { OfficeProvider, useOffice } from "@/contexts/OfficeContext";
import { Building2, ChevronDown } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

// Component for the Office Switcher Dropdown
const OfficeSwitcher: React.FC = () => {
    const { currentOffice, setCurrentOffice, offices, isLoading } = useOffice();
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isLoading) return <div className="text-sm text-slate-500">Loading offices...</div>;

    if (offices.length === 0) return <div className="text-sm text-slate-500">No offices found</div>;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-4 py-2.5 bg-white border rounded-xl shadow-sm transition-all duration-200 w-72 justify-between group ${
                    isOpen ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-1 bg-indigo-100 rounded text-indigo-600">
                        <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 truncate">
                        {currentOffice?.name || "Select Office"}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl ring-1 ring-black/5 border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Switch Office</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {offices.map((office) => (
                            <button
                                key={office.id}
                                onClick={() => {
                                    setCurrentOffice(office);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                                    currentOffice?.id === office.id ? "bg-indigo-50 border-l-4 border-indigo-500" : "border-l-4 border-transparent"
                                }`}
                            >
                                <Building2 className={`w-5 h-5 ${currentOffice?.id === office.id ? "text-indigo-600" : "text-slate-400"}`} />
                                <div>
                                    <p className={`text-sm font-medium ${currentOffice?.id === office.id ? "text-indigo-900" : "text-slate-700"}`}>
                                        {office.name}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">
                                        ID: {office.id.slice(0, 8)}...
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminLayout: React.FC = () => {
    return (
        <OfficeProvider>
            <div className="flex h-screen bg-slate-50">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 shrink-0 relative z-20">
                        <div className="flex items-center gap-6">
                            {/* Office Switcher - Only visible for Admins */}
                            <OfficeSwitcher />
                        </div>
                        
                        <div className="flex items-center gap-4">
                           {/* We render a simplified version of Header content or reuse logic */}
                           <HeaderContent /> 
                        </div>
                    </header>

                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 relative z-10">
                        <Outlet />
                    </main>
                </div>
            </div>
        </OfficeProvider>
    );
};

// Reusing Header logic by creating a wrapper that doesn't render the <header> tag itself
// or we just modify Header.tsx to be flexible. 
// For now, let's just use Header but we need to accept that it renders a <header> tag.
// If we want perfection, we should refactor Header.tsx to export `HeaderContent` separately.
// Let's do a quick hack: Just put Header in the layout top right?
// No, layout structure matters.

// Let's refactor Header.tsx slightly in the next step to allow custom content injection or export content.
// For now, I will define a local HeaderContent that mimics Header.tsx behavior for Admin Layout.

import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import Button from "../ui/Button";

const HeaderContent: React.FC = () => {
    const { user, logout } = useAuth();
    if (!user) return null;

    const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email;

    const getAvatarUrl = () => {
        const name = displayName || 'User';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return `https://placehold.co/100x100/4F46E5/FFFFFF?text=${initials}`;
    };

    const formatRole = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'Company Admin';
            case 'SUPER_ADMIN': return 'Platform Owner';
            default: return role;
        }
    };

    return (
        <div className="flex items-center space-x-6">
            <div className="flex items-center">
                <NotificationBell />
            </div>
            <div className="h-8 border-l border-slate-200"></div>
             <div className="flex items-center">
                <img
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-50"
                    src={getAvatarUrl()}
                    alt="User Avatar"
                />
                <div className="ml-3 hidden md:block">
                    <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                    <p className="text-xs text-slate-500">{formatRole(user.role)}</p>
                </div>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 hover:text-red-600">
                Sign Out
            </Button>
        </div>
    );
};

export default AdminLayout;
