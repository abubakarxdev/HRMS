import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { api } from '../../services/apiService';
import { AttendanceRecord } from '../../types';

const formatHoursMinutes = (decimalHours: number): string => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
};

const AttendanceSummaryCard: React.FC = () => {
    const { user, attendance } = useAppContext();
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
    const [workedHours, setWorkedHours] = useState({ today: 0, week: 0, month: 0 });
    
    const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

    const fetchData = async () => {
        if (!user?.employeeId) return;
        try {
            const todayData = await api.getTodayAttendanceForEmployee(user.employeeId, today);
            setTodayRecord(todayData);
        } catch (error) {
            console.error("Failed to fetch attendance data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.employeeId, today]);

    useEffect(() => {
        if (!user) return;
        
        const calculateAllHours = () => {
            const now = new Date();
            const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });

            let liveHoursToday = 0;
            if (todayRecord) {
                if (todayRecord.totalHours) {
                    liveHoursToday = todayRecord.totalHours;
                }
                
                if (todayRecord.sessions) {
                    let sessionHours = 0;
                    todayRecord.sessions.forEach(session => {
                        if (session.type !== 'WORK') return;
                        
                        if (session.checkOut) {
                            const start = new Date(session.checkIn).getTime();
                            const end = new Date(session.checkOut).getTime();
                            const diff = Math.max(0, end - start);
                            sessionHours += diff / (1000 * 60 * 60);
                        } else {
                            const start = new Date(session.checkIn).getTime();
                            const end = now.getTime();
                            const diff = Math.max(0, end - start);
                            sessionHours += diff / (1000 * 60 * 60);
                        }
                    });
                    liveHoursToday = sessionHours;
                }
            }

            const startOfWeek = new Date(now);
            startOfWeek.setHours(0,0,0,0);
            startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Filter past records - use numeric employeeId from todayRecord if available
            const userNumericId = todayRecord?.employeeId;
            const pastRecords = attendance.filter(r => {
                // Compare numeric IDs
                if (userNumericId && r.employeeId !== userNumericId) return false;
                if (!userNumericId && String(r.employeeId) !== String(user.employeeId)) return false;
                
                const recordDatePKT = new Date(r.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
                return recordDatePKT !== todayStr;
            });

            const completedHoursWeek = pastRecords
                .filter(r => {
                    const recordDate = new Date(r.date);
                    return recordDate >= startOfWeek;
                })
                .reduce((acc, r) => acc + Math.max(0, r.totalHours || 0), 0);
                
            const completedHoursMonth = pastRecords
                .filter(r => {
                    const recordDate = new Date(r.date);
                    return recordDate >= startOfMonth;
                })
                .reduce((acc, r) => acc + Math.max(0, r.totalHours || 0), 0);
            
            console.log('[AttendanceSummaryCard] Detailed Debug:', {
                todayStr,
                userNumericId,
                liveHoursToday,
                allAttendanceRecords: attendance.map(r => ({ 
                    employeeId: r.employeeId, 
                    date: r.date, 
                    totalHours: r.totalHours,
                    datePKT: new Date(r.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })
                })),
                pastRecordsCount: pastRecords.length,
                pastRecords: pastRecords.map(r => ({ date: r.date, totalHours: r.totalHours })),
                startOfWeek: startOfWeek.toISOString(),
                startOfMonth: startOfMonth.toISOString(),
                completedHoursWeek,
                completedHoursMonth,
                finalCalculation: {
                    today: Math.max(0, liveHoursToday),
                    week: completedHoursWeek + Math.max(0, liveHoursToday),
                    month: completedHoursMonth + Math.max(0, liveHoursToday)
                }
            });
            
            setWorkedHours({
                today: Math.max(0, liveHoursToday),
                week: completedHoursWeek + Math.max(0, liveHoursToday),
                month: completedHoursMonth + Math.max(0, liveHoursToday),
            });
        };

        calculateAllHours();

        const isClockedIn = todayRecord?.sessions?.some(s => !s.checkOut);
        if (isClockedIn) {
            const interval = setInterval(calculateAllHours, 60000);
            return () => clearInterval(interval);
        }
    }, [attendance, todayRecord, user]);

    if (!user) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">My Hours Summary</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Logged Today</span>
                        <span className="text-sm font-bold text-slate-900">{formatHoursMinutes(Math.max(0, workedHours.today))}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (workedHours.today / 8) * 100)}%` }}></div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <span className="text-sm text-slate-500">Logged This Week</span>
                        <span className="text-sm font-bold text-slate-900">{formatHoursMinutes(Math.max(0, workedHours.week))}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (workedHours.week / 40) * 100)}%` }}></div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <span className="text-sm text-slate-500">Logged This Month</span>
                        <span className="text-sm font-bold text-slate-900">{formatHoursMinutes(Math.max(0, workedHours.month))}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, (workedHours.month / 160) * 100)}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceSummaryCard;
