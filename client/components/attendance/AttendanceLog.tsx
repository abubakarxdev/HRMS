import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { api } from '../../services/apiService';
import { AttendanceRecord } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

const AttendanceLog: React.FC = () => {
    const { user } = useAppContext();
    const [logs, setLogs] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Date Filters
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
    });
    const [endDate, setEndDate] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }));

    const fetchLogs = async () => {
        if (!user?.employeeId) return;
        setLoading(true);
        try {
            const data = await api.getAttendanceForEmployee(user.employeeId);
            
            // Filter by date range
            const filtered = data.filter(record => {
                // Handle date comparison robustly using PKT
                const recordDate = new Date(record.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
                return recordDate >= startDate && recordDate <= endDate;
            });
            
            // Sort by date desc
            filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setLogs(filtered);
        } catch (error) {
            console.error("Failed to fetch attendance logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [user?.employeeId]);

    const handleApplyFilters = () => {
        fetchLogs();
    };

    const handleReset = () => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        setStartDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }));
        setEndDate(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }));
        setTimeout(fetchLogs, 0); 
    };

    const calculateTotalHours = (record: AttendanceRecord) => {
        if (record.totalHours) return record.totalHours;
        return 0;
    };

    const formatDuration = (hours: number) => {
        if (hours < 0) return "0h 0m"; // Prevent negative display
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    };
    
    const totalFilteredHours = logs.reduce((acc, record) => acc + (record.totalHours || 0), 0);

    const getSessionTimes = (record: AttendanceRecord) => {
        if (!record.sessions || record.sessions.length === 0) return { checkIn: null, checkOut: null };
        
        // Sort sessions by time just in case
        const sortedSessions = [...record.sessions].sort((a, b) => 
            new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
        );
        
        const firstSession = sortedSessions[0];
        const lastSession = sortedSessions[sortedSessions.length - 1];
        
        return {
            checkIn: firstSession.checkIn,
            checkOut: lastSession.checkOut
        };
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Attendance Log</h2>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                        <Input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                        <Input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleApplyFilters} className="bg-indigo-600 text-white hover:bg-indigo-700">
                            Apply Filters
                        </Button>
                        <Button variant="outline" onClick={handleReset}>
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Check In</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Check Out</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Break</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Worked</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-slate-500">Loading logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-slate-500">No logs found for the selected period.</td>
                                </tr>
                            ) : (
                                logs.map((record) => {
                                    const { checkIn, checkOut } = getSessionTimes(record);
                                    const location = record.sessions?.[0]?.location || '-';
                                    const breakDuration = record.breakHours ? formatDuration(record.breakHours) : '-';
                                    
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Karachi' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    record.status === 'Present' ? 'bg-green-100 text-green-800' :
                                                    record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                                                    record.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-slate-100 text-slate-800'
                                                }`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {checkIn ? new Date(checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {checkOut ? new Date(checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {breakDuration}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {location}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {formatDuration(record.totalHours || 0)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50">
                            <tr>
                                <td colSpan={6} className="px-6 py-3 text-right text-sm font-medium text-slate-900">Total Hours (Filtered):</td>
                                <td className="px-6 py-3 text-left text-sm font-bold text-indigo-600">{formatDuration(totalFilteredHours)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceLog;
