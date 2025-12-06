
import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { useEmployees } from '../../hooks/useEmployees';
import { useAttendanceRecords, useEmployeeAttendance } from '../../hooks/useAttendance';
import StatCard from './StatCard';
import ApprovalsPanel from './ApprovalsPanel';
import AttendanceCard from '../attendance/AttendanceCard';
import AttendanceSummaryCard from '../attendance/AttendanceSummaryCard';
import ManageHolidaysModal from '../admin/ManageHolidaysModal';
import Button from '../ui/Button';
import MissedClockOutAlert from './MissedClockOutAlert';
import ResolveMissingClockOutModal from '../attendance/ResolveMissingClockOutModal';
import EmployeeDashboard from './EmployeeDashboard';
import FourSquare from '../ui/FourSquare';

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    // Route to EmployeeDashboard for regular employees
    if (user.role === 'EMPLOYEE') {
        return <EmployeeDashboard />;
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
        <div className="space-y-8">
            {recordToFix && (
                <MissedClockOutAlert 
                    record={recordToFix}
                    onResolve={() => setIsResolveModalOpen(true)}
                />
            )}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-700">Welcome back, {displayName}!</h2>
                {user.role === 'ADMIN' && (
                    <Button onClick={() => setIsHolidaysModalOpen(true)}>Manage Holidays</Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Employees" value={employees.length} />
                <StatCard title="Checked In Today" value={todayAttendanceStats.checkedIn} />
                <StatCard title="On Leave Today" value={todayAttendanceStats.onLeave} />
                <StatCard title="Pending Approvals" value={0} />
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

export default Dashboard;