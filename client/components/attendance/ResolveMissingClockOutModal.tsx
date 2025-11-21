import React, { useState, useMemo } from 'react';
import { AttendanceRecord } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface ResolveMissingClockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord;
  onSuccess?: () => Promise<void>;
}

const ResolveMissingClockOutModal: React.FC<ResolveMissingClockOutModalProps> = ({ isOpen, onClose, record, onSuccess }) => {
  const { fixMissingClockOut } = useAppContext();
  
  // Step management (1 = break selection, 2 = time selection)
  const [step, setStep] = useState<1 | 2>(1);
  
  // Time selection
  const [clockOutTime, setClockOutTime] = useState('');
  
  // Break selection
  const [breakMode, setBreakMode] = useState<'default' | 'custom' | 'none'>('default');
  const [customBreakStart, setCustomBreakStart] = useState('');
  const [customBreakEnd, setCustomBreakEnd] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'warning' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!isOpen) return null;

  // Get the date of the missing record
  const recordDate = new Date(record.date);
  const recordDayOfWeek = recordDate.getDay();

  // Find the open session to get clockIn time
  const openSession = record.sessions?.find(s => !s.checkOut);
  const clockInTime = openSession?.checkIn ? new Date(openSession.checkIn).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '';

  // Get day-based default break times for the missing record's day
  const getDefaultBreakTimes = () => {
    if (recordDayOfWeek === 0 || recordDayOfWeek === 6) {
      return { start: '', end: '', label: 'Weekend - No default break' };
    } else if (recordDayOfWeek === 5) {
      return { start: '13:00', end: '14:30', label: 'Friday: 1:00 PM - 2:30 PM' };
    } else {
      return { start: '13:00', end: '14:00', label: 'Mon-Thu: 1:00 PM - 2:00 PM' };
    }
  };

  const defaultBreak = useMemo(() => getDefaultBreakTimes(), [recordDayOfWeek]);

  const validateTime = (time: string): boolean => {
    if (!time) {
      showToast('Please select a time.', 'warning');
      return false;
    }
    
    const [outHours, outMinutes] = time.split(':').map(Number);
    
    // Ensure clock-out is after clock-in
    if (clockInTime) {
      const [inHours, inMinutes] = clockInTime.split(':').map(Number);
      
      const outTotalMinutes = outHours * 60 + outMinutes;
      const inTotalMinutes = inHours * 60 + inMinutes;
      
      if (outTotalMinutes <= inTotalMinutes) {
        showToast('Clock out time must be after clock in time.', 'warning');
        return false;
      }
    }
    
    setToast(null);
    return true;
  };

  const validateBreakTimes = (): boolean => {
    if (breakMode === 'none') return true;
    
    let breakStart = breakMode === 'default' ? defaultBreak.start : customBreakStart;
    let breakEnd = breakMode === 'default' ? defaultBreak.end : customBreakEnd;

    if (!breakStart || !breakEnd) {
      showToast('Please select both break start and end times.', 'warning');
      return false;
    }

    const [startHour, startMin] = breakStart.split(':').map(Number);
    const [endHour, endMin] = breakEnd.split(':').map(Number);

    // Validate 9 AM - 6 PM range
    // Start: 9:00 - 17:59
    // End: 9:01 - 18:00
    
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

    // Validate break end is after break start
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      showToast('Break end time must be after break start time.', 'warning');
      return false;
    }

    // Validate reasonable break duration (15 min - 2 hours)
    const breakDuration = (endMinutes - startMinutes) / 60;
    if (breakDuration < 0.25 || breakDuration > 2) {
      showToast('Break duration must be between 15 minutes and 2 hours.', 'warning');
      return false;
    }

    setToast(null);
    return true;
  };

  const handleBreakNext = () => {
    if (!validateBreakTimes()) return;
    setStep(2); // Move to time selection
  };

  const handleSubmit = async () => {
    if (!validateTime(clockOutTime)) {
      return;
    }
    
    setLoading(true);
    setToast(null);

    try {
      // Prepare break data
      let breakStart = breakMode === 'default' ? defaultBreak.start : (breakMode === 'custom' ? customBreakStart : undefined);
      let breakEnd = breakMode === 'default' ? defaultBreak.end : (breakMode === 'custom' ? customBreakEnd : undefined);

      // Prepare time payload (combine record date with selected time)
      const [hours, minutes] = clockOutTime.split(':').map(Number);
      const clockOutDateTime = new Date(recordDate);
      clockOutDateTime.setHours(hours, minutes, 0, 0);
      const timePayload = clockOutDateTime.toISOString();

      await fixMissingClockOut(record.id, timePayload, breakStart, breakEnd);
      
      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (e) {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const title = step === 1 ? 'Select Break Time' : 'Add Missing Clock-Out';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>&times;</Button>
        </div>
        
        <div className="p-6 space-y-4">
          {toast && (
            <div className={`p-3 rounded-md border ${
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 
              toast.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 
              'bg-green-50 border-green-200 text-green-600'
            }`}>
              <p className="text-sm font-medium flex items-center">
                {toast.type === 'warning' && <span className="mr-2">⚠️</span>}
                {toast.type === 'error' && <span className="mr-2">❌</span>}
                {toast.message}
              </p>
            </div>
          )}
          {/* Warning Banner */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
            <p className="font-medium text-yellow-800 mb-1">⚠️ Missing Clock-Out Detected</p>
            <p><strong>Date:</strong> {recordDate.toLocaleDateString()}</p>
            <p><strong>Clocked In at:</strong> {openSession?.checkIn ? new Date(openSession.checkIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Unknown'}</p>
            <p className="text-yellow-700 mt-2">Please complete your clock-out for this day.</p>
          </div>

          {/* STEP 1: Break Selection */}
          {step === 1 && (
            <>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Did you take a break on {recordDate.toLocaleDateString()}?
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
                    <div className="text-sm text-slate-600">I didn't take a break that day</div>
                  </button>
                </div>
              </div>

              {breakMode === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    label="Break Start (9:00 AM - 6:00 PM)"
                    type="time"
                    min="09:00"
                    max="18:00"
                    value={customBreakStart}
                    onChange={e => {
                      setCustomBreakStart(e.target.value);
                      if (toast) setToast(null);
                    }}
                  />
                  <Input
                    label="Break End (9:00 AM - 6:00 PM)"
                    type="time"
                    min="09:00"
                    max="18:00"
                    value={customBreakEnd}
                    onChange={e => {
                      setCustomBreakEnd(e.target.value);
                      if (toast) setToast(null);
                    }}
                  />
                </div>
              )}
            </>
          )}

          {/* STEP 2: Time Selection */}
          {step === 2 && (
            <div className="border-t pt-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <div className="p-2 bg-slate-100 border border-slate-200 rounded text-slate-600">
                  {recordDate.toLocaleDateString()}
                </div>
              </div>
              <Input
                label="Clock-Out Time (HH:MM)"
                type="time"
                value={clockOutTime}
                onChange={e => {
                  setClockOutTime(e.target.value);
                  if (toast) setToast(null);
                }}
              />
              <p className="text-xs text-slate-500 mt-1 break-words">Must be after {clockInTime}</p>
            </div>
          )}


        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 sticky bottom-0">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button onClick={handleBreakNext} disabled={loading}>
                Next: Select Time →
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                ← Back
              </Button>
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading} isLoading={loading}>
                {loading ? 'Saving...' : 'Save Clock-Out'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default ResolveMissingClockOutModal;