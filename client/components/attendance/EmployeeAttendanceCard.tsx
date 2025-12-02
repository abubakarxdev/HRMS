import React, { useState, useEffect, useMemo } from 'react';
import { Employee, AttendanceRecord } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendanceRecords } from '../../hooks/useAttendance';

interface EmployeeAttendanceCardProps {
  employee: Employee;
  todayRecord?: AttendanceRecord;
}

const formatHoursMinutes = (decimalHours: number): string => {
    if (decimalHours < 0) return "0h 0m";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
};

const EmployeeAttendanceCard: React.FC<EmployeeAttendanceCardProps> = ({ employee, todayRecord }) => {
  const { user } = useAuth();
  const { data: attendance = [] } = useAttendanceRecords();
  const [workedHours, setWorkedHours] = useState({ today: 0, week: 0, month: 0 });

  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  useEffect(() => {
    const calculateAllHours = () => {
        const now = new Date();
        const userTimezone = user?.timezone || 'Asia/Karachi';
        // Use user's timezone for "today" check
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: userTimezone });

        let liveHoursToday = 0;
        if (todayRecord) {
            // Use totalWorkMinutes from backend if available (converted to hours)
            if (todayRecord.totalWorkMinutes) {
                liveHoursToday = todayRecord.totalWorkMinutes / 60;
            }
            
            // If there are sessions, calculate live time for open sessions
            if (todayRecord.sessions) {
                let sessionHours = 0;
                todayRecord.sessions.forEach(session => {
                    // All sessions are WORK sessions now
                    
                    if (session.checkOutTime) {
                        const start = new Date(session.checkInTime).getTime();
                        const end = new Date(session.checkOutTime).getTime();
                        const diff = Math.max(0, end - start);
                        sessionHours += diff / (1000 * 60 * 60);
                    } else {
                        // Open session
                        const start = new Date(session.checkInTime).getTime();
                        const end = now.getTime();
                        const diff = Math.max(0, end - start);
                        sessionHours += diff / (1000 * 60 * 60);
                    }
                });
                // Use calculated session hours if it's more accurate (e.g. live update)
                // However, backend totalWorkMinutes might exclude breaks correctly.
                // For open sessions, we need to add the current duration.
                // But let's stick to session calculation for "live" feel if open.
                const hasOpenSession = todayRecord.sessions.some(s => !s.checkOutTime);
                if (hasOpenSession) {
                    liveHoursToday = sessionHours;
                }
            }
        }

        // Calculate start of week/month in User's Timezone
        // This is tricky in JS without a library like date-fns-tz, but we can approximate
        // or rely on the backend stats. 
        // Ideally, this component should just receive stats from the parent or a hook, 
        // rather than calculating them itself, to avoid logic duplication and timezone bugs.
        // But for now, let's fix the filtering.

        const pastRecords = attendance.filter(r => {
            if (String(r.employeeId) !== String(employee.id)) return false;
            
            // Convert record date to User's Timezone to check if it's "today"
            const recordDateUser = new Date(r.date).toLocaleDateString('en-CA', { timeZone: userTimezone });
            return recordDateUser !== todayStr;
        });

        // Simple approximation for week/month start (local time) - this might still be slightly off
        // if the browser timezone differs from user timezone, but it's better than hardcoded Karachi.
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0,0,0,0);
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const completedHoursWeek = pastRecords
            .filter(r => {
                const recordDate = new Date(r.date);
                return recordDate >= startOfWeek;
            })
            .reduce((acc, r) => acc + Math.max(0, (r.totalWorkMinutes || 0) / 60), 0);
            
        const completedHoursMonth = pastRecords
            .filter(r => {
                const recordDate = new Date(r.date);
                return recordDate >= startOfMonth;
            })
            .reduce((acc, r) => acc + Math.max(0, (r.totalWorkMinutes || 0) / 60), 0);
        
        setWorkedHours({
            today: Math.max(0, liveHoursToday),
            week: completedHoursWeek + Math.max(0, liveHoursToday),
            month: completedHoursMonth + Math.max(0, liveHoursToday),
        });
    };

    calculateAllHours();

    const isClockedIn = todayRecord?.sessions?.some(s => !s.checkOutTime);

    if (isClockedIn) {
        const interval = setInterval(calculateAllHours, 60000);
        return () => clearInterval(interval);
    }
  }, [attendance, todayRecord, employee.id]);

  const getStatus = (): { text: string; color: string } => {
    if (todayRecord?.status === 'ON_LEAVE') {
        return { text: 'On Leave', color: 'text-yellow-600' };
    }
    
    // Check for open session
    const openSession = todayRecord?.sessions?.find(s => !s.checkOutTime);
    if (openSession) {
        // Check if on break (break without endTime)
        const onBreak = openSession.breaks?.some(b => !b.endTime);
        if (onBreak) {
            return { text: 'On Break', color: 'text-orange-600' };
        }
        return { text: 'Present', color: 'text-green-600' };
    }
    
    if (todayRecord?.sessions && todayRecord.sessions.length > 0 && todayRecord.sessions.every(s => s.checkOutTime)) {
        return { text: 'Checked Out', color: 'text-blue-600' };
    }
    
    return { text: 'Absent', color: 'text-red-600' };
  };

  const { text: statusText, color: statusColor } = getStatus();
  const isCurrentUser = user?.employeeId === employee.id;
  const employeeName = employee.firstName ? `${employee.firstName} ${employee.lastName}` : (employee.name || 'Unknown');
  const employeeRole = employee.user?.role || employee.position || 'Employee';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-base text-slate-800 truncate">{employeeName}</p>
                <p className="text-xs text-slate-500 truncate">{employeeRole}</p>
            </div>
            {isCurrentUser && (
                <span className="text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">You</span>
            )}
        </div>

        <p className={`font-bold mt-3 text-lg ${statusColor}`}>{statusText}</p>
        <div className="text-xs text-slate-600 mt-1 font-mono">
          {statusText === 'Absent' && <p className="pt-1">No events today</p>}
          {statusText === 'On Leave' && <p className="pt-1">Scheduled leave</p>}
          {statusText === 'Present' && <p>Checked in</p>}
          {statusText === 'On Break' && <p>Currently on break</p>}
          {statusText === 'Checked Out' && <p>Checked out</p>}
        </div>

        <div className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200 space-y-1">
            <div className="flex justify-between items-center">
                <span>Today</span>
                <span className="font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded">{formatHoursMinutes(workedHours.today)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span>This Week</span>
                <span className="font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded">{formatHoursMinutes(workedHours.week)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span>This Month</span>
                <span className="font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded">{formatHoursMinutes(workedHours.month)}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendanceCard;