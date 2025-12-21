import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useAttendanceRecords, useEmployeeAttendance } from '@/hooks/useAttendance';
import { useAllLeaveRequests } from '@/hooks/useLeaves';
import ApprovalsPanel from '@/components/dashboard/ApprovalsPanel';
import AttendanceCard from '@/components/attendance/AttendanceCard';
import AttendanceSummaryCard from '@/components/attendance/AttendanceSummaryCard';
import ManageHolidaysModal from '@/components/admin/ManageHolidaysModal';
import MissedClockOutAlert from '@/components/dashboard/MissedClockOutAlert';
import ResolveMissingClockOutModal from '@/components/attendance/ResolveMissingClockOutModal';
import EmployeeDashboardPage from '../employees/EmployeeDashboardPage';
import FourSquare from '@/components/ui/FourSquare';
import { Users, UserCheck, UserMinus, FileClock, Calendar, Sparkles } from 'lucide-react';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    // Route to EmployeeDashboard for regular employees
    if (user.role === 'EMPLOYEE') {
        return <EmployeeDashboardPage />;
    }

    // Manager/HR Dashboard (original content)
    return <ManagerDashboard />;
};

const ManagerDashboard: React.FC = () => {
    const { user } = useAuth();
    const { data: employees = [], isLoading: employeesLoading } = useEmployees();
    
    // 1. Fetch today's records for stats (all employees)
    const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: user.timezone || 'Asia/Karachi' });
    const { data: todayResponse, isLoading: attendanceLoading } = useAttendanceRecords(1, 1000, todayLocal, todayLocal);
    const attendance = todayResponse?.data || [];

    // 2. Fetch user's recent history for missing checkout check
    const { data: userHistoryResponse } = useEmployeeAttendance(user?.employeeId || '', undefined, undefined, undefined, 1, 50);
    const userHistory = userHistoryResponse?.data || [];
    
    // 3. Fetch pending approvals count
    const { data: pendingLeavesResponse } = useAllLeaveRequests(1, 1, 'Pending');
    const pendingApprovalsCount = pendingLeavesResponse?.meta?.total || 0;

    const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

    if (!user) return null;

    const recordToFix = useMemo(() => {
        const today = dayjs().format('YYYY-MM-DD');
        // Use userHistory for finding missing checkouts
        const userAttendance = userHistory
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Find records with active sessions (no checkOut) that are not from today
        return userAttendance.find(a => 
            a.sessions?.some(s => !s.checkOutTime) && dayjs(a.date).format('YYYY-MM-DD') !== today
        );
    }, [userHistory, user.employeeId]);

    const todayAttendanceStats = useMemo(() => {
        const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: user.timezone || 'Asia/Karachi' });
        
        const todayRecords = attendance.filter(r => {
             if (new Date(r.date).toLocaleDateString('en-CA', { timeZone: user.timezone || 'Asia/Karachi' }) === todayLocal) return true;
             if (r.sessions?.some(s => new Date(s.checkInTime).toLocaleDateString('en-CA', { timeZone: user.timezone || 'Asia/Karachi' }) === todayLocal)) return true;
             return false;
        });
        
        const checkedIn = todayRecords.filter(a => a.sessions?.some(s => !s.checkOutTime)).length;
        const onLeave = todayRecords.filter(a => a.status === 'ON_LEAVE').length;
        
        return { checkedIn, onLeave };
    }, [attendance, user.timezone]);

    const isPrivilegedUser = user.role === 'ADMIN' || user.role === 'HR';

    // Show loading state
    if (employeesLoading || attendanceLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <FourSquare />
            </div>
        );
    }

    const displayName = user.firstName || user.email.split('@')[0];

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {recordToFix && (
                <MissedClockOutAlert 
                    record={recordToFix}
                    onResolve={() => setIsResolveModalOpen(true)}
                />
            )}
            
            {/* HERO SECTION */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
                 {/* Decorative Blobs */}
                 <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl"></div>
                 
                 <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                     <div>
                         <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                 <Sparkles className="w-5 h-5 text-yellow-300" />
                             </div>
                             <span className="font-medium text-blue-100 tracking-wide uppercase text-xs">Overview</span>
                         </div>
                         <h1 className="text-3xl font-bold mb-2">Welcome back, {displayName}!</h1>
                         <p className="text-blue-100/80 max-w-xl text-lg">
                             Here's what's happening across your organization today.
                         </p>
                     </div>
                     
                     {user.role === 'ADMIN' && (
                         <button 
                             onClick={() => setIsHolidaysModalOpen(true)}
                             className="group flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-xl transition-all shadow-lg hover:shadow-xl"
                         >
                             <Calendar className="w-5 h-5 text-blue-200 group-hover:text-white transition-colors" />
                             <span className="font-semibold text-sm">Manage Holidays</span>
                         </button>
                     )}
                 </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Total Employees */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">Total Employees</h3>
                        <p className="text-3xl font-bold text-slate-800">{employees.length}</p>
                    </div>
                </div>

                {/* Checked In */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <UserCheck className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">Checked In</h3>
                        <p className="text-3xl font-bold text-slate-800">{todayAttendanceStats.checkedIn}</p>
                    </div>
                </div>

                {/* On Leave */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <UserMinus className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">On Leave</h3>
                        <p className="text-3xl font-bold text-slate-800">{todayAttendanceStats.onLeave}</p>
                    </div>
                </div>

                {/* Pending Approvals */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                            <FileClock className="w-6 h-6" />
                        </div>
                        {pendingApprovalsCount > 0 && (
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </span>
                        )}
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">Pending Requests</h3>
                        <p className="text-3xl font-bold text-slate-800">{pendingApprovalsCount}</p>
                    </div>
                </div>

            </div>

            {/* Attendance Section - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AttendanceSummaryCard />
                <AttendanceCard />
            </div>

            {/* Approvals Section - Full Width Below */}
            {isPrivilegedUser && (
                <div className="w-full">
                    <ApprovalsPanel />
                </div>
            )}
            
            <ManageHolidaysModal 
                isOpen={isHolidaysModalOpen}
                onClose={() => setIsHolidaysModalOpen(false)}
            />
            {recordToFix && isResolveModalOpen && (
                <ResolveMissingClockOutModal
                    isOpen={isResolveModalOpen}
                    onClose={() => setIsResolveModalOpen(false)}
                    record={recordToFix}
                />
            )}
        </div>
    );
};

export default DashboardPage;