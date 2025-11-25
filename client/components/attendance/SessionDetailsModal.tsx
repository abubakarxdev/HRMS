import React from 'react';
import { FiX, FiClock, FiCoffee } from 'react-icons/fi';
import { AttendanceRecord } from '../../types';

interface SessionDetailsModalProps {
    record: AttendanceRecord | null;
    isOpen: boolean;
    onClose: () => void;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({ record, isOpen, onClose }) => {
    if (!isOpen || !record) return null;

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

    // Get work and break sessions
    const workSessions = record.sessions?.filter(s => s.type === 'WORK') || [];
    const breakSessions = record.sessions?.filter(s => s.type === 'BREAK') || [];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="flex items-center justify-center min-h-screen px-4 py-6">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true"></div>

                {/* Modal */}
                <div 
                    className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">
                                Session Details
                            </h3>
                            <p className="text-indigo-100 text-sm mt-0.5">
                                {new Date(record.date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    timeZone: 'Asia/Karachi'
                                })}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-indigo-100 hover:text-white transition-colors p-1.5 hover:bg-indigo-700 rounded"
                        >
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Summary */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <FiClock className="text-indigo-600" size={16} />
                                <span className="text-slate-600">Total Work Hours:</span>
                                <span className="font-semibold text-slate-900">{formatDuration(record.totalHours || 0)}</span>
                                <span className="text-slate-500 text-xs">(breaks excluded)</span>
                            </div>
                            <div className="h-4 w-px bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                                <FiCoffee className="text-orange-600" size={16} />
                                <span className="text-slate-600">Total Break:</span>
                                <span className="font-semibold text-slate-900">{formatDuration(record.breakHours || 0)}</span>
                            </div>
                            <div className="h-4 w-px bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-600">Work Sessions:</span>
                                <span className="font-semibold text-slate-900">{workSessions.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Sessions Table */}
                    <div className="overflow-y-auto max-h-[calc(90vh-240px)] px-6 py-4">
                        {/* Work Sessions */}
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Work Sessions</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Session</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Check In</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Check Out</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Location</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {workSessions.map((session, idx) => (
                                            <tr key={session.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                        #{idx + 1}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                                                    {formatTime(session.checkIn)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                                                    {session.checkOut 
                                                        ? formatTime(session.checkOut)
                                                        : <span className="text-amber-600 font-medium">Ongoing</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                                                    {session.location || 'Office'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                                                    {calculateSessionDuration(session.checkIn, session.checkOut)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Break Sessions */}
                        {breakSessions.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                                    <FiCoffee className="text-orange-600" size={16} />
                                    Break Sessions
                                </h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
                                        <thead className="bg-orange-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Break</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Start Time</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">End Time</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Duration</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {breakSessions.map((breakSession, idx) => (
                                                <tr key={breakSession.id} className="hover:bg-orange-50">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                            #{idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                                                        {formatTime(breakSession.checkIn)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                                                        {breakSession.checkOut 
                                                            ? formatTime(breakSession.checkOut)
                                                            : <span className="text-amber-600 font-medium">Ongoing</span>
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                                                        {calculateSessionDuration(breakSession.checkIn, breakSession.checkOut)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionDetailsModal;
