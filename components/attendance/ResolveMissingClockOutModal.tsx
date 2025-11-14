import React, { useState } from 'react';
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
  const [clockOutTime, setClockOutTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const validateTime = (time: string): boolean => {
    if (!time) {
      setError('Please select a time.');
      return false;
    }
    
    const [outHours, outMinutes] = time.split(':').map(Number);
    const clockOutDate = new Date();
    clockOutDate.setHours(outHours, outMinutes, 0, 0);

    if (record?.clockIn) {
      const [inHours, inMinutes] = record.clockIn.split(':').map(Number);
      const clockInDate = new Date();
      clockInDate.setHours(inHours, inMinutes, 0, 0);
      if (clockOutDate <= clockInDate) {
        setError('Clock out time must be after clock in time.');
        return false;
      }
    }
    setError('');
    return true;
  }

  const handleSubmit = async () => {
    if (!validateTime(clockOutTime)) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await fixMissingClockOut(record.id, clockOutTime);
      if (onSuccess) {
        await onSuccess();
      }
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
          <h3 className="text-lg font-semibold text-slate-800">Add Missing Clock-Out</h3>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>&times;</Button>
        </div>
        <div className="p-6 space-y-4">
            <div className="p-3 bg-slate-50 rounded-md text-sm">
                <p><strong>Date:</strong> {new Date(record.date + 'T00:00:00').toLocaleDateString()}</p>
                <p><strong>Clocked In at:</strong> {record.clockIn}</p>
            </div>
            <div>
                <Input
                    label="Enter your clock-out time"
                    type="time"
                    value={clockOutTime}
                    onChange={e => {
                        setClockOutTime(e.target.value);
                        if (error) validateTime(e.target.value);
                    }}
                />
            </div>
          
            {error && <p className="text-sm text-red-600 text-center pt-2">{error}</p>}

        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Save Clock-Out'}</Button>
        </div>
      </div>
    </div>
  );
};
export default ResolveMissingClockOutModal;