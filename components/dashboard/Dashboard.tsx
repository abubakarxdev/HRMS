
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import StatCard from './StatCard';
import AttendanceWidget from './AttendanceWidget';
import ApprovalsPanel from './ApprovalsPanel';
import MyHoursSummaryCard from './MyHoursSummaryCard';
import ManageHolidaysModal from '../admin/ManageHolidaysModal';
import Button from '../ui/Button';
import { Role } from '../../types';
import MissedClockOutAlert from './MissedClockOutAlert';
import ResolveMissingClockOutModal from '../attendance/ResolveMissingClockOutModal';

const Dashboard: React.FC = () => {
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
                <StatCard title="On Leave Today" value={attendance.filter(a => a.status === 'On Leave' && a.date === new Date().toISOString().split('T')[0]).length} />
                <StatCard title="Pending Approvals" value={approvals.filter(a => a.status === 'Pending').length} />
                <StatCard title="Target Hours This Month" value={`${targetHoursThisMonth} hrs`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <MyHoursSummaryCard />
                    <AttendanceWidget />
                </div>
                {isPrivilegedUser && (
                    <div className="lg:col-span-2">
                        <ApprovalsPanel />
                    </div>
                )}
            </div>
            
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