import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, UserMinus, FileClock, Clock, Sparkles } from "lucide-react";
import { useOffice } from "@/contexts/OfficeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEmployeeAttendance, useAttendanceRecords } from "../../hooks/useAttendance";
import { useAllLeaveRequests } from "../../hooks/useLeaves"; // Added for pending requests
import Button from "../../components/ui/Button";
import { apiClient as api } from "../../api/client";
import AttendanceCard from "../../components/attendance/AttendanceCard";
import AttendanceSummaryCard from "../../components/attendance/AttendanceSummaryCard";
import ApprovalsPanel from "../../components/dashboard/ApprovalsPanel";
import MissedClockOutAlert from "../../components/dashboard/MissedClockOutAlert";
import ResolveMissingClockOutModal from "../../components/attendance/ResolveMissingClockOutModal";
import dayjs from "dayjs";

const AdminDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { currentOffice, offices, isLoading: isOfficeLoading } = useOffice();
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const navigate = useNavigate();

    // Fetch stats for the current office
    const { data: employees = [] } = useQuery({
        queryKey: ["employees", currentOffice?.id],
        enabled: !!currentOffice,
        queryFn: async () => {
            if (!currentOffice) return [];
            const response = await api.get(`/employees?officeId=${currentOffice.id}`);
            return response.data;
        },

    });

    const today = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
    
    // Fetch attendance stats for today
    const { data: attendanceData } = useAttendanceRecords(
        1, 
        1, // Minimal limit, we just need aggregates
        today, 
        today, 
        undefined, 
        currentOffice?.id
    );

    const stats = (attendanceData?.aggregates || {
        totalPresent: 0,
        totalOnLeave: 0,
        totalLate: 0,
        totalAbsent: 0
    }) as any;

    // Fetch pending approvals count (Matches HR Dashboard)
    // Fetch pending approvals count (Matches ApprovalsPanel & HR Dashboard)
    // We increment limit to 5 to match the ApprovalsPanel query, allowing them to share the same cache and data.
    const { data: pendingLeavesResponse } = useAllLeaveRequests(1, 5, 'Pending', undefined, currentOffice?.id);
    const pendingApprovalsCount = pendingLeavesResponse?.meta?.total || 0;

    // Fetch user's history for missed checkouts (Admin is also an employee)
    const { data: userHistoryResponse } = useEmployeeAttendance(user?.employeeId || '', undefined, undefined, undefined, 1, 50);
    const userHistory = userHistoryResponse?.data || [];

    const recordToFix = useMemo(() => {
        const today = dayjs().format('YYYY-MM-DD');
        const userAttendance = userHistory
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return userAttendance.find((a: any) => 
            a.sessions?.some((s: any) => !s.checkOutTime) && dayjs(a.date).format('YYYY-MM-DD') !== today
        );
    }, [userHistory]);

    if (isOfficeLoading) return <div>Loading dashboard context...</div>;

    if (!currentOffice) {
        if (offices.length === 0) {
             return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                    <div className="p-6 bg-indigo-50 rounded-full mb-6 animate-bounce-slow">
                        <Users className="w-12 h-12 text-indigo-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to your Dashboard!</h1>
                    <p className="text-slate-500 max-w-md mb-8 text-lg">
                        It looks like you haven't set up any offices yet. Let's get started by creating your first office location to manage your team.
                    </p>
                    <Button 
                        onClick={() => navigate('/admin/offices')}
                        className="py-3 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
                    >
                        Create First Office
                    </Button>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="p-4 bg-slate-100 rounded-full mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">No Office Selected</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                    Please select an office from the top picker to view its dashboard and manage operations.
                </p>
            </div>
        );
    }

    const displayName = user?.firstName || user?.email.split('@')[0];

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
                             <span className="font-medium text-blue-100 tracking-wide uppercase text-xs">Admin Overview</span>
                         </div>
                         <h1 className="text-3xl font-bold mb-2">Hi, {displayName} 👋</h1>
                         <p className="text-blue-100/80 max-w-xl text-lg">
                             Here's what's happening at <span className="font-semibold text-white">{currentOffice.name}</span> today.
                         </p>
                     </div>
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

                {/* Checked In (Matches HR) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <UserCheck className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">Checked In</h3>
                        <p className="text-3xl font-bold text-slate-800">{stats.totalPresent || 0}</p>
                    </div>
                </div>

                {/* On Leave (Matches HR) */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <UserMinus className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">On Leave</h3>
                        <p className="text-3xl font-bold text-slate-800">{stats.totalOnLeave || 0}</p>
                    </div>
                </div>

                {/* Pending Approvals (Matches HR - Replaces Late) */}
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

            {/* Attendance & Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AttendanceSummaryCard />
                <AttendanceCard />
            </div>

            {/* Approvals Panel */}
            <div className="w-full">
                <ApprovalsPanel />
            </div>

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

export default AdminDashboardPage;
