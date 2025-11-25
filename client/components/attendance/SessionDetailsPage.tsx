import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiCoffee, FiMapPin, FiCalendar, FiUser, FiActivity } from 'react-icons/fi';
import { api } from '../../services/apiService';
import { AttendanceRecord } from '../../types';
import Button from '../ui/Button';
import FourSquare from '../ui/FourSquare';

const SessionDetailsPage: React.FC = () => {
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
            timeZone: 'Asia/Karachi'
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
                    <Button onClick={() => navigate('/attendance/log')} className="inline-flex items-center justify-center">
                        <FiArrowLeft className="mr-2" />
                        Back to Attendance Log
                    </Button>
                </div>
            </div>
        );
    }

    const workSessions = record.sessions?.filter(s => s.type === 'WORK') || [];
    const breakSessions = record.sessions?.filter(s => s.type === 'BREAK') || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/attendance/log')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Back to Attendance Log"
                >
                    <FiArrowLeft size={20} className="text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Session Details</h1>
                    <p className="text-slate-500 mt-1">Detailed breakdown of attendance session</p>
                </div>
            </div>

            {/* Hero Section - Summary Card */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Date & Employee Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                                    <FiCalendar className="text-white" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {new Date(record.date).toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            month: 'long', 
                                            day: 'numeric',
                                            year: 'numeric',
                                            timeZone: 'Asia/Karachi'
                                        })}
                                    </h2>
                                    {record.employee && (
                                        <p className="text-indigo-100 text-sm mt-1 flex items-center gap-2">
                                            <FiUser size={14} />
                                            {record.employee.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiClock className="text-indigo-200" size={18} />
                                    <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Total Worked</p>
                                </div>
                                <p className="text-2xl font-bold text-white">{formatDuration(record.totalHours || 0)}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiCoffee className="text-orange-200" size={18} />
                                    <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Total Break</p>
                                </div>
                                <p className="text-2xl font-bold text-white">{formatDuration(record.breakHours || 0)}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 col-span-2 md:col-span-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiActivity className="text-emerald-200" size={18} />
                                    <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Sessions</p>
                                </div>
                                <p className="text-2xl font-bold text-white">{workSessions.length} Work / {breakSessions.length} Break</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Work Sessions Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <FiClock className="text-indigo-600" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Work Sessions</h3>
                            <p className="text-sm text-slate-600">All work periods for this day</p>
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    {workSessions.length > 0 ? (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Session</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Check In</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Check Out</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {workSessions.map((session, idx) => (
                                    <tr key={session.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                #{idx + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-mono font-medium text-slate-900">{formatTime(session.checkIn)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {session.checkOut ? (
                                                <div className="text-sm font-mono font-medium text-slate-900">{formatTime(session.checkOut)}</div>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                    Ongoing
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <FiMapPin size={14} className="text-slate-400" />
                                                {session.location || 'Office'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-slate-900">
                                                {calculateSessionDuration(session.checkIn, session.checkOut)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-12 text-center text-slate-500">
                            <FiClock className="mx-auto mb-3 text-slate-300" size={32} />
                            <p className="font-medium">No work sessions recorded</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Break Sessions Section */}
            {breakSessions.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <FiCoffee className="text-orange-600" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Break Sessions</h3>
                                <p className="text-sm text-slate-600">All break periods for this day</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Break</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Start Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">End Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {breakSessions.map((breakSession, idx) => (
                                    <tr key={breakSession.id} className="hover:bg-orange-50/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                                #{idx + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-mono font-medium text-slate-900">{formatTime(breakSession.checkIn)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {breakSession.checkOut ? (
                                                <div className="text-sm font-mono font-medium text-slate-900">{formatTime(breakSession.checkOut)}</div>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                    Ongoing
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-slate-900">
                                                {calculateSessionDuration(breakSession.checkIn, breakSession.checkOut)}
                                            </span>
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
