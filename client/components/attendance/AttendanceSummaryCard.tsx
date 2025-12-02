import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTodayAttendance, useAttendanceStats } from '../../hooks/useAttendance';
import { FiClock, FiCalendar, FiTrendingUp, FiActivity } from 'react-icons/fi';

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
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden relative group hover:shadow-xl transition-all duration-300">
             {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 -ml-12 -mb-12 pointer-events-none"></div>

            <div className="p-6 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
                        <FiActivity size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">My Hours Summary</h3>
                        <p className="text-xs text-slate-500 font-medium">Real-time tracking</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Today */}
                    <div className="group/item">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-2 text-slate-500 mb-0.5">
                                <FiClock size={14} className="text-indigo-400" />
                                <span className="text-sm font-semibold tracking-wide">Today</span>
                            </div>
                            <span className="text-xl font-bold text-slate-800 tabular-nums leading-none">
                                {formatHoursMinutes(liveMinutes.today)}
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out group-hover/item:shadow-[0_0_10px_rgba(99,102,241,0.4)]" 
                                style={{ width: `${Math.min(100, (liveMinutes.today / 480) * 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Week */}
                    <div className="group/item">
                        <div className="flex justify-between items-end mb-2">
                             <div className="flex items-center gap-2 text-slate-500 mb-0.5">
                                <FiCalendar size={14} className="text-blue-400" />
                                <span className="text-sm font-semibold tracking-wide">This Week</span>
                            </div>
                            <span className="text-xl font-bold text-slate-800 tabular-nums leading-none">
                                {formatHoursMinutes(liveMinutes.week)}
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-1000 ease-out group-hover/item:shadow-[0_0_10px_rgba(59,130,246,0.4)]" 
                                style={{ width: `${Math.min(100, (liveMinutes.week / 2400) * 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Month */}
                    <div className="group/item">
                        <div className="flex justify-between items-end mb-2">
                             <div className="flex items-center gap-2 text-slate-500 mb-0.5">
                                <FiTrendingUp size={14} className="text-purple-400" />
                                <span className="text-sm font-semibold tracking-wide">This Month</span>
                            </div>
                            <span className="text-xl font-bold text-slate-800 tabular-nums leading-none">
                                {formatHoursMinutes(liveMinutes.month)}
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out group-hover/item:shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
                                style={{ width: `${Math.min(100, (liveMinutes.month / 9600) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceSummaryCard;
