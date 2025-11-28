import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTodayAttendance, useAttendanceStats } from '../../hooks/useAttendance';

const formatHoursMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
};

const AttendanceSummaryCard: React.FC = () => {
    const { user } = useAuth();
    const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
    const { data: todayRecord } = useTodayAttendance(user?.employeeId || '', today);
    const { data: stats } = useAttendanceStats(user?.employeeId || '');
    
    const [liveMinutes, setLiveMinutes] = useState({ today: 0, week: 0, month: 0 });

    useEffect(() => {
        if (!stats) return;
        
        const calculateLiveMinutes = () => {
            let todayMinutes = 0;
            
            if (todayRecord?.sessions) {
                const now = new Date().getTime();
                
                todayRecord.sessions.forEach(session => {
                    if (!session.checkInTime) return;
                    
                    const start = new Date(session.checkInTime).getTime();
                    // Use checkOutTime if available, otherwise use now (for active session)
                    const end = session.checkOutTime 
                        ? new Date(session.checkOutTime).getTime() 
                        : now;
                        
                    const grossDuration = Math.floor((end - start) / (1000 * 60));
                    
                    // Calculate breaks
                    let breakMinutes = 0;
                    if (session.breaks && session.breaks.length > 0) {
                        breakMinutes = session.breaks.reduce((acc, b) => {
                            if (!b.startTime) return acc;
                            
                            const breakStart = new Date(b.startTime).getTime();
                            const breakEnd = b.endTime 
                                ? new Date(b.endTime).getTime() 
                                : now;
                                
                            // Cap break end at session end
                            const effectiveBreakEnd = Math.min(breakEnd, end);
                            
                            // Only count if break started before session ended
                            if (breakStart < effectiveBreakEnd) {
                                return acc + Math.floor((effectiveBreakEnd - breakStart) / (1000 * 60));
                            }
                            return acc;
                        }, 0);
                    }
                    
                    todayMinutes += Math.max(0, grossDuration - breakMinutes);
                });
            } else if (stats?.minutesToday) {
                // Fallback to stats if no sessions loaded yet (though todayRecord should have them)
                todayMinutes = stats.minutesToday;
            }
            
            setLiveMinutes({
                today: Math.max(0, todayMinutes),
                week: Math.max(0, (stats.minutesThisWeek || 0) - (stats.minutesToday || 0) + todayMinutes),
                month: Math.max(0, (stats.minutesThisMonth || 0) - (stats.minutesToday || 0) + todayMinutes),
            });
        };

        calculateLiveMinutes();

        const isClockedIn = todayRecord?.sessions?.some(s => !s.checkOutTime);
        if (isClockedIn) {
            const interval = setInterval(calculateLiveMinutes, 60000);
            return () => clearInterval(interval);
        }
    }, [stats, todayRecord]);

    if (!user) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">My Hours Summary</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Logged Today</span>
                        <span className="text-sm font-bold text-slate-900">{formatHoursMinutes(liveMinutes.today)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (liveMinutes.today / 480) * 100)}%` }}></div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <span className="text-sm text-slate-500">Logged This Week</span>
                        <span className="text-sm font-bold text-slate-900">{formatHoursMinutes(liveMinutes.week)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (liveMinutes.week / 2400) * 100)}%` }}></div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <span className="text-sm text-slate-500">Logged This Month</span>
                        <span className="text-sm font-bold text-slate-900">{formatHoursMinutes(liveMinutes.month)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, (liveMinutes.month / 9600) * 100)}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceSummaryCard;
