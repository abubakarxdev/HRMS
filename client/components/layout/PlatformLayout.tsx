import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { NAVIGATION_PATHS } from "../../constants";
import { Building2, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";

const PlatformSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      path: "/platform",
      label: "Platform Overview",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      path: "/platform/tenants",
      label: "Tenants",
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      path: "/platform/admins",
      label: "Global Admins",
      icon: <Users className="w-5 h-5" />,
    },
    {
      path: "/platform/settings",
      label: "System Settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="flex items-center h-16 px-6 border-b border-slate-800">
        <div className="bg-indigo-500 p-1.5 rounded mr-3">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-bold tracking-tight">HRIS Platform</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = item.path === '/platform' 
            ? location.pathname === item.path
            : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className={`${isActive ? "text-indigo-200" : "text-slate-500 group-hover:text-slate-300"} mr-3`}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

const PlatformLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <PlatformSidebar />
      <div className="pl-64">
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 px-8 flex items-center justify-between">
           <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Super Admin Console</h2>
           <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                      SA
                  </div>
                  <div className="text-sm">
                      <p className="font-medium text-slate-700">Super Admin</p>
                  </div>
              </div>
           </div>
        </header>
        <main className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PlatformLayout;
