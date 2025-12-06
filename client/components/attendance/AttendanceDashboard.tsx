import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendanceStats, useTodayAttendance, useAttendanceRecords, useEmployeeAttendance } from '../../hooks/useAttendance';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ClockActionModal from './ClockActionModal';
import ResolveMissingClockOutModal from './ResolveMissingClockOutModal';

const AttendanceDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const { data: stats, isLoading: loadingStats } = useAttendanceStats(user?.employeeId || '');
  const { data: todayRecord, isLoading: loadingToday } = useTodayAttendance(user?.employeeId || '');
  const { data: historyResponse } = useEmployeeAttendance(user?.employeeId || '', undefined, undefined, undefined, 1, 50);
  const allAttendance = historyResponse?.data || [];
  
  const loading = loadingStats || loadingToday;
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'in' | 'out'>('in');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
    
  const recordToFix = useMemo(() => {
      if (!user?.employeeId) return undefined;
      
      return allAttendance.find(a => 
          a.employeeId === user.employeeId && 
          a.sessions?.some(s => s.checkInTime && !s.checkOutTime) && // Has open session
          a.date !== today
      );
  }, [allAttendance, user?.employeeId, today]);

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
  };

  const handleModalSuccess = (message: string) => {
      closeModal();
  };

  const formatHours = (decimalHours: number | string) => {
      const num = typeof decimalHours === 'string' ? parseFloat(decimalHours) : decimalHours;
      if (!num) return "0 hr 0 min";
      const hours = Math.floor(num);
      const minutes = Math.round((num - hours) * 60);
      return `${hours} hr ${minutes} min`;
  };

  // Determine current status: Check if there is an open session
  const openSession = useMemo(() => {
      return todayRecord?.sessions?.find(s => !s.checkOutTime);
  }, [todayRecord]);

  const isClockedIn = !!openSession;
  
  // Check if currently on break (open session has an active break)
  const isOnBreak = useMemo(() => {
      if (!openSession) return false;
      // Check if there is a break without endTime
      return openSession.breaks?.some(b => !b.endTime);
  }, [openSession]);

  // Timezone handling (Default to Asia/Karachi as requested)
  const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
  };

  if (!user) return null;

  return (
    <div className="space-y-6 relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <Card>
          <h3 className="text-lg font-medium text-slate-500">Hours Today</h3>
          <p className="text-3xl font-bold text-slate-900">{stats?.hoursToday || "0 hr 0 min"}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium text-slate-500">Hours This Week</h3>
          <p className="text-3xl font-bold text-slate-900">{stats?.hoursThisWeek || "0 hr 0 min"}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium text-slate-500">Hours This Month</h3>
          <p className="text-3xl font-bold text-slate-900">{stats?.hoursThisMonth || "0 hr 0 min"}</p>
        </Card>
      </div>

      <Card title="Attendance Action">
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-slate-500">Current Time (PKT)</p>
                    <p className="text-2xl font-mono font-bold">
                        {currentTime.toLocaleTimeString('en-US', timeOptions)}
                    </p>
                    <p className={`mt-1 font-medium ${isClockedIn ? (isOnBreak ? 'text-orange-600' : 'text-green-600') : 'text-slate-500'}`}>
                        Status: {isClockedIn ? (isOnBreak ? 'On Break' : 'Present') : 'Absent'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">ID: {user.employeeId}</p>
                </div>
            </div>
            
            <div className="flex flex-wrap items-end gap-4 border-t pt-4">
                {!isClockedIn ? (
                    <Button onClick={handleClockInClick} disabled={loading}>
                        Clock In
                    </Button>
                ) : (
                    <Button onClick={() => openModal('out')} disabled={loading} variant="danger">
                        Clock Out
                    </Button>
                )}
            </div>
        </div>
      </Card>

      {todayRecord?.sessions && todayRecord.sessions.length > 0 && (
          <Card title="Today's Sessions">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                          <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Check In</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Check Out</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Duration</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                          {todayRecord.sessions.map((session) => (
                              <tr key={session.id}>
                                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                      {new Date(session.checkInTime).toLocaleTimeString('en-US', timeOptions)}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {session.checkOutTime ? new Date(session.checkOutTime).toLocaleTimeString('en-US', timeOptions) : '-'}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {session.durationMinutes ? `${Math.floor(session.durationMinutes / 60)}h ${session.durationMinutes % 60}m` : '-'}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{session.location}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </Card>
      )}

      {isModalOpen && user && (
        <ClockActionModal
            isOpen={isModalOpen}
            onClose={closeModal}
            employee={{
                ...user,
                id: user.employeeId || ''
            } as any}
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
            onSuccess={() => {
                handleModalSuccess('Missing clock-out resolved and clocked in!');
            }}
        />
      )}
    </div>
  );
};

export default AttendanceDashboard;
