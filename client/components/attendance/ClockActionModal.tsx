import React, { useState, useMemo } from 'react';
import { AttendanceRecord, Employee } from '../../types';
import { useClockIn, useClockOut } from '../../hooks/useAttendance';
import Button from '../ui/Button';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { toast } from 'sonner';
import { formatTime, getDefaultBreakTimes } from '../../utils/attendanceUtils';

interface ClockActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  action: 'in' | 'out';
  todayRecord?: AttendanceRecord;
  onSuccess?: (message: string) => void;
  timezone?: string;
}

const ClockActionModal: React.FC<ClockActionModalProps> = ({ isOpen, onClose, employee, action, todayRecord, onSuccess, timezone }) => {
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();
  const userTimezone = timezone || employee.user?.timezone || 'Asia/Karachi';
  
  // Step management
  // For check-in: 1 = location selection, 2 = time selection
  // For check-out: 1 = break selection, 2 = time selection
  const [step, setStep] = useState<1 | 2>(1);
  
  // Location selection (for check-in only)
  const [location, setLocation] = useState<'Office' | 'Home'>('Office');
  
  // Time selection
  const [timeMode, setTimeMode] = useState<'now' | 'custom'>('now');
  const [customTime, setCustomTime] = useState<Dayjs | null>(null);
  
  // Break selection (for check-out only)
  const [breakMode, setBreakMode] = useState<'default' | 'custom' | 'none'>('default');
  const [customBreakStart, setCustomBreakStart] = useState<Dayjs | null>(null);
  const [customBreakEnd, setCustomBreakEnd] = useState<Dayjs | null>(null);
  
  const [loading, setLoading] = useState(false);


  if (!isOpen) return null;

  // Get day-based default break times
  const defaultBreak = useMemo(() => getDefaultBreakTimes(), []);

  const validateTime = (time: Dayjs | null): boolean => {
    if (!time) {
      toast.warning('Please select a time.');
      return false;
    }

    const now = dayjs().tz(userTimezone);
    // Convert input time to user timezone to ensure we extract the correct hour/minute for that zone
    const timeInZone = dayjs(time).tz(userTimezone);
    const hours = timeInZone.hour();
    const minutes = timeInZone.minute();
    const selectedTime = now.hour(hours).minute(minutes).second(0).millisecond(0);

    // Cannot be in the future (allow 2 minute buffer for clock drift/fast fingers)
    // We compare timestamps to be safe
    const bufferTime = dayjs().add(2, 'minute');
    
    if (selectedTime.isAfter(bufferTime)) {
      toast.warning('Cannot select a future time.');
      return false;
    }

    // For check-out, must be after check-in
    if (action === 'out' && todayRecord?.sessions) {
      const currentSession = todayRecord.sessions.find(s => !s.checkOutTime);
      if (currentSession?.checkInTime) {
        const checkInDate = dayjs(currentSession.checkInTime).tz(userTimezone);
        // Allow check-out in the same minute (rare but possible)
        if (selectedTime.isBefore(checkInDate)) {
          toast.warning('Clock out time must be after clock in time.');
          return false;
        }
      }

      // Validate Check-out > Break End
      const { end: breakEnd } = getBreakTimes();
      if (breakEnd) {
        const [endHour, endMin] = breakEnd.split(':').map(Number);
        const breakEndDate = now.hour(endHour).minute(endMin).second(0).millisecond(0);

        if (selectedTime.isSame(breakEndDate) || selectedTime.isBefore(breakEndDate)) {
          const formattedSelectedTime = selectedTime.format('hh:mm A');
          const formattedBreakEnd = breakEndDate.format('hh:mm A');
          toast.warning(`Clock out time (${formattedSelectedTime}) must be after break end time (${formattedBreakEnd}).`);
          return false;
        }
      }
    }
    
    return true;
  };

  const getBreakTimes = () => {
    if (breakMode === 'none') return { start: null, end: null };
    
    let breakStartStr = breakMode === 'default' ? defaultBreak.start : (customBreakStart ? customBreakStart.format('HH:mm') : '');
    let breakEndStr = breakMode === 'default' ? defaultBreak.end : (customBreakEnd ? customBreakEnd.format('HH:mm') : '');

    return { start: breakStartStr, end: breakEndStr };
  };

  const validateBreakTimes = (): boolean => {
    if (breakMode === 'none') return true;
    
    const { start: breakStart, end: breakEnd } = getBreakTimes();

    if (!breakStart || !breakEnd) {
      toast.warning('Please select both break start and end times.');
      return false;
    }

    const [startHour, startMin] = breakStart.split(':').map(Number);
    const [endHour, endMin] = breakEnd.split(':').map(Number);

    // Validate 9 AM - 6 PM range (Only for Asia/Karachi)
    if (userTimezone === 'Asia/Karachi') {
      const startTotalMinutes = startHour * 60 + startMin;
      const endTotalMinutes = endHour * 60 + endMin;
      const nineAmMinutes = 9 * 60;
      const sixPmMinutes = 18 * 60;

      if (startTotalMinutes < nineAmMinutes || startTotalMinutes >= sixPmMinutes) {
        toast.warning('Break start time must be between 9:00 AM and 6:00 PM.');
        return false;
      }

      if (endTotalMinutes <= nineAmMinutes || endTotalMinutes > sixPmMinutes) {
        toast.warning('Break end time must be between 9:00 AM and 6:00 PM.');
        return false;
      }
    } else {
      // For other timezones, we just need start/end minutes for duration check
      // We don't enforce the 9-6 window
    }

    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = endHour * 60 + endMin;

    // End must be after start
    if (endTotalMinutes <= startTotalMinutes) {
      toast.warning('Break end time must be after break start time.');
      return false;
    }

    // Duration: 15 min - 2 hours
    const breakDuration = (endTotalMinutes - startTotalMinutes) / 60;
    if (breakDuration < 0.25 || breakDuration > 2) {
      toast.warning('Break duration must be between 15 minutes and 2 hours.');
      return false;
    }

    // Validate Break Start > Check-in Time
    if (todayRecord?.sessions) {
      const currentSession = todayRecord.sessions.find(s => !s.checkOutTime);
      if (currentSession?.checkInTime) {
        const checkInDate = dayjs(currentSession.checkInTime).tz(userTimezone);
        const now = dayjs().tz(userTimezone);
        const breakStartDate = now.hour(startHour).minute(startMin).second(0).millisecond(0);

        if (breakStartDate.isSame(checkInDate) || breakStartDate.isBefore(checkInDate)) {
          const formattedBreakStart = breakStartDate.format('hh:mm A');
          const formattedCheckIn = checkInDate.format('hh:mm A');
          toast.warning(`Break start time (${formattedBreakStart}) must be after check-in time (${formattedCheckIn}).`);
          return false;
        }
      }
    }

    return true;
  };

  const handleBreakNext = () => {
    if (!validateBreakTimes()) return;
    setStep(2); // Move to time selection
  };

  const handleSubmit = async () => {
    // Validate time
    const timeToUse = timeMode === 'now' ? dayjs() : customTime;
    if (!validateTime(timeToUse)) {
      return;
    }

    setLoading(true);

    try {
      // Prepare time payload
      let timePayload = undefined;
      const userTimezone = timezone || employee.user?.timezone || 'Asia/Karachi';

      if (timeMode === 'custom' && customTime) {
        // Construct date in user's timezone
        const now = dayjs().tz(userTimezone);
        const hours = customTime.hour();
        const minutes = customTime.minute();
        
        // Create new date with same day but selected time
        const dateWithTime = now.hour(hours).minute(minutes).second(0).millisecond(0);
        timePayload = dateWithTime.toISOString();
      }

      if (action === 'in') {
        await clockInMutation.mutateAsync({
          employeeId: employee.id,
          customTime: timePayload,
          location: location,
        });
        const message = 'Clocked in successfully!';
        toast.success(message);
        if (onSuccess) {
          onSuccess(message);
        }
      } else {
        // For check-out, include break times
        let breakStart = breakMode === 'default' ? defaultBreak.start : (breakMode === 'custom' && customBreakStart ? customBreakStart.format('HH:mm') : undefined);
        let breakEnd = breakMode === 'default' ? defaultBreak.end : (breakMode === 'custom' && customBreakEnd ? customBreakEnd.format('HH:mm') : undefined);
        
        await clockOutMutation.mutateAsync({
          employeeId: employee.id,
          customTime: timePayload,
          breakStart,
          breakEnd,
        });
        const message = 'Clocked out successfully!';
        toast.success(message);
        if (onSuccess) {
          onSuccess(message);
        }
      }
      onClose();
    } catch (e: any) {
      // Extract the specific error message from the API response
      const errorMessage = e?.response?.data?.error || e?.message || 'An error occurred. Please try again.';
      
      // Determine toast type based on HTTP status code
      // 400 = validation error (warning), 500+ = server error (error)
      if (e?.response?.status === 400) {
        toast.warning(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const title = action === 'in' ? (step === 1 ? 'Select Location' : 'Clock In') : (step === 1 ? 'Select Break Time' : 'Clock Out');
  const employeeName = employee.firstName ? `${employee.firstName} ${employee.lastName}` : (employee.name || 'Unknown');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>&times;</Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">

          <p className="text-slate-600">
            <strong>Employee:</strong> {employeeName}
          </p>

          {/* STEP 1: Break Selection (Check-Out Only) */}
          {action === 'out' && step === 1 && (
            <>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Did you take a break today?
                </label>
                <div className="space-y-2">
                  <button
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${breakMode === 'default' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setBreakMode('default'); }}
                  >
                    <div className="font-medium text-slate-800">✓ Default Break</div>
                    <div className="text-sm text-slate-600">{defaultBreak.label}</div>
                  </button>
                  
                  <button
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${breakMode === 'custom' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setBreakMode('custom'); }}
                  >
                    <div className="font-medium text-slate-800">⏰ Custom Break</div>
                    <div className="text-sm text-slate-600">Set your own break times {userTimezone === 'Asia/Karachi' ? '(9 AM - 6 PM)' : ''}</div>
                  </button>
                  
                  <button
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${breakMode === 'none' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setBreakMode('none'); }}
                  >
                    <div className="font-medium text-slate-800">⊘ No Break</div>
                    <div className="text-sm text-slate-600">I didn't take a break today</div>
                  </button>
                </div>
              </div>

              {breakMode === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Break Start {userTimezone === 'Asia/Karachi' ? '(9:00 AM - 6:00 PM)' : ''}</label>
                    <TimePicker
                      value={customBreakStart}
                      onChange={(newValue) => {
                        setCustomBreakStart(newValue);
                      }}
                      slotProps={{ textField: { fullWidth: true } }}
                      minTime={userTimezone === 'Asia/Karachi' ? dayjs().set('hour', 9).set('minute', 0) : undefined}
                      maxTime={userTimezone === 'Asia/Karachi' ? dayjs().set('hour', 18).set('minute', 0) : undefined}
                      timezone={timezone || employee.user?.timezone || 'Asia/Karachi'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Break End {userTimezone === 'Asia/Karachi' ? '(9:00 AM - 6:00 PM)' : ''}</label>
                    <TimePicker
                      value={customBreakEnd}
                      onChange={(newValue) => {
                        setCustomBreakEnd(newValue);
                      }}
                      slotProps={{ textField: { fullWidth: true } }}
                      minTime={dayjs().set('hour', 9).set('minute', 0)}
                      maxTime={dayjs().set('hour', 18).set('minute', 0)}
                      timezone={timezone || employee.user?.timezone || 'Asia/Karachi'}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 1: Location Selection (Check-In Only) */}
          {action === 'in' && step === 1 && (
            <>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Where are you working from today?
                </label>
                <div className="space-y-2">
                  <button
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${location === 'Office' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setLocation('Office'); }}
                  >
                    <div className="font-medium text-slate-800">🏢 Office</div>
                    <div className="text-sm text-slate-600">Working from the office</div>
                  </button>
                  
                  <button
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${location === 'Home' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setLocation('Home'); }}
                  >
                    <div className="font-medium text-slate-800">🏠 Home</div>
                    <div className="text-sm text-slate-600">Working from home</div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Time Selection (Check-In or Check-Out Step 2) */}
          {(action === 'in' && step === 2 || action === 'out' && step === 2) && (
            <>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Select {action === 'in' ? 'Check-In' : 'Check-Out'} Time
                </label>
                <div className="space-y-2">
                  <button
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${timeMode === 'now' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setTimeMode('now'); }}
                  >
                    <div className="font-medium text-slate-800">⏱️ Current Time</div>
                    <div className="text-sm text-slate-600">{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: timezone || employee.user?.timezone || 'Asia/Karachi' })}</div>
                  </button>
                  
                  <button
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${timeMode === 'custom' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setTimeMode('custom'); }}
                  >
                    <div className="font-medium text-slate-800">🕐 Custom Time</div>
                    <div className="text-sm text-slate-600">Select a specific time (today only)</div>
                  </button>
                </div>
              </div>

              {timeMode === 'custom' && (
                <div className="mt-4">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <div className="p-2 bg-slate-100 border border-slate-200 rounded text-slate-600">
                      {new Date().toLocaleDateString('en-US', { timeZone: timezone || employee.user?.timezone || 'Asia/Karachi' })}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Time</label>
                    <TimePicker
                      value={customTime}
                      onChange={(newValue) => {
                        setCustomTime(newValue);
                      }}
                      slotProps={{ textField: { fullWidth: true } }}
                      timezone={timezone || employee.user?.timezone || 'Asia/Karachi'}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Time must be for today and not in the future</p>
                </div>
              )}
            </>
          )}


        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 sticky bottom-0">
          {action === 'in' && step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={loading}>
                Next: Select Time →
              </Button>
            </>
          ) : action === 'out' && step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button onClick={handleBreakNext} disabled={loading}>
                Next: Select Time →
              </Button>
            </>
          ) : (
            <>
              {step === 2 && (
                <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                  ← Back
                </Button>
              )}
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading} isLoading={loading}>
                {loading ? 'Processing...' : `Confirm ${action === 'in' ? 'Check-In' : 'Check-Out'}`}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClockActionModal;
