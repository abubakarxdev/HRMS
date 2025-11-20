import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import EmployeeAttendanceCard from './EmployeeAttendanceCard';
import Button from '../ui/Button';
import { Role } from '../../types';

const TeamSnapshot: React.FC = () => {
    const { employees, attendance, loading, user } = useAppContext();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const today = new Date().toISOString().split('T')[0];

    const attendanceByEmployee = useMemo(() => {
        const map = new Map();
        attendance
            .filter(a => a.date === today)
            .forEach(a => map.set(a.employeeId, a));
        return map;
    }, [attendance, today]);

    const isPrivilegedUser = user.role === Role.ADMIN_HR || user.role === Role.MANAGER;
    const subtitle = isPrivilegedUser 
        ? "View and manage team attendance for the current day." 
        : "View your team's attendance status for today.";

    const filteredEmployees = employees;

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200 gap-4">
                <div className="flex-grow">
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-xl font-bold text-slate-800">Team Snapshot &mdash; Today</h1>
                        <span className="font-bold text-xl text-slate-800 font-mono hidden md:inline">
                            {currentTime.toLocaleTimeString('en-US')}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                </div>
                {isPrivilegedUser && (
                    <div className="flex items-center space-x-2">
                        <select className="p-2 border rounded-md bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option>Team: All</option>
                        </select>
                        <Button variant="outline">Reset Data</Button>
                    </div>
                )}
            </header>

            {(loading && employees.length === 0) ? (
                <div className="text-center p-8 text-slate-500">Loading team data...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {filteredEmployees.map(employee => (
                        <EmployeeAttendanceCard
                            key={employee.id}
                            employee={employee}
                            todayRecord={attendanceByEmployee.get(employee.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeamSnapshot;