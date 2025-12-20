import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTodayAttendance, useAttendanceStats } from '../../hooks/useAttendance';
import { useEmployee } from '../../hooks/useEmployees';
import { FiClock, FiTarget, FiCalendar, FiActivity } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const formatHoursMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
};

const AttendanceSummaryCard: React.FC = () => {
    const { user } = useAuth();
    const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
    
    // Fetch Data
    const { data: todayRecord } = useTodayAttendance(user?.employeeId || '', today);
    const { data: stats } = useAttendanceStats(user?.employeeId || '');
    const { data: employee } = useEmployee(user?.employeeId || '');

    // Live minutes tracking
    const [liveMinutes, setLiveMinutes] = useState({ today: 0, week: 0, month: 0 });

    useEffect(() => {
        if (!stats) return;
        
        const calculateLiveMinutes = () => {
            let todayMinutes = 0;
            
            if (todayRecord?.sessions) {
                const now = new Date().getTime();
                
                todayRecord.sessions.forEach((session: any) => {
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
                        breakMinutes = session.breaks.reduce((acc: number, b: any) => {
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
                // Fallback to stats if no sessions loaded yet
                todayMinutes = stats.minutesToday;
            }
            
            setLiveMinutes({
                today: Math.max(0, todayMinutes),
                week: Math.max(0, (stats.minutesThisWeek || 0) - (stats.minutesToday || 0) + todayMinutes),
                month: Math.max(0, (stats.minutesThisMonth || 0) - (stats.minutesToday || 0) + todayMinutes),
            });
        };

        calculateLiveMinutes();

        const isClockedIn = todayRecord?.sessions?.some((s: any) => !s.checkOutTime);
        if (isClockedIn) {
            const interval = setInterval(calculateLiveMinutes, 60000);
            return () => clearInterval(interval);
        }
    }, [stats, todayRecord]);


    if (!user) return null;

    // Targets
    const TARGET_WEEKLY_MINUTES = 40 * 60; // 40 hours
    const TARGET_MONTHLY_MINUTES = 160 * 60; // 160 hours

    // Data for Donut Chart (Week)
    const weeklyProgress = Math.min(100, (liveMinutes.week / TARGET_WEEKLY_MINUTES) * 100);
    const weeklyRemaining = Math.max(0, 100 - weeklyProgress);
    const weeklyData = [
        { name: 'Week Done', value: weeklyProgress, color: '#6366f1' }, // Indigo-500
        { name: 'Remaining', value: weeklyRemaining, color: '#e2e8f0' }, // Slate-200
    ];

    // Data for Donut Chart (Month)
    const monthProgress = Math.min(100, (liveMinutes.month / TARGET_MONTHLY_MINUTES) * 100);
    const monthRemaining = Math.max(0, 100 - monthProgress);
    const monthlyData = [
        { name: 'Month Done', value: monthProgress, color: '#a855f7' }, // Purple-500
        { name: 'Remaining', value: monthRemaining, color: '#e2e8f0' }, // Slate-200
    ];
    
    // Calculate display values in Hours
    const weekHoursCurrent = (liveMinutes.week / 60).toFixed(1);
    const monthHoursCurrent = (liveMinutes.month / 60).toFixed(1);

    const firstName = employee?.firstName || user?.firstName || 'User';
    const lastName = employee?.lastName || user?.lastName || '';
    const fullName = `${firstName} ${lastName}`;
    
    // Determine Position: Employee > Contract > Role
    let position = employee?.position;
    if (!position && employee?.contracts && employee.contracts.length > 0) {
        // Assume the first contract is active/latest
        position = employee.contracts[0].position; 
    }
    if (!position) {
        position = user?.role || 'Employee';
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden relative group hover:shadow-xl transition-all duration-300">
             {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 -ml-12 -mb-12 pointer-events-none"></div>

            <div className="p-6 relative z-10 flex flex-col h-full">
                {/* User Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-3 items-center">
                        <div className="relative">
                             <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                                {firstName[0]}{lastName[0]}
                            </div>
                            <span className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            </span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 leading-tight">{fullName}</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide opacity-80">{position}</p>
                        </div>
                    </div>
                     <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border border-indigo-100">
                        YOU/STATS
                    </span>
                </div>

                {/* Today's Stats (Full Width) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500">
                        <FiClock className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-semibold uppercase tracking-wide">Today's Hours</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800 tabular-nums">
                        {formatHoursMinutes(liveMinutes.today)}
                    </div>
                </div>

                {/* Dual Charts Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    
                    {/* Weekly Chart */}
                    <div className="relative flex flex-col items-center">
                        <div className="h-28 w-28 relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={weeklyData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={45}
                                        startAngle={90}
                                        endAngle={-270}
                                        paddingAngle={0}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {weeklyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-lg font-bold text-indigo-600 leading-none">
                                    {weeklyProgress.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2">Week</span>
                    </div>

                    {/* Monthly Chart */}
                    <div className="relative flex flex-col items-center">
                        <div className="h-28 w-28 relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={monthlyData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={45}
                                        startAngle={90}
                                        endAngle={-270}
                                        paddingAngle={0}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {monthlyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-lg font-bold text-purple-600 leading-none">
                                    {monthProgress.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                         <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2">Month</span>
                    </div>

                </div>

                {/* Footer: Dual Linear Progress */}
                <div className="space-y-4">
                     
                     {/* Weekly Linear */}
                     <div>
                         <div className="flex justify-between items-end mb-1.5">
                            <div className="flex items-center gap-1.5">
                                <FiTarget className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Weekly Goal</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-700">{weekHoursCurrent}h</span>
                                <span className="text-[10px] text-slate-400">/ 40h</span>
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${weeklyProgress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Monthly Linear */}
                    <div>
                         <div className="flex justify-between items-end mb-1.5">
                             <div className="flex items-center gap-1.5">
                                <FiCalendar className="w-3.5 h-3.5 text-purple-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Monthly Goal</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-700">{monthHoursCurrent}h</span>
                                <span className="text-[10px] text-slate-400">/ 160h</span>
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-purple-500 h-full rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${monthProgress}%` }}
                            ></div>
                        </div>
                    </div>

                </div>
                
            </div>
        </div>
    );
};

export default AttendanceSummaryCard;
