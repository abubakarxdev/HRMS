import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, Clock, Calendar, TrendingUp } from "lucide-react";
import { useOffice } from "../../context/OfficeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEmployeeAttendance, useAttendanceRecords } from "../../hooks/useAttendance";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { apiClient as api } from "../../api/client";
import AttendanceCard from "../../components/attendance/AttendanceCard";
import AttendanceSummaryCard from "../../components/attendance/AttendanceSummaryCard";
import ApprovalsPanel from "../../components/dashboard/ApprovalsPanel";
import MissedClockOutAlert from "../../components/dashboard/MissedClockOutAlert";
import ResolveMissingClockOutModal from "../../components/attendance/ResolveMissingClockOutModal";
import dayjs from "dayjs";

// Enhanced Stat Card Component for Admin
const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    color: "indigo" | "emerald" | "amber" | "rose";
}> = ({ title, value, icon, trend, color }) => {
    const colorClasses = {
        indigo: "bg-indigo-50 text-indigo-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        rose: "bg-rose-50 text-rose-600",
    };

    return (
        <Card className="p-6 border-0 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                    <span className="text-emerald-600 font-medium">{trend}</span>
                    <span className="text-slate-400 ml-1">vs last month</span>
                </div>
            )}
        </Card>
    );
};

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

    const stats = attendanceData?.aggregates || {
        totalPresent: 0,
        totalOnLeave: 0,
        totalLate: 0,
        totalAbsent: 0
    };

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
        <div className="space-y-8">
            {recordToFix && (
                <MissedClockOutAlert 
                    record={recordToFix}
                    onResolve={() => setIsResolveModalOpen(true)}
                />
            )}

            <div>
                <h1 className="text-2xl font-bold text-slate-800">Hi, {displayName} 👋</h1>
                <p className="text-slate-500 mt-1">
                    Here's what's happening at <span className="font-semibold text-indigo-600">{currentOffice.name}</span> today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Employees" 
                    value={employees.length} 
                    icon={<Users className="w-6 h-6" />}
                    trend="+12%"
                    color="indigo"
                />
                <StatCard 
                    title="Present Today" 
                    value={stats.totalPresent || 0} 
                    icon={<Clock className="w-6 h-6" />}
                    color="emerald"
                />
                 <StatCard 
                    title="On Leave" 
                    value={stats.totalOnLeave || 0} 
                    icon={<Calendar className="w-6 h-6" />}
                    color="amber"
                />
                 <StatCard 
                    title="Late Arrivals" 
                    value={stats.totalLate || 0} 
                    icon={<Clock className="w-6 h-6" />}
                    color="rose"
                />
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
