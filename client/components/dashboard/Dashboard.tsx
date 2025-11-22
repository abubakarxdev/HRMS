
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import StatCard from './StatCard';

import ApprovalsPanel from './ApprovalsPanel';
import AttendanceCard from '../attendance/AttendanceCard';
import AttendanceSummaryCard from '../attendance/AttendanceSummaryCard';
import ManageHolidaysModal from '../admin/ManageHolidaysModal';
import Button from '../ui/Button';
import { Role } from '../../types';
import MissedClockOutAlert from './MissedClockOutAlert';
import ResolveMissingClockOutModal from '../attendance/ResolveMissingClockOutModal';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard: React.FC = () => {
    const { user } = useAppContext();

    // Route to EmployeeDashboard for regular employees
    if (user.role === Role.EMPLOYEE) {
        return <EmployeeDashboard />;
    }

    // Manager/HR Dashboard (original content)
    return <ManagerDashboard />;
};

const ManagerDashboard: React.FC = () => {
    const { employees, attendance, approvals, user, holidays } = useAppContext();
    const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

    const recordToFix = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const userAttendance = attendance
            .filter(a => a.employeeId === user.employeeId)
            .sort((a, b) => b.date.localeCompare(a.date));
        
        return userAttendance.find(a => a.clockIn && !a.clockOut && a.date !== today);
    }, [attendance, user.employeeId]);

    const targetHoursThisMonth = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const holidayDates = holidays.map(h => h.date);

        let workdays = 0;
        const date = new Date(year, month, 1);
        while (date.getMonth() === month) {
            const dayOfWeek = date.getDay();
            const dateString = date.toISOString().split('T')[0];
            if (dayOfWeek > 0 && dayOfWeek < 6 && !holidayDates.includes(dateString)) {
                workdays++;
            }
            date.setDate(date.getDate() + 1);
        }
        return workdays * 8;
    }, [holidays]);

    const todayAttendanceStats = useMemo(() => {
        const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
        
        const todayRecords = attendance.filter(r => {
             if (new Date(r.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }) === todayLocal) return true;
             if (r.sessions?.some(s => new Date(s.checkIn).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }) === todayLocal)) return true;
             return false;
        });
        
        const checkedIn = todayRecords.filter(a => a.sessions?.some(s => !s.checkOut)).length;
        const onLeave = todayRecords.filter(a => a.status === 'On Leave').length;
        
        return { checkedIn, onLeave };
    }, [attendance]);

    const isPrivilegedUser = user.role === Role.ADMIN_HR || user.role === Role.MANAGER;

    return (
        <div className="space-y-8">
            {recordToFix && (
                <MissedClockOutAlert 
                    record={recordToFix}
                    onResolve={() => setIsResolveModalOpen(true)}
                />
            )}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-700">Welcome back, {user.name.split(' ')[0]}!</h2>
                {user.role === Role.ADMIN_HR && (
                    <Button onClick={() => setIsHolidaysModalOpen(true)}>Manage Holidays</Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Employees" value={employees.length} />
                <StatCard title="Checked In Today" value={todayAttendanceStats.checkedIn} />
                <StatCard title="On Leave Today" value={todayAttendanceStats.onLeave} />
                <StatCard title="Pending Approvals" value={approvals.filter(a => a.status === 'Pending').length} />
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