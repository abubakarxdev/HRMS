import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import EmployeeAttendanceCard from './EmployeeAttendanceCard';
import Button from '../ui/Button';
import { Role, AttendanceRecord } from '../../types';
import { api } from '../../services/apiService';

const TeamSnapshot: React.FC = () => {
    const { employees, user } = useAppContext();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchTodayAttendance = async () => {
            try {
                const allRecords = await api.getAllAttendance();
                const today = new Date().toISOString().split('T')[0];
                const todaysRecords = allRecords.filter(r => new Date(r.date).toISOString().split('T')[0] === today);
                setTodayAttendance(todaysRecords);
            } catch (error) {
                console.error("Failed to fetch team attendance", error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchTodayAttendance();
    }, []);

    const attendanceByEmployee = useMemo(() => {
        const map = new Map();
        todayAttendance.forEach(a => map.set(a.employeeId, a));
        return map;
    }, [todayAttendance]);

    const getEmployeeStatus = (employeeId: string): string => {
        const record = attendanceByEmployee.get(employeeId);
        
        if (!record) return 'absent';
        if (record.status === 'On Leave') return 'on-leave';
        
        const openSession = record.sessions?.find(s => !s.checkOut);
        if (openSession) {
            if (openSession.type === 'BREAK') return 'on-break';
            return 'present';
        }
        
        if (record.sessions?.length > 0 && record.sessions.every(s => s.checkOut)) {
            return 'checked-out';
        }
        
        return 'absent';
    };

    const isPrivilegedUser = user.role === Role.ADMIN_HR || user.role === Role.MANAGER;
    const subtitle = isPrivilegedUser 
        ? "View and manage team attendance for the current day." 
        : "View your team's attendance status for today.";

    const filteredEmployees = useMemo(() => {
        if (statusFilter === 'all') return employees;
        
        return employees.filter(emp => {
            const status = getEmployeeStatus(emp.id);
            return status === statusFilter;
        });
    }, [employees, statusFilter, attendanceByEmployee]);

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200 gap-4">
                <div className="flex-grow">
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-xl font-bold text-slate-800">Team Dashboard &mdash; Today</h1>
                        <span className="font-bold text-xl text-slate-800 font-mono hidden md:inline">
                            {currentTime.toLocaleTimeString('en-US', { timeZone: user?.timezone || 'Asia/Karachi' })}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">({user?.timezone || 'Asia/Karachi'})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-500">{subtitle}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                            Work Day
                        </span>
                    </div>
                </div>
                {isPrivilegedUser && (
                    <div className="flex items-center space-x-2">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="p-2 border rounded-md bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Employees</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="checked-out">Checked Out</option>
                            <option value="on-break">On Break</option>
                            <option value="on-leave">On Leave</option>
                        </select>
                        <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
                    </div>
                )}
            </header>

            {(loadingData && employees.length === 0) ? (
                <div className="text-center p-8 text-slate-500">Loading team data...</div>
            ) : (
                <>
                    <div className="text-sm text-slate-600">
                        Showing {filteredEmployees.length} of {employees.length} employees
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {filteredEmployees.map(employee => (
                            <EmployeeAttendanceCard
                                key={employee.id}
                                employee={employee}
                                todayRecord={attendanceByEmployee.get(employee.id)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default TeamSnapshot;