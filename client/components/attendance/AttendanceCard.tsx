import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { api } from '../../services/apiService';
import { AttendanceRecord } from '../../types';
import Button from '../ui/Button';
import ClockActionModal from './ClockActionModal';
import ResolveMissingClockOutModal from './ResolveMissingClockOutModal';
import { toast } from 'sonner';

const formatHoursMinutes = (decimalHours: number): string => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
};

const AttendanceCard: React.FC = () => {
  const { user, attendance, performClockAction, employees } = useAppContext();
  const navigate = useNavigate();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [workedHours, setWorkedHours] = useState({ today: 0, week: 0, month: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'in' | 'out'>('in');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [showLog, setShowLog] = useState(false);

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
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [user?.employeeId, today]);

  // Calculate hours logic (reused from EmployeeAttendanceCard)
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
                        sessionHours += (end - start) / (1000 * 60 * 60);
                    } else {
                        const start = new Date(session.checkIn).getTime();
                        const end = now.getTime();
                        const diff = Math.max(0, end - start); // Prevent negative hours
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
        
        setWorkedHours({
            today: liveHoursToday,
            week: completedHoursWeek + liveHoursToday,
            month: completedHoursMonth + liveHoursToday,
        });
    };

    calculateAllHours();

    const isClockedIn = todayRecord?.sessions?.some(s => !s.checkOut);
    if (isClockedIn) {
        const interval = setInterval(calculateAllHours, 60000);
        return () => clearInterval(interval);
    }
  }, [attendance, todayRecord, user]);

  const recordToFix = useMemo(() => {
      if (!user || employees.length === 0) return undefined;
      const currentEmployee = employees.find(e => e.employeeId === user.employeeId);
      if (!currentEmployee) return undefined;
      
      return attendance.find(a => 
          a.employeeId === parseInt(currentEmployee.id) && 
          a.sessions?.some(s => s.checkIn && !s.checkOut) && 
          a.date !== today
      );
  }, [attendance, user, employees, today]);

  const handleClockInClick = () => {
      if (recordToFix) {
          setIsResolveModalOpen(true);
      } else {
          openModal('in');
      }
  };

  const openModal = (action: 'in' | 'out') => {
    setModalAction(action);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    fetchData();
  };

  const handleModalSuccess = (message: string) => {
      toast.success(message);
      closeModal();
  };

  const getStatus = (): { text: string; color: string } => {
    if (todayRecord?.status === 'On Leave') {
        return { text: 'On Leave', color: 'text-yellow-600' };
    }
    
    const openSession = todayRecord?.sessions?.find(s => !s.checkOut);
    if (openSession) {
        if (openSession.type === 'BREAK') {
            return { text: 'On Break', color: 'text-orange-600' };
        }
        return { text: 'Present', color: 'text-green-600' };
    }
    
    if (todayRecord?.sessions?.length && todayRecord.sessions.length > 0 && todayRecord.sessions.every(s => s.checkOut)) {
        return { text: 'Checked Out', color: 'text-blue-600' };
    }
    
    return { text: 'Absent', color: 'text-red-600' };
  };

  const { text: statusText, color: statusColor } = getStatus();
  const isClockedIn = statusText === 'Present' || statusText === 'On Break';

  // Timezone handling
  const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-6">
                {/* Top Section: Header & Time */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">My Attendance Today</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <div className="text-3xl sm:text-4xl font-mono font-bold text-slate-900 tracking-tight">
                                {currentTime.toLocaleTimeString('en-US', { ...timeOptions, second: undefined })}
                                <span className="text-lg text-slate-400 ml-1 font-normal">
                                    {currentTime.toLocaleTimeString('en-US', { second: '2-digit' }).split(':')[2]}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                                statusText === 'Present' ? 'bg-green-100 text-green-700 border border-green-200' :
                                statusText === 'On Break' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                statusText === 'Checked Out' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                                {statusText}
                            </span>
                            <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">
                                {statusText === 'Absent' && 'Not checked in yet'}
                                {statusText === 'Present' && `Since ${todayRecord?.sessions?.find(s => !s.checkOut)?.checkIn ? new Date(todayRecord.sessions.find(s => !s.checkOut)!.checkIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}`}
                                {statusText === 'Checked Out' && 'Have a good evening!'}
                            </span>
                        </div>
                    </div>


                </div>

                {/* Actions Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {!isClockedIn ? (
                        <Button 
                            onClick={handleClockInClick} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm justify-center"
                        >
                            Check In
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => openModal('out')} 
                            className="w-full bg-red-600 hover:bg-red-700 text-white shadow-sm justify-center"
                        >
                            Check Out
                        </Button>
                    )}
                    <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => navigate('/attendance/log')} 
                        className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 justify-center"
                    >
                        View Log
                    </Button>
                </div>
            </div>
        </div>

        {/* Attendance Log Dropdown */}
        {showLog && (
            <div className="bg-slate-50 border-t border-slate-200 p-4 animate-in slide-in-from-top-2 duration-200">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Today's Activity</h4>
                {todayRecord?.sessions && todayRecord.sessions.length > 0 ? (
                     <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="py-2 pl-4 pr-3 text-left text-xs font-semibold text-slate-600">Time In</th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Time Out</th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {todayRecord.sessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-slate-900">
                                            {new Date(session.checkIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2 text-sm text-slate-500">
                                            {session.checkOut ? new Date(session.checkOut).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2 text-sm">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                session.type === 'BREAK' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                                {session.type || 'WORK'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 italic text-center py-2">No activity recorded for today yet.</p>
                )}
            </div>
        )}

        {/* Modals */}
        {isModalOpen && user && (
            <ClockActionModal
                isOpen={isModalOpen}
                onClose={closeModal}
                employee={user as any}
                action={modalAction}
                todayRecord={todayRecord || undefined}
                onSuccess={() => handleModalSuccess(modalAction === 'in' ? 'Clocked in successfully!' : 'Clocked out successfully!')}
            />
        )}

        {recordToFix && isResolveModalOpen && user && (
            <ResolveMissingClockOutModal
                isOpen={isResolveModalOpen}
                onClose={() => setIsResolveModalOpen(false)}
                record={recordToFix}
                onSuccess={async () => {
                    await performClockAction(user.employeeId, 'in', undefined, undefined, undefined, today);
                    handleModalSuccess('Missing clock-out resolved and clocked in!');
                }}
            />
        )}
    </div>
  );
};

export default AttendanceCard;
