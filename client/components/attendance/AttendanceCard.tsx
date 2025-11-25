import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { api } from '../../services/apiService';
import { AttendanceRecord } from '../../types';
import Button from '../ui/Button';
import ClockActionModal from './ClockActionModal';
import ResolveMissingClockOutModal from './ResolveMissingClockOutModal';
import { toast } from 'sonner';
import { FiClock, FiLogIn, FiLogOut, FiCoffee, FiPlay, FiSquare } from 'react-icons/fi';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const AttendanceCard: React.FC = () => {
  const { user, attendance, performClockAction, employees } = useAppContext();
  const navigate = useNavigate();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  
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
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, [user?.employeeId, today]);

  // Determine status and active session
  const getStatus = (): { text: string; color: string; bg: string; border: string } => {
    if (todayRecord?.status === 'On Leave') {
        return { text: 'On Leave', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    }
    
    const openSession = todayRecord?.sessions?.find(s => !s.checkOut);
    if (openSession) {
        if (openSession.type === 'BREAK') {
            return { text: 'On Break', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
        }
        return { text: 'Checked In', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    }
    
    if (todayRecord?.sessions?.length && todayRecord.sessions.length > 0 && todayRecord.sessions.every(s => s.checkOut)) {
        return { text: 'Checked Out', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
    }
    
    return { text: 'Not Checked In', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
  };

  const { text: statusText, color: statusColor, bg: statusBg, border: statusBorder } = getStatus();
  const isClockedIn = statusText === 'Checked In' || statusText === 'On Break';
  
  // Calculate running timer
  useEffect(() => {
      let interval: NodeJS.Timeout;
      
      if (isClockedIn && todayRecord?.sessions) {
          const currentSession = todayRecord.sessions.find(s => !s.checkOut);
          if (currentSession?.checkIn) {
              const start = dayjs(currentSession.checkIn);
              
              const updateTimer = () => {
                  const now = dayjs();
                  const diff = now.diff(start);
                  const dur = dayjs.duration(diff);
                  setElapsedTime(dur.format('HH:mm:ss'));
              };
              
              updateTimer(); // Initial update
              interval = setInterval(updateTimer, 1000);
          }
      } else {
          setElapsedTime("00:00:00");
      }
      
      return () => clearInterval(interval);
  }, [isClockedIn, todayRecord]);

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

  // Get sorted work sessions
  const workSessions = useMemo(() => {
      if (!todayRecord?.sessions) return [];
      return todayRecord.sessions
          .filter(s => !s.type || s.type === 'WORK')
          .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
  }, [todayRecord]);

  const activeSession = workSessions.find(s => !s.checkOut);
  const firstSession = workSessions[0];
  const lastSession = workSessions[workSessions.length - 1];

  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden relative group">
        {/* Decorative background elements */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${isClockedIn ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-slate-300 to-slate-400'}`}></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="p-6 sm:p-8 relative z-10">
            <div className="flex flex-col gap-8">
                
                {/* Header Section */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Attendance</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">{currentTime.format('dddd, MMMM D, YYYY')}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusBg} ${statusColor} ${statusBorder} shadow-sm`}>
                        {statusText}
                    </div>
                </div>

                {/* Main Timer Section */}
                <div className="flex flex-col items-center justify-center py-4">
                    {isClockedIn ? (
                        <div className="relative">
                            {/* Pulsing Effect */}
                            <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-40 animate-pulse"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="text-6xl sm:text-7xl font-mono font-bold text-slate-900 tracking-tighter tabular-nums leading-none drop-shadow-sm">
                                    {elapsedTime}
                                </div>
                                <div className="text-sm font-medium text-emerald-600 mt-3 flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Running Session
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="text-5xl sm:text-6xl font-mono font-bold text-slate-300 tracking-tighter tabular-nums leading-none">
                                {currentTime.format('hh:mm:ss')}
                                <span className="text-2xl sm:text-3xl ml-2 text-slate-400 font-normal">
                                    {currentTime.format('A')}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-slate-400 mt-3">Ready to start your day</p>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 transition-all hover:border-indigo-100 hover:shadow-sm group/stat">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg group-hover/stat:bg-indigo-600 group-hover/stat:text-white transition-colors">
                                <FiLogIn size={14} />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Check In</span>
                        </div>
                        <p className="text-lg font-bold text-slate-800">
                            {activeSession?.checkIn 
                                ? dayjs(activeSession.checkIn).format('hh:mm A') 
                                : firstSession?.checkIn 
                                    ? dayjs(firstSession.checkIn).format('hh:mm A')
                                    : <span className="text-slate-400 text-base font-normal">Not checked in</span>}
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 transition-all hover:border-orange-100 hover:shadow-sm group/stat">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg group-hover/stat:bg-orange-600 group-hover/stat:text-white transition-colors">
                                <FiLogOut size={14} />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Check Out</span>
                        </div>
                        <p className="text-lg font-bold text-slate-800">
                            {lastSession?.checkOut 
                                ? dayjs(lastSession.checkOut).format('hh:mm A') 
                                : <span className="text-slate-400 text-base font-normal">--:--</span>}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {!isClockedIn ? (
                        <Button 
                            onClick={handleClockInClick} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all py-3 text-base justify-center"
                        >
                            <FiPlay className="mr-2" /> Check In
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => openModal('out')} 
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-lg transition-all py-3 text-base justify-center"
                        >
                            <FiSquare className="mr-2 fill-current" /> Check Out
                        </Button>
                    )}
                    <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => navigate('/attendance/log')} 
                        className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 justify-center py-3"
                    >
                        View History
                    </Button>
                </div>
            </div>
        </div>

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
