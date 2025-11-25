import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { api } from '../../services/apiService';
import { AttendanceStats, AttendanceRecord } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ClockActionModal from './ClockActionModal';
import ResolveMissingClockOutModal from './ResolveMissingClockOutModal';
import { toast } from 'sonner';

const AttendanceDashboard: React.FC = () => {
  const { user, attendance, performClockAction, employees } = useAppContext();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'in' | 'out'>('in');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const fetchData = useCallback(async () => {
    if (!user?.employeeId) return;
    try {
        const [statsData, todayData] = await Promise.all([
            api.getStats(user.employeeId),
            api.getTodayAttendanceForEmployee(user.employeeId, today)
        ]);
        setStats(statsData);
        setTodayRecord(todayData);
    } catch (error) {
        console.error("Failed to fetch attendance data", error);
    }
  }, [user?.employeeId, today]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchData]);
    
  const recordToFix = useMemo(() => {
      if (!user || employees.length === 0) return undefined;
      const currentEmployee = employees.find(e => e.employeeId === user.employeeId);
      if (!currentEmployee) return undefined;
      
      return attendance.find(a => 
          a.employeeId === parseInt(currentEmployee.id) && 
          a.sessions?.some(s => s.checkIn && !s.checkOut) && // Has open session
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
    fetchData(); // Refresh data after modal closes
  };

  const handleModalSuccess = (message: string) => {
      toast.success(message);
      closeModal();
  };

  const formatHours = (decimalHours: number) => {
      if (!decimalHours) return "0 hr 0 min";
      const hours = Math.floor(decimalHours);
      const minutes = Math.round((decimalHours - hours) * 60);
      return `${hours} hr ${minutes} min`;
  };

  // Determine current status: Check if there is an open WORK session
  const isClockedIn = useMemo(() => {
      return todayRecord?.sessions?.some(s => !s.checkOut && s.type === 'WORK');
  }, [todayRecord]);
  
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
          <p className="text-3xl font-bold text-slate-900">{formatHours(stats?.hoursToday || 0)}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium text-slate-500">Hours This Week</h3>
          <p className="text-3xl font-bold text-slate-900">{formatHours(stats?.hoursThisWeek || 0)}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium text-slate-500">Hours This Month</h3>
          <p className="text-3xl font-bold text-slate-900">{formatHours(stats?.hoursThisMonth || 0)}</p>
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
                    <p className={`mt-1 font-medium ${isClockedIn ? 'text-green-600' : 'text-slate-500'}`}>
                        Status: {isClockedIn ? 'Present' : 'Absent'}
                    </p>
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
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                          {todayRecord.sessions.map((session) => (
                              <tr key={session.id}>
                                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                      {new Date(session.checkIn).toLocaleTimeString('en-US', timeOptions)}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {session.checkOut ? new Date(session.checkOut).toLocaleTimeString('en-US', timeOptions) : '-'}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session.type === 'BREAK' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                          {session.type || 'WORK'}
                                      </span>
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

export default AttendanceDashboard;
