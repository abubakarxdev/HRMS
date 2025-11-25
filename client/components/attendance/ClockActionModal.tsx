import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Button from '../ui/Button';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';

interface ClockActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  action: 'in' | 'out';
  todayRecord?: AttendanceRecord;
  onSuccess?: () => void;
}

const ClockActionModal: React.FC<ClockActionModalProps> = ({ isOpen, onClose, employee, action, todayRecord, onSuccess }) => {
  const { performClockAction } = useAppContext();
  
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
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'warning' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!isOpen) return null;

  // Get day-based default break times
  const getDefaultBreakTimes = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { start: '', end: '', label: 'Weekend - No default break' };
    } else if (dayOfWeek === 5) {
      return { start: '13:00', end: '14:30', label: 'Friday: 1:00 PM - 2:30 PM' };
    } else {
      return { start: '13:00', end: '14:00', label: 'Mon-Thu: 1:00 PM - 2:00 PM' };
    }
  };

  const defaultBreak = useMemo(() => getDefaultBreakTimes(), []);

  const validateTime = (time: Dayjs | null): boolean => {
    if (!time) {
      showToast('Please select a time.', 'warning');
      return false;
    }

    const now = new Date();
    const hours = time.hour();
    const minutes = time.minute();
    const selectedTime = new Date();
    selectedTime.setHours(hours, minutes, 0, 0);

    // Cannot be in the future (allow 2 minute buffer for clock drift/fast fingers)
    const bufferTime = new Date(now.getTime() + 2 * 60000);
    
    if (selectedTime > bufferTime) {
      showToast('Cannot select a future time.', 'warning');
      return false;
    }

    // For check-out, must be after check-in
    if (action === 'out' && todayRecord?.sessions) {
      const currentSession = todayRecord.sessions.find(s => !s.checkOut && s.type === 'WORK');
      if (currentSession?.checkIn) {
        const checkInDate = new Date(currentSession.checkIn);
        // Allow check-out in the same minute (rare but possible)
        if (selectedTime < checkInDate) {
          showToast('Clock out time must be after clock in time.', 'warning');
          return false;
        }
      }

      // Validate Check-out > Break End
      const { end: breakEnd } = getBreakTimes();
      if (breakEnd) {
        const [endHour, endMin] = breakEnd.split(':').map(Number);
        const breakEndDate = new Date();
        breakEndDate.setHours(endHour, endMin, 0, 0);

        if (selectedTime <= breakEndDate) {
          showToast(`Clock out time must be after break end time (${breakEnd}).`, 'warning');
          return false;
        }
      }
    }
    
    setToast(null);
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
      showToast('Please select both break start and end times.', 'warning');
      return false;
    }

    const [startHour, startMin] = breakStart.split(':').map(Number);
    const [endHour, endMin] = breakEnd.split(':').map(Number);

    // Validate 9 AM - 6 PM range
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = endHour * 60 + endMin;
    const nineAmMinutes = 9 * 60;
    const sixPmMinutes = 18 * 60;

    if (startTotalMinutes < nineAmMinutes || startTotalMinutes >= sixPmMinutes) {
      showToast('Break start time must be between 9:00 AM and 6:00 PM.', 'warning');
      return false;
    }

    if (endTotalMinutes <= nineAmMinutes || endTotalMinutes > sixPmMinutes) {
      showToast('Break end time must be between 9:00 AM and 6:00 PM.', 'warning');
      return false;
    }

    // End must be after start
    if (endTotalMinutes <= startTotalMinutes) {
      showToast('Break end time must be after break start time.', 'warning');
      return false;
    }

    // Duration: 15 min - 2 hours
    const breakDuration = (endTotalMinutes - startTotalMinutes) / 60;
    if (breakDuration < 0.25 || breakDuration > 2) {
      showToast('Break duration must be between 15 minutes and 2 hours.', 'warning');
      return false;
    }

    // Validate Break Start > Check-in Time
    if (todayRecord?.sessions) {
      const currentSession = todayRecord.sessions.find(s => !s.checkOut && s.type === 'WORK');
      if (currentSession?.checkIn) {
        const checkInDate = new Date(currentSession.checkIn);
        const breakStartDate = new Date();
        breakStartDate.setHours(startHour, startMin, 0, 0);

        if (breakStartDate <= checkInDate) {
          showToast(`Break start time (${breakStart}) must be after check-in time (${checkInDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}).`, 'warning');
          return false;
        }
      }
    }

    setToast(null);
    return true;
  };

  const handleBreakNext = () => {
    if (!validateBreakTimes()) return;
    setStep(2); // Move to time selection
  };

  const handleSubmit = async () => {
    // Validate time
    const timeToUse = timeMode === 'now' ? undefined : customTime;
    if (timeMode === 'custom' && !validateTime(customTime)) {
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      // Prepare time payload
      let timePayload = undefined;
      if (timeMode === 'custom' && customTime) {
        const now = new Date();
        const hours = customTime.hour();
        const minutes = customTime.minute();
        const dateWithTime = new Date(now);
        dateWithTime.setHours(hours, minutes, 0, 0);
        timePayload = dateWithTime.toISOString();
      }

      if (action === 'in') {
        // Pass today's date to ensure record is created for the correct local day
        // Use local date (en-CA gives YYYY-MM-DD) instead of UTC
        const today = new Date().toLocaleDateString('en-CA');
        await performClockAction(employee.employeeId, 'in', timePayload, undefined, undefined, today, location);
      } else {
        // For check-out, include break times
        let breakStart = breakMode === 'default' ? defaultBreak.start : (breakMode === 'custom' && customBreakStart ? customBreakStart.format('HH:mm') : undefined);
        let breakEnd = breakMode === 'default' ? defaultBreak.end : (breakMode === 'custom' && customBreakEnd ? customBreakEnd.format('HH:mm') : undefined);
        
        const today = new Date().toLocaleDateString('en-CA');
        await performClockAction(employee.employeeId, 'out', timePayload, breakStart, breakEnd, today);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (e: any) {
      // Extract the specific error message from the API response
      const errorMessage = e?.response?.data?.error || e?.message || 'An error occurred. Please try again.';
      
      // Determine toast type based on HTTP status code
      // 400 = validation error (warning), 500+ = server error (error)
      const toastType = e?.response?.status === 400 ? 'warning' : 'error';
      
      showToast(errorMessage, toastType);
    } finally {
      setLoading(false);
    }
  };

  const title = action === 'in' ? (step === 1 ? 'Select Location' : 'Clock In') : (step === 1 ? 'Select Break Time' : 'Clock Out');

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
          {toast && (
            <div className={`p-4 rounded-md border-l-4 shadow-sm mb-4 ${
              toast.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 
              toast.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 
              'bg-green-50 border-green-500 text-green-700'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {toast.type === 'warning' && <span className="text-xl">⚠️</span>}
                  {toast.type === 'error' && <span className="text-xl">❌</span>}
                  {toast.type === 'success' && <span className="text-xl">✅</span>}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-bold">
                    {toast.type === 'error' ? 'Error' : toast.type === 'warning' ? 'Warning' : 'Success'}
                  </p>
                  <p className="text-sm mt-1">
                    {toast.message}
                  </p>
                </div>
              </div>
            </div>
          )}
          <p className="text-slate-600">
            <strong>Employee:</strong> {employee.name}
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
                    onClick={() => { setBreakMode('default'); setToast(null); }}
                  >
                    <div className="font-medium text-slate-800">✓ Default Break</div>
                    <div className="text-sm text-slate-600">{defaultBreak.label}</div>
                  </button>
                  
                  <button
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${breakMode === 'custom' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setBreakMode('custom'); setToast(null); }}
                  >
                    <div className="font-medium text-slate-800">⏰ Custom Break</div>
                    <div className="text-sm text-slate-600">Set your own break times (9 AM - 6 PM)</div>
                  </button>
                  
                  <button
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${breakMode === 'none' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setBreakMode('none'); setToast(null); }}
                  >
                    <div className="font-medium text-slate-800">⊘ No Break</div>
                    <div className="text-sm text-slate-600">I didn't take a break today</div>
                  </button>
                </div>
              </div>

              {breakMode === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Break Start (9:00 AM - 6:00 PM)</label>
                    <TimePicker
                      value={customBreakStart}
                      onChange={(newValue) => {
                        setCustomBreakStart(newValue);
                        if (toast) setToast(null);
                      }}
                      slotProps={{ textField: { fullWidth: true } }}
                      minTime={dayjs().set('hour', 9).set('minute', 0)}
                      maxTime={dayjs().set('hour', 18).set('minute', 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Break End (9:00 AM - 6:00 PM)</label>
                    <TimePicker
                      value={customBreakEnd}
                      onChange={(newValue) => {
                        setCustomBreakEnd(newValue);
                        if (toast) setToast(null);
                      }}
                      slotProps={{ textField: { fullWidth: true } }}
                      minTime={dayjs().set('hour', 9).set('minute', 0)}
                      maxTime={dayjs().set('hour', 18).set('minute', 0)}
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
                    onClick={() => { setLocation('Office'); setToast(null); }}
                  >
                    <div className="font-medium text-slate-800">🏢 Office</div>
                    <div className="text-sm text-slate-600">Working from the office</div>
                  </button>
                  
                  <button
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${location === 'Home' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setLocation('Home'); setToast(null); }}
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
                    onClick={() => { setTimeMode('now'); setToast(null); }}
                  >
                    <div className="font-medium text-slate-800">⏱️ Current Time</div>
                    <div className="text-sm text-slate-600">{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                  </button>
                  
                  <button
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${timeMode === 'custom' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setTimeMode('custom'); setToast(null); }}
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
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Time</label>
                    <TimePicker
                      value={customTime}
                      onChange={(newValue) => {
                        setCustomTime(newValue);
                        if (toast) setToast(null);
                      }}
                      slotProps={{ textField: { fullWidth: true } }}
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