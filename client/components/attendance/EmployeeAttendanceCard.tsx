import React, { useState, useEffect, useMemo } from 'react';
import { Employee, AttendanceRecord } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

interface EmployeeAttendanceCardProps {
  employee: Employee;
  todayRecord?: AttendanceRecord;
}

const formatHoursMinutes = (decimalHours: number): string => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
};

const EmployeeAttendanceCard: React.FC<EmployeeAttendanceCardProps> = ({ employee, todayRecord }) => {
  const { user, attendance } = useAppContext();
  const [workedHours, setWorkedHours] = useState({ today: 0, week: 0, month: 0 });

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    const calculateAllHours = () => {
        const now = new Date();
        // Enforce Asia/Karachi timezone
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });

        let liveHoursToday = 0;
        if (todayRecord) {
            // Use totalHours from backend if available (for closed records) or calculate from sessions
            if (todayRecord.totalHours) {
                liveHoursToday = todayRecord.totalHours;
            }
            
            // If there are sessions, calculate live time for open sessions
            if (todayRecord.sessions) {
                let sessionHours = 0;
                todayRecord.sessions.forEach(session => {
                    if (session.type !== 'WORK') return; // Only count WORK sessions
                    
                    if (session.checkOut) {
                        const start = new Date(session.checkIn).getTime();
                        const end = new Date(session.checkOut).getTime();
                        sessionHours += (end - start) / (1000 * 60 * 60);
                    } else {
                        // Open session
                        const start = new Date(session.checkIn).getTime();
                        const end = now.getTime();
                        sessionHours += (end - start) / (1000 * 60 * 60);
                    }
                });
                // Use calculated session hours if it's more accurate (e.g. live update)
                liveHoursToday = sessionHours;
            } else {
                 // Fallback or no data
                 liveHoursToday = 0;
            }
        }

        const startOfWeek = new Date(now);
        startOfWeek.setHours(0,0,0,0);
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const pastRecords = attendance.filter(r => {
            if (String(r.employeeId) !== String(employee.id)) return false;
            
            // Convert record date to Asia/Karachi to check if it's "today"
            const recordDatePKT = new Date(r.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
            return recordDatePKT !== todayStr;
        });

        const completedHoursWeek = pastRecords
            .filter(r => new Date(r.date + 'T00:00:00') >= startOfWeek)
            .reduce((acc, r) => acc + (r.totalHours || 0), 0);
            
        const completedHoursMonth = pastRecords
            .filter(r => new Date(r.date + 'T00:00:00') >= startOfMonth)
            .reduce((acc, r) => acc + (r.totalHours || 0), 0);
        
        setWorkedHours({
            today: liveHoursToday,
            week: completedHoursWeek + liveHoursToday,
            month: completedHoursMonth + liveHoursToday,
        });
    };

    calculateAllHours();

    const isClockedIn = todayRecord?.sessions?.some(s => !s.checkOut);

    if (isClockedIn) {
        const interval = setInterval(calculateAllHours, 60000);
        return () => clearInterval(interval);
    }
  }, [attendance, todayRecord, employee.id]);

  const getStatus = (): { text: string; color: string } => {
    if (todayRecord?.status === 'On Leave') {
        return { text: 'On Leave', color: 'text-yellow-600' };
    }
    
    // Check for open session
    const openSession = todayRecord?.sessions?.find(s => !s.checkOut);
    if (openSession) {
        if (openSession.type === 'BREAK') {
            return { text: 'On Break', color: 'text-orange-600' };
        }
        return { text: 'Present', color: 'text-green-600' };
    }
    
    if (todayRecord?.sessions?.length > 0 && todayRecord.sessions.every(s => s.checkOut)) {
        return { text: 'Checked Out', color: 'text-blue-600' };
    }
    
    return { text: 'Absent', color: 'text-red-600' };
  };

  const { text: statusText, color: statusColor } = getStatus();
  const isCurrentUser = user.employeeId === employee.id;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-base text-slate-800 truncate">{employee.name}</p>
                <p className="text-xs text-slate-500 truncate">{employee.position}</p>
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