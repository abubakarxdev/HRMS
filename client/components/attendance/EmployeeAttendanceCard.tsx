import React, { useState, useEffect, useMemo } from 'react';
import { Employee, AttendanceRecord, Role } from '../../types';
import Button from '../ui/Button';
import { useAppContext } from '../../contexts/AppContext';
import ClockActionModal from './ClockActionModal';
import ResolveMissingClockOutModal from './ResolveMissingClockOutModal';

interface EmployeeAttendanceCardProps {
  employee: Employee;
  todayRecord?: AttendanceRecord;
}

const EmployeeAttendanceCard: React.FC<EmployeeAttendanceCardProps> = ({ employee, todayRecord }) => {
  const { user, attendance, performClockAction } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'in' | 'out'>('in');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [workedHours, setWorkedHours] = useState({ today: '0.00', week: '0.00', month: '0.00' });

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const recordToFix = useMemo(() => 
      attendance.find(a => 
          a.employeeId === employee.id && 
          a.clockIn && 
          !a.clockOut && 
          a.date !== today
      ), [attendance, employee.id, today]);

  useEffect(() => {
    const calculateHours = (record: AttendanceRecord, endTime?: string): number => {
      if (!record.clockIn) return 0;
      const effectiveEndTime = endTime || record.clockOut;
      if (!effectiveEndTime) return 0;

      const start = new Date(`1970-01-01T${record.clockIn}`);
      const end = new Date(`1970-01-01T${effectiveEndTime}`);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return duration - (record.breakHours || 0);
    };

    const calculateAllHours = () => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        let liveHoursToday = 0;
        if (todayRecord) {
            if (todayRecord.clockIn && todayRecord.clockOut) {
                liveHoursToday = calculateHours(todayRecord);
            } else if (todayRecord.clockIn) {
                const currentTimeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                liveHoursToday = calculateHours(todayRecord, currentTimeStr);
            }
        }

        const startOfWeek = new Date(now);
        startOfWeek.setHours(0,0,0,0);
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const pastRecords = attendance.filter(r => r.employeeId === employee.id && r.clockIn && r.clockOut && r.date !== todayStr);

        const completedHoursWeek = pastRecords
            .filter(r => new Date(r.date + 'T00:00:00') >= startOfWeek)
            .reduce((acc, r) => acc + calculateHours(r), 0);
            
        const completedHoursMonth = pastRecords
            .filter(r => new Date(r.date + 'T00:00:00') >= startOfMonth)
            .reduce((acc, r) => acc + calculateHours(r), 0);
        
        setWorkedHours({
            today: liveHoursToday > 0 ? liveHoursToday.toFixed(2) : '0.00',
            week: (completedHoursWeek + liveHoursToday).toFixed(2),
            month: (completedHoursMonth + liveHoursToday).toFixed(2),
        });
    };

    calculateAllHours();

    const isClockedIn = !!(todayRecord?.clockIn && !todayRecord.clockOut);

    if (isClockedIn) {
        const interval = setInterval(calculateAllHours, 60000);
        return () => clearInterval(interval);
    }
  }, [attendance, todayRecord, employee.id]);

  const getStatus = (): { text: string; color: string } => {
    if (todayRecord?.status === 'On Leave') {
        return { text: 'On Leave', color: 'text-yellow-600' };
    }
    if (todayRecord?.clockIn && !todayRecord?.clockOut) {
      return { text: 'Present', color: 'text-green-600' };
    }
    if (todayRecord?.clockIn && todayRecord?.clockOut) {
      return { text: 'Checked Out', color: 'text-orange-600' };
    }
    return { text: 'Absent', color: 'text-red-600' };
  };

  const { text: statusText, color: statusColor } = getStatus();

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

  const closeModal = () => setIsModalOpen(false);
  const closeResolveModal = () => setIsResolveModalOpen(false);

  const isCurrentUser = user.employeeId === employee.id;
  const isPrivilegedUser = user.role === Role.ADMIN_HR || user.role === Role.MANAGER;
  
  const canClockIn = statusText === 'Absent' || statusText === 'Checked Out';
  const canClockOut = statusText === 'Present';

  const canPerformAction = isCurrentUser || isPrivilegedUser;

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col justify-between transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <div>
          <div className="flex justify-between items-start">
              <div>
                  <p className="font-bold text-base text-slate-800 truncate">{employee.name}</p>
                  <p className="text-xs text-slate-500 truncate">{employee.position}</p>
              </div>
              {isCurrentUser && (
                  <span className="text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">You</span>
              )}
          </div>

          <p className={`font-bold mt-3 text-lg ${statusColor}`}>{statusText}</p>
          <div className="text-xs text-slate-600 mt-1 font-mono">
            {statusText === 'Absent' && <p className="pt-1">No events today</p>}
            {statusText === 'On Leave' && <p className="pt-1">Scheduled leave</p>}
            {statusText === 'Present' && (
            <>
                <p>Checked in at: {todayRecord?.clockIn}</p>
                <p>Checked out at: &mdash;</p>
            </>
            )}
            {statusText === 'Checked Out' && (
            <>
                <p>Checked in at: {todayRecord?.clockIn}</p>
                <p>Checked out at: {todayRecord?.clockOut}</p>
            </>
            )}
          </div>

          <div className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                  <span>Today</span>
                  <span className="font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded">{workedHours.today} hrs</span>
              </div>
              <div className="flex justify-between items-center">
                  <span>This Week</span>
                  <span className="font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded">{workedHours.week} hrs</span>
              </div>
              <div className="flex justify-between items-center">
                  <span>This Month</span>
                  <span className="font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded">{workedHours.month} hrs</span>
              </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={handleClockInClick} disabled={!canClockIn || loading || !canPerformAction}>Clock In</Button>
            <Button size="sm" variant="outline" onClick={() => openModal('out')} disabled={!canClockOut || loading || !canPerformAction}>Clock Out</Button>
            <Button size="sm" variant="ghost" disabled>Add Break</Button>
        </div>
      </div>
      {isModalOpen && (
          <ClockActionModal
              isOpen={isModalOpen}
              onClose={closeModal}
              employee={employee}
              action={modalAction}
              todayRecord={todayRecord}
          />
      )}
      {recordToFix && isResolveModalOpen && (
          <ResolveMissingClockOutModal
              isOpen={isResolveModalOpen}
              onClose={closeResolveModal}
              record={recordToFix}
              onSuccess={isCurrentUser ? async () => {
                  setLoading(true);
                  await performClockAction(employee.id, 'in');
                  setLoading(false);
              } : undefined}
          />
      )}
    </>
  );
};

export default EmployeeAttendanceCard;