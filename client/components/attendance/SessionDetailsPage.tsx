import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiCoffee, FiMapPin, FiCalendar, FiUser, FiActivity } from 'react-icons/fi';
import { api } from '../../services/apiService';
import { AttendanceRecord } from '../../types';
import Button from '../ui/Button';
import FourSquare from '../ui/FourSquare';
import { useAuth } from '../../contexts/AuthContext';

const SessionDetailsPage: React.FC = () => {
    const { user } = useAuth();
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [record, setRecord] = useState<AttendanceRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSessionDetails = async () => {
            if (!sessionId) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const data = await api.getAttendanceById(sessionId);
                console.log('Fetched session data:', data);
                setRecord(data);
            } catch (err: any) {
                console.error('Failed to fetch session details:', err);
                const errorMessage = err?.message || 'Failed to load session details. Please try again.';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchSessionDetails();
    }, [sessionId]);

    const formatDuration = (hours: number) => {
        if (hours < 0) return "0h 0m";
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    };

    const formatTime = (dateString: string | Date | null | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: user?.timezone || 'Asia/Karachi'
        });
    };

    const calculateSessionDuration = (checkIn: string, checkOut: string | null) => {
        if (!checkOut) return 'Ongoing';
        const start = new Date(checkIn).getTime();
        const end = new Date(checkOut).getTime();
        const hours = (end - start) / (1000 * 60 * 60);
        return formatDuration(hours);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FourSquare />
            </div>
        );
    }

    if (error || !record) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center flex flex-col items-center max-w-md">
                    <div className="bg-rose-100 p-4 rounded-full inline-block mb-4">
                        <FiActivity className="text-rose-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Not Found</h2>
                    <p className="text-slate-600 mb-6">{error || 'The requested session could not be found.'}</p>
                    <Button onClick={() => {
                        if (user?.role === 'ADMIN' || user?.role === 'HR') {
                            navigate('/admin/attendance');
                        } else {
                            navigate('/attendance/log');
                        }
                    }} className="inline-flex items-center justify-center">
                        <FiArrowLeft className="mr-2" />
                        Back to Attendance Log
                    </Button>
                </div>
            </div>
        );
    }

    const workSessions = record.sessions || [];
    const breakSessions = record.sessions?.flatMap(s => s.breaks || []) || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Hero Section - Glassmorphism */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>

                <div className="relative z-10 space-y-6">
                    {/* Header Row */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/attendance/log')}
                            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/20 text-white transition-all shadow-sm group"
                            title="Back to Attendance Log"
                        >
                            <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Session Details</h1>
                            <p className="text-indigo-100 mt-1 flex items-center gap-2 text-sm font-medium">
                                <FiCalendar size={14} />
                                {new Date(workSessions[0]?.checkInTime || record.date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'long', 
                                    day: 'numeric',
                                    year: 'numeric',
                                    timeZone: user?.timezone || 'Asia/Karachi'
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-6 border-t border-white/10">
                        {/* Employee Info */}
                        <div className="flex-1">
                             <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-2xl font-bold text-white">
                                    {record.employee ? (
                                        record.employee.avatarUrl ? (
                                            <img src={record.employee.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            record.employee.firstName?.[0] || 'U'
                                        )
                                    ) : <FiUser />}
                                </div>
                                <div>
                                    {record.employee && (
                                        <h2 className="text-xl font-bold text-white tracking-tight">
                                            {`${record.employee.firstName} ${record.employee.lastName}`}
                                        </h2>
                                    )}
                                    <p className="text-indigo-200 text-sm font-medium">
                                        {record.employee?.employeeIdNumber || 'Employee ID'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[110px]">
                                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1">Worked</p>
                                <p className="text-2xl font-bold text-white">{formatDuration((record.totalWorkMinutes || 0) / 60)}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[110px]">
                                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1">Break</p>
                                <p className="text-2xl font-bold text-white">{formatDuration((record.totalBreakMinutes || 0) / 60)}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[110px]">
                                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1">Work Sess.</p>
                                <p className="text-2xl font-bold text-white">{workSessions.length}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[110px]">
                                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1">Break Sess.</p>
                                <p className="text-2xl font-bold text-white">{breakSessions.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Work Sessions Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100/50 text-indigo-600 rounded-lg">
                            <FiClock size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Work Sessions</h3>
                        </div>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                        {workSessions.length} Sessions
                    </span>
                </div>
                
                <div className="overflow-x-auto">
                    {workSessions.length > 0 ? (
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider pl-8">#</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Timings</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider pr-8">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {workSessions.map((session, idx) => (
                                    <tr key={session.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-5 pl-8 whitespace-nowrap text-slate-400 font-mono text-sm">
                                            {String(idx + 1).padStart(2, '0')}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                 <div className="flex flex-col">
                                                     <span className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Check In</span>
                                                     <span className="text-sm font-mono font-bold text-slate-800">{formatTime(session.checkInTime)}</span>
                                                 </div>
                                                 <div className="h-px w-8 bg-slate-300"></div>
                                                 <div className="flex flex-col">
                                                     <span className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Check Out</span>
                                                     <span className="text-sm font-mono font-bold text-slate-800">{formatTime(session.checkOutTime)}</span>
                                                 </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg inline-flex">
                                                <FiMapPin size={14} className="text-slate-400" />
                                                {session.location || 'Office'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                                                {calculateSessionDuration(session.checkInTime, session.checkOutTime)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right pr-8">
                                            {session.checkOutTime ? (
                                                 <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Completed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                                    Ongoing
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-16 text-center text-slate-500">
                            <FiClock className="mx-auto mb-3 text-slate-300" size={48} />
                            <p className="font-medium text-lg text-slate-600">No work sessions recorded</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Break Sessions Section */}
            {breakSessions.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100/50 text-orange-600 rounded-lg">
                                <FiCoffee size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Break Sessions</h3>
                            </div>
                        </div>
                        <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
                            {breakSessions.length} Breaks
                        </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider pl-8">#</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Time Window</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider pr-8">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {breakSessions.map((breakSession, idx) => (
                                    <tr key={breakSession.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-5 pl-8 whitespace-nowrap text-slate-400 font-mono text-sm">
                                            {String(idx + 1).padStart(2, '0')}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                 <div className="flex flex-col">
                                                     <span className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Start</span>
                                                     <span className="text-sm font-mono font-bold text-slate-800">{formatTime(breakSession.startTime)}</span>
                                                 </div>
                                                 <div className="h-px w-8 bg-slate-300"></div>
                                                 <div className="flex flex-col">
                                                     <span className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">End</span>
                                                     <span className="text-sm font-mono font-bold text-slate-800">{formatTime(breakSession.endTime)}</span>
                                                 </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="text-sm font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">
                                                {calculateSessionDuration(breakSession.startTime, breakSession.endTime)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right pr-8">
                                            {breakSession.endTime ? (
                                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                    Finished
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 animate-pulse">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionDetailsPage;
