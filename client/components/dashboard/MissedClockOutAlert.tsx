import React from 'react';
import { AttendanceRecord } from '../../types';
import Button from '../ui/Button';

interface MissedClockOutAlertProps {
  record: AttendanceRecord;
  onResolve: () => void;
}

const MissedClockOutAlert: React.FC<MissedClockOutAlertProps> = ({ record, onResolve }) => {
  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md shadow-sm" role="alert">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-bold">Action Required</p>
          <p>
            You have a missing clock-out for{' '}
            <strong>{new Date(record.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>. 
            Please resolve this to ensure your records are accurate.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onResolve}>
          Resolve Now
        </Button>
      </div>
    </div>
  );
};

export default MissedClockOutAlert;
