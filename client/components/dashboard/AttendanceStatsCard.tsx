import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { api } from '../../services/apiService';
import { AttendanceRecord } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend);

const AttendanceStatsCard: React.FC = () => {
    const { employees } = useAppContext();
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTodayAttendance = async () => {
            try {
                const allRecords = await api.getAllAttendance();
                // Get today's date in Asia/Karachi time YYYY-MM-DD
                const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
                
                const todaysRecords = allRecords.filter(r => {
                    // Check if record date is today (Asia/Karachi)
                    if (new Date(r.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }) === todayLocal) return true;
                    
                    // Check if any session is today (Asia/Karachi)
                    if (r.sessions?.some(s => new Date(s.checkIn).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }) === todayLocal)) return true;
                    
                    return false;
                });
                setTodayAttendance(todaysRecords);
            } catch (error) {
                console.error("Failed to fetch attendance", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTodayAttendance();
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchTodayAttendance, 30000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const attendanceByEmployee = new Map();
        todayAttendance.forEach(a => attendanceByEmployee.set(a.employeeId, a));

        let present = 0;
        let absent = 0;
        let checkedOut = 0;
        let onBreak = 0;
        let onLeave = 0;

        employees.forEach(emp => {
            const record = attendanceByEmployee.get(emp.id);
            
            if (!record) {
                absent++;
                return;
            }
            
            if (record.status === 'On Leave') {
                onLeave++;
                return;
            }
            
            const openSession = record.sessions?.find(s => !s.checkOut);
            if (openSession) {
                if (openSession.type === 'BREAK') {
                    onBreak++;
                } else {
                    present++;
                }
                return;
            }
            
            if (record.sessions?.length > 0 && record.sessions.every(s => s.checkOut)) {
                checkedOut++;
                return;
            }
            
            absent++;
        });

        return { present, absent, checkedOut, onBreak, onLeave };
    }, [todayAttendance, employees]);

    const chartData = {
        labels: ['Present', 'Absent', 'Checked Out', 'On Break', 'On Leave'],
        datasets: [
            {
                data: [stats.present, stats.absent, stats.checkedOut, stats.onBreak, stats.onLeave],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',   // Green - Present
                    'rgba(239, 68, 68, 0.8)',   // Red - Absent
                    'rgba(59, 130, 246, 0.8)',  // Blue - Checked Out
                    'rgba(251, 146, 60, 0.8)',  // Orange - On Break
                    'rgba(234, 179, 8, 0.8)',   // Yellow - On Leave
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(251, 146, 60, 1)',
                    'rgba(234, 179, 8, 1)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 15,
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = employees.length;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Real-Time Attendance</h3>
                <div className="flex items-center justify-center h-64">
                    <p className="text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Real-Time Attendance</h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Total: {employees.length}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="flex items-center justify-center" style={{ height: '280px' }}>
                    <Doughnut data={chartData} options={chartOptions} />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 content-center">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-700">{stats.present}</p>
                        <p className="text-xs text-green-600 mt-1">Present</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
                        <p className="text-xs text-red-600 mt-1">Absent</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-700">{stats.checkedOut}</p>
                        <p className="text-xs text-blue-600 mt-1">Checked Out</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-orange-700">{stats.onBreak}</p>
                        <p className="text-xs text-orange-600 mt-1">On Break</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center col-span-2">
                        <p className="text-2xl font-bold text-yellow-700">{stats.onLeave}</p>
                        <p className="text-xs text-yellow-600 mt-1">On Leave</p>
                    </div>
                </div>
            </div>

            <div className="mt-4 text-xs text-slate-500 text-center">
                Auto-refreshes every 30 seconds
            </div>
        </div>
    );
};

export default AttendanceStatsCard;
