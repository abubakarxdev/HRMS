import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { api } from '../../services/apiService';
import { AttendanceStats, AttendanceRecord } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { toast } from 'sonner';

const AttendanceDashboard: React.FC = () => {
  const { user } = useAppContext();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('Office');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Custom Time State
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customCheckInTime, setCustomCheckInTime] = useState('');
  
  // Custom Clock Out State
  const [showCustomClockOut, setShowCustomClockOut] = useState(false);
  const [customClockOutTime, setCustomClockOutTime] = useState('');

  // Break State
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakType, setBreakType] = useState<'DEFAULT' | 'NO_BREAK' | 'CUSTOM'>('DEFAULT');
  const [customBreakTime, setCustomBreakTime] = useState('');

  const fetchData = useCallback(async () => {
    if (!user?.employeeId) return;
    try {
        const [statsData, todayData] = await Promise.all([
            api.getStats(user.employeeId),
            api.getTodayAttendanceForEmployee(user.employeeId)
        ]);
        setStats(statsData);
        setTodayRecord(todayData);
    } catch (error) {
        console.error("Failed to fetch attendance data", error);
    }
  }, [user?.employeeId]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleClockIn = async () => {
    if (!user?.employeeId) return;
    setLoading(true);
    try {
      const timeToSend = showCustomTime && customCheckInTime ? new Date(customCheckInTime).toISOString() : undefined;
      await api.clockIn(user.employeeId, location, timeToSend);
      await fetchData();
      setShowCustomTime(false);
      setCustomCheckInTime('');
      toast.success("Clocked in successfully!");
    } catch (error) {
      console.error("Clock in failed", error);
      toast.error("Failed to clock in.");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!user?.employeeId) return;
    setLoading(true);
    try {
      const timeToSend = showCustomClockOut && customClockOutTime ? new Date(customClockOutTime).toISOString() : undefined;
      await api.clockOut(user.employeeId, timeToSend);
      await fetchData();
      setShowCustomClockOut(false);
      setCustomClockOutTime('');
      toast.success("Clocked out successfully!");
    } catch (error) {
      console.error("Clock out failed", error);
      toast.error("Failed to clock out.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
      if (!user?.employeeId) return;
      
      // Handle NO_BREAK option - just close modal
      if (breakType === 'NO_BREAK') {
          setShowBreakModal(false);
          toast.success("Continuing without break!");
          return;
      }
      
      setLoading(true);
      try {
          const timeToSend = breakType === 'CUSTOM' && customBreakTime ? new Date(customBreakTime).toISOString() : undefined;
          await api.startBreak(user.employeeId, breakType, timeToSend);
          await fetchData();
          setShowBreakModal(false);
          setCustomBreakTime('');
          toast.success("Break started!");
      } catch (error) {
          console.error("Start break failed", error);
          toast.error("Failed to start break.");
      } finally {
          setLoading(false);
      }
  };

  const handleEndBreak = async () => {
      if (!user?.employeeId) return;
      setLoading(true);
      try {
          await api.endBreak(user.employeeId);
          await fetchData();
          toast.success("Break ended!");
      } catch (error) {
          console.error("End break failed", error);
          toast.error("Failed to end break.");
      } finally {
          setLoading(false);
      }
  };

  const formatHours = (decimalHours: number) => {
      if (!decimalHours) return "0 hr 0 min";
      const hours = Math.floor(decimalHours);
      const minutes = Math.round((decimalHours - hours) * 60);
      return `${hours} hr ${minutes} min`;
  };

  // Determine current status
  const openSession = todayRecord?.sessions?.find(s => !s.checkOut);
  const isClockedIn = !!openSession;
  const isOnBreak = openSession?.type === 'BREAK';

  // Timezone handling (Default to Asia/Karachi as requested)
  const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
  };

  return (
    <div className="space-y-6">
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
                    <p className={`mt-1 font-medium ${isClockedIn ? (isOnBreak ? 'text-orange-600' : 'text-green-600') : 'text-slate-500'}`}>
                        Status: {isClockedIn ? (isOnBreak ? 'On Break' : 'Present') : 'Absent'}
                    </p>
                </div>
            </div>
            
            <div className="flex flex-wrap items-end gap-4 border-t pt-4">
                {!isClockedIn ? (
                    <>
                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <select 
                                value={location} 
                                onChange={(e) => setLocation(e.target.value)}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            >
                                <option value="Office">Office</option>
                                <option value="Home">Home</option>
                            </select>
                        </div>

                        <div className="w-full md:w-auto">
                             <label className="flex items-center space-x-2 mb-2">
                                <input 
                                    type="checkbox" 
                                    checked={showCustomTime} 
                                    onChange={(e) => setShowCustomTime(e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">Use Custom Time</span>
                            </label>
                            {showCustomTime && (
                                <input 
                                    type="datetime-local" 
                                    value={customCheckInTime}
                                    onChange={(e) => setCustomCheckInTime(e.target.value)}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                            )}
                        </div>

                        <Button onClick={handleClockIn} disabled={loading || (showCustomTime && !customCheckInTime)}>
                            Clock In
                        </Button>
                    </>
                ) : (
                    <>
                        {isOnBreak ? (
                            <Button onClick={handleEndBreak} disabled={loading}>
                                End Break
                            </Button>
                        ) : (
                            <>
                                <div className="w-full md:w-auto">
                                    <label className="flex items-center space-x-2 mb-2">
                                        <input 
                                            type="checkbox" 
                                            checked={showCustomClockOut} 
                                            onChange={(e) => setShowCustomClockOut(e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">Custom Clock Out Time</span>
                                    </label>
                                    {showCustomClockOut && (
                                        <input 
                                            type="datetime-local" 
                                            value={customClockOutTime}
                                            onChange={(e) => setCustomClockOutTime(e.target.value)}
                                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                        />
                                    )}
                                </div>
                                
                                <Button onClick={handleClockOut} disabled={loading || (showCustomClockOut && !customClockOutTime)} variant="danger">
                                    Clock Out
                                </Button>
                                <Button onClick={() => setShowBreakModal(true)} variant="secondary" disabled={loading}>
                                    Add Break
                                </Button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
      </Card>

      {/* Break Modal */}
      {showBreakModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                  <h3 className="text-lg font-medium mb-4">Start Break</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Break Type</label>
                          <select 
                              value={breakType} 
                              onChange={(e) => setBreakType(e.target.value as 'DEFAULT' | 'NO_BREAK' | 'CUSTOM')}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                          >
                              <option value="DEFAULT">Default (1:00 PM - 2:00 PM / Fri 2:30 PM)</option>
                              <option value="NO_BREAK">No Break</option>
                              <option value="CUSTOM">Custom</option>
                          </select>
                      </div>
                      
                      {breakType === 'CUSTOM' && (
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Break Time</label>
                              <input 
                                  type="datetime-local" 
                                  value={customBreakTime}
                                  onChange={(e) => setCustomBreakTime(e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                              />
                          </div>
                      )}
                      
                      <div className="flex justify-end gap-3 mt-6">
                          <Button variant="secondary" onClick={() => setShowBreakModal(false)}>Cancel</Button>
                          <Button onClick={handleStartBreak} disabled={breakType === 'CUSTOM' && !customBreakTime}>
                              {breakType === 'NO_BREAK' ? 'Continue' : 'Start Break'}
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

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
    </div>
  );
};

export default AttendanceDashboard;
