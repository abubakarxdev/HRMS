import React, { useState } from 'react';
import { AttendanceRecord } from '../../types';
import { useFixMissingClockOut } from '../../hooks/useAttendance';
import Button from '../ui/Button';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';

interface ResolveMissingClockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord;
  onSuccess?: () => Promise<void> | void;
}

const ResolveMissingClockOutModal: React.FC<ResolveMissingClockOutModalProps> = ({ isOpen, onClose, record, onSuccess }) => {
  const { mutateAsync: fixMissingClockOut, isPending: loading } = useFixMissingClockOut();
  
  // Time selection
  const [clockOutTime, setClockOutTime] = useState<Dayjs | null>(null);
  const [breakStartTime, setBreakStartTime] = useState<Dayjs | null>(null);
  const [breakEndTime, setBreakEndTime] = useState<Dayjs | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'warning' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!isOpen) return null;

  // Get the date of the missing record
  const recordDate = new Date(record.date);

  // Find the open session to get clockIn time
  const openSession = record.sessions?.find(s => !s.checkOutTime);
  const clockInTime = openSession?.checkInTime ? new Date(openSession.checkInTime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '';

  const validateTime = (time: Dayjs | null): boolean => {
    if (!time) {
      showToast('Please select a clock-out time.', 'warning');
      return false;
    }
    
    const outHours = time.hour();
    const outMinutes = time.minute();
    
    // Ensure clock-out is after clock-in
    if (clockInTime) {
      const [inHours, inMinutes] = clockInTime.split(':').map(Number);
      
      const outTotalMinutes = outHours * 60 + outMinutes;
      const inTotalMinutes = inHours * 60 + inMinutes;
      
      if (outTotalMinutes <= inTotalMinutes) {
        showToast('Clock out time must be after clock in time.', 'warning');
        return false;
      }

      // Validate break times if provided
      if (breakStartTime || breakEndTime) {
          if (!breakStartTime || !breakEndTime) {
              showToast('Both break start and end times are required if adding a break.', 'warning');
              return false;
          }

          const bStartH = breakStartTime.hour();
          const bStartM = breakStartTime.minute();
          const bEndH = breakEndTime.hour();
          const bEndM = breakEndTime.minute();

          const bStartTotal = bStartH * 60 + bStartM;
          const bEndTotal = bEndH * 60 + bEndM;

          if (bStartTotal <= inTotalMinutes) {
              showToast('Break start must be after clock in.', 'warning');
              return false;
          }
          if (bEndTotal <= bStartTotal) {
              showToast('Break end must be after break start.', 'warning');
              return false;
          }
          if (outTotalMinutes <= bEndTotal) {
              showToast('Clock out must be after break end.', 'warning');
              return false;
          }
      }
    }
    
    setToast(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateTime(clockOutTime)) {
      return;
    }
    
    setToast(null);

    try {
      // Prepare time payload (combine record date with selected time)
      if (!clockOutTime) return;
      
      const formatTimePayload = (time: Dayjs) => {
          const hours = time.hour();
          const minutes = time.minute();
          const dt = new Date(recordDate);
          dt.setHours(hours, minutes, 0, 0);
          return dt.toISOString();
      };

      const payload: any = {
        recordId: record.id,
        clockOutTime: formatTimePayload(clockOutTime),
      };

      if (breakStartTime && breakEndTime) {
          payload.breakStartTime = formatTimePayload(breakStartTime);
          payload.breakEndTime = formatTimePayload(breakEndTime);
      }

      await fixMissingClockOut(payload);
      
      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (e) {
      showToast('An unexpected error occurred.', 'error');
    }
  };

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
          <h3 className="text-lg font-semibold text-slate-800">Add Missing Clock-Out</h3>
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
            <p><strong>Clocked In at:</strong> {openSession?.checkInTime ? new Date(openSession.checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Unknown'}</p>
            <p className="text-yellow-700 mt-2">Please complete your clock-out for this day.</p>
          </div>

          <div className="border-t pt-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <div className="p-2 bg-slate-100 border border-slate-200 rounded text-slate-600">
                {recordDate.toLocaleDateString()}
              </div>
            </div>
            <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Clock-Out Time</label>
                <TimePicker
                  value={clockOutTime}
                  onChange={(newValue) => {
                    setClockOutTime(newValue);
                    if (toast) setToast(null);
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Break Start (Optional)</label>
                    <TimePicker
                      value={breakStartTime}
                      onChange={(newValue) => {
                        setBreakStartTime(newValue);
                        if (toast) setToast(null);
                      }}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Break End (Optional)</label>
                    <TimePicker
                      value={breakEndTime}
                      onChange={(newValue) => {
                        setBreakEndTime(newValue);
                        if (toast) setToast(null);
                      }}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                </div>
            </div>

            <p className="text-xs text-slate-500 mt-1 break-words">Must be after {clockInTime}</p>
          </div>

        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 sticky bottom-0">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading} isLoading={loading}>
              {loading ? 'Saving...' : 'Save Clock-Out'}
            </Button>
        </div>
      </div>
    </div>
  );
};
export default ResolveMissingClockOutModal;