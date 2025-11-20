import React, { useState } from 'react';
import { Employee, AttendanceRecord } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface ClockActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  action: 'in' | 'out';
  todayRecord?: AttendanceRecord;
}

const ClockActionModal: React.FC<ClockActionModalProps> = ({ isOpen, onClose, employee, action, todayRecord }) => {
  const { performClockAction } = useAppContext();
  const [mode, setMode] = useState<'now' | 'custom'>('now');
  const [customTime, setCustomTime] = useState('');
  const [breakHours, setBreakHours] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const title = action === 'in' ? 'Clock In' : 'Clock Out';
  const employeeName = employee.name;

  const validateTime = (time: string): boolean => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const selectedTime = new Date();
    selectedTime.setHours(hours, minutes, 0, 0);

    if (selectedTime > now) {
      setError('Cannot select a future time.');
      return false;
    }

    if (action === 'out' && todayRecord?.clockIn) {
      const [inHours, inMinutes] = todayRecord.clockIn.split(':').map(Number);
      const clockInTime = new Date();
      clockInTime.setHours(inHours, inMinutes, 0, 0);
      if (selectedTime <= clockInTime) {
        setError('Clock out time must be after clock in time.');
        return false;
      }
    }
    setError('');
    return true;
  }

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    let timeToSubmit: string | undefined = undefined;
    let breakHoursToSubmit: number | undefined = undefined;

    if (mode === 'custom') {
      if (!customTime) {
        setLoading(false);
        setError('Please select a time.');
        return;
      }
      if (!validateTime(customTime)) {
        setLoading(false);
        return;
      }
      timeToSubmit = customTime;
    }

    if (action === 'out') {
      const parsedBreaks = parseFloat(breakHours);
      if (!isNaN(parsedBreaks) && parsedBreaks >= 0) {
        breakHoursToSubmit = parsedBreaks;
      } else if (breakHours) {
        setError('Please enter a valid number for break hours.');
        setLoading(false);
        return;
      }
    }

    try {
      await performClockAction(employee.id, action, timeToSubmit, breakHoursToSubmit);
      onClose();
    } catch (e) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">{title} for {employeeName}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>&times;</Button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button
              className={`flex-1 p-2 rounded text-sm font-medium transition-all ${mode === 'now' ? 'bg-white shadow' : 'text-slate-600'}`}
              onClick={() => { setMode('now'); setError(''); }}
            >
              Now
            </button>
            <button
              className={`flex-1 p-2 rounded text-sm font-medium transition-all ${mode === 'custom' ? 'bg-white shadow' : 'text-slate-600'}`}
              onClick={() => { setMode('custom'); setError(''); }}
            >
              Custom Time
            </button>
          </div>

          {mode === 'now' && action === 'in' && (
            <div className="text-center p-4 bg-slate-50 rounded-md">
              <p className="text-slate-600">Current Time</p>
              <p className="text-3xl font-mono font-bold text-slate-800">{new Date().toLocaleTimeString('en-US')}</p>
            </div>
          )}

          {mode === 'custom' && (
            <div>
              <Input
                label="Select a time for today"
                type="time"
                value={customTime}
                onChange={e => {
                  setCustomTime(e.target.value);
                  if (error) validateTime(e.target.value);
                }}
              />
            </div>
          )}

          {action === 'out' && (
            <div>
              <Input
                label="Break Duration in Hours (optional)"
                type="number"
                step="0.25"
                min="0"
                placeholder="e.g., 0.5 for 30 mins"
                value={breakHours}
                onChange={e => setBreakHours(e.target.value)}
              />
            </div>
          )}
          
          {error && <p className="text-sm text-red-600 text-center pt-2">{error}</p>}

        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : `Confirm ${title}`}</Button>
        </div>
      </div>
    </div>
  );
};
export default ClockActionModal;