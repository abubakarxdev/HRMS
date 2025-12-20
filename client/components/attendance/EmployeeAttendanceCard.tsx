import React, { useState, useEffect, useMemo } from 'react';
import { User, Clock, AlertCircle, CheckCircle, BarChart3, Briefcase } from 'lucide-react';
import { Employee, AttendanceRecord } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface EmployeeAttendanceCardProps {
    employee: Employee;
    todayRecord?: AttendanceRecord;
    stats?: { weekMinutes: number; monthMinutes: number };
}

const EmployeeAttendanceCard: React.FC<EmployeeAttendanceCardProps> = ({ employee, todayRecord, stats }) => {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every minute to keep stats fresh
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Helper to format duration
    const formatDuration = (minutes: number) => {
        if (!minutes || minutes < 0) return '0h 0m';
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return `${h}h ${m}m`;
    };

    // Calculate Real-time Stats
    const { todayTotal, weekTotal, monthTotal, isWorking, statusText, statusColor } = useMemo(() => {
        let currentStatus = 'Absent';
        let color = 'bg-slate-100 text-slate-500 border-slate-200';
        let working = false;

        // Base minutes from backend
        let todayMins = todayRecord?.totalWorkMinutes || 0;
        let weekMins = stats?.weekMinutes || 0;
        let monthMins = stats?.monthMinutes || 0;

        // Calculate live duration if active
        if (todayRecord) {
            if (todayRecord.status === 'ON_LEAVE') {
                currentStatus = 'On Leave';
                color = 'bg-amber-100 text-amber-700 border-amber-200';
            } else if (todayRecord.sessions?.some((s: any) => !s.checkOutTime)) {
                // Active Session found
                const activeSession = todayRecord.sessions.find((s: any) => !s.checkOutTime);
                
                // Check if on break
                const activeBreak = activeSession.breaks?.find((b: any) => !b.endTime);

                if (activeBreak) {
                    currentStatus = 'On Break';
                    color = 'bg-orange-100 text-orange-700 border-orange-200';
                } else {
                    currentStatus = 'Working';
                    color = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                    working = true;

                    // Add live duration
                    const checkIn = new Date(activeSession.checkInTime).getTime();
                    const now = currentTime.getTime();
                    const durationMs = Math.max(0, now - checkIn);
                    
                    // Subtract completed breaks in this session
                    const breakDurationMs = activeSession.breaks?.reduce((acc: number, b: any) => {
                        if (b.endTime) {
                            return acc + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime());
                        }
                        return acc;
                    }, 0) || 0;
                    
                    const liveMinutes = Math.floor((durationMs - breakDurationMs) / 1000 / 60);
                    
                    // Add to totals (Assuming backend stats don't include current open session duration yet, 
                    // which is typical for "closed" intervals, but we add it to make it "Real-time")
                    // Note: If backend already includes it, we might double count. 
                    // Usually backend aggregations only sum stored values. 
                    // Open sessions usually have 0 duration stored until closed or updated.
                    todayMins += liveMinutes;
                    weekMins += liveMinutes;
                    monthMins += liveMinutes;
                }
            } else if (todayRecord.sessions?.length > 0) {
                currentStatus = 'Checked Out';
                color = 'bg-blue-50 text-blue-700 border-blue-200';
            }
        }

        return {
            todayTotal: todayMins,
            weekTotal: weekMins,
            monthTotal: monthMins,
            isWorking: working,
            statusText: currentStatus,
            statusColor: color
        };
    }, [todayRecord, stats, currentTime]);

    // Calculate Targets
    const TARGET_WEEKLY_MINUTES = 40 * 60;
    const TARGET_MONTHLY_MINUTES = 160 * 60;

    const weekProgress = Math.min(100, (weekTotal / TARGET_WEEKLY_MINUTES) * 100);
    const monthProgress = Math.min(100, (monthTotal / TARGET_MONTHLY_MINUTES) * 100);
    
    const weekRemaining = Math.max(0, TARGET_WEEKLY_MINUTES - weekTotal);
    const monthRemaining = Math.max(0, TARGET_MONTHLY_MINUTES - monthTotal);

    const employeeName = employee.firstName ? `${employee.firstName} ${employee.lastName}` : (employee.name || 'Unknown');
    const employeePosition = employee.position || employee.user?.role || 'Employee';
    const isCurrentUser = user?.employeeId === employee.id;

    return (
        <div className={`group bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative flex flex-col h-full ${isCurrentUser ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200'}`}>
             {/* Decorative Top Border */}
            <div className={`h-1 w-full absolute top-0 left-0 ${statusText === 'Working' ? 'bg-emerald-500' : statusText === 'On Break' ? 'bg-orange-400' : 'bg-slate-200'}`} />

            <div className="p-4 flex flex-col h-full justify-between">
                {/* Header: Avatar, Name, Position */}
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm border border-slate-200">
                                {employee.firstName?.[0]}{employee.lastName?.[0]}
                            </div>
                            {isCurrentUser && (
                                <span className="absolute -top-1 -right-3 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">YOU</span>
                            )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-bold border ${statusColor} flex items-center gap-1`}>
                            {isWorking && <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>}
                            {statusText}
                        </span>
                    </div>
                    
                    <div className="mb-4">
                        <h3 className="font-bold text-slate-800 text-sm truncate" title={employeeName}>
                            {employeeName}
                        </h3>
                        <div className="flex items-center text-xs text-slate-500 mt-0.5 truncate" title={employeePosition}>
                            {employeePosition}
                        </div>
                    </div>
                </div>

                {/* Real-time Stats Grid (My Hours Style) */}
                <div className="bg-slate-50/80 rounded-lg p-3 mb-4 border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-medium uppercase">Today</span>
                        <span className="text-xs font-mono font-bold text-slate-700">{formatDuration(todayTotal)}</span>
                    </div>
                    <div className="w-full h-px bg-slate-200" />
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-medium uppercase">This Week</span>
                        <span className="text-xs font-mono font-bold text-slate-700">{formatDuration(weekTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-medium uppercase">This Month</span>
                        <span className="text-xs font-mono font-bold text-slate-700">{formatDuration(monthTotal)}</span>
                    </div>
                </div>

                {/* Target Progress Bars */}
                <div className="space-y-3 mt-auto">
                     {/* Weekly */}
                    <div>
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-400 font-medium">Weekly Goal</span>
                            <span className={`font-medium ${weekRemaining === 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                {weekRemaining > 0 ? `${Math.round(weekProgress)}%` : 'Met'}
                            </span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${weekRemaining === 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${weekProgress}%` }} 
                            />
                        </div>
                    </div>

                    {/* Monthly */}
                     <div>
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-400 font-medium">Monthly Goal</span>
                             <span className={`font-medium ${monthRemaining === 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                {monthRemaining > 0 ? `${Math.round(monthProgress)}%` : 'Met'}
                            </span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${monthRemaining === 0 ? 'bg-emerald-500' : 'bg-purple-500'}`}
                                style={{ width: `${monthProgress}%` }} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeAttendanceCard;