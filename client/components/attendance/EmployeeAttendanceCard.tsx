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
  
  const recordToFix = undefined; // Legacy fix logic disabled for now


  useEffect(() => {
    // Legacy calculateHours removed


    const calculateAllHours = () => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        let liveHoursToday = 0;
        if (todayRecord) {
            // Use totalHours from backend if available (for closed records) or calculate from sessions
            if (todayRecord.totalHours) {
                liveHoursToday = todayRecord.totalHours;
            }
            
            // If there are sessions, calculate live time for open sessions
            if (todayRecord.sessions) {
                let sessionHours = 0;
                todayRecord.sessions.forEach(session => {
                    if (session.checkOut) {
                        const start = new Date(session.checkIn).getTime();
                        const end = new Date(session.checkOut).getTime();
                        sessionHours += (end - start) / (1000 * 60 * 60);
                    } else {
                        // Open session
                        const start = new Date(session.checkIn).getTime();
                        const end = now.getTime();
                        sessionHours += (end - start) / (1000 * 60 * 60);
                    }
                });
                // Use calculated session hours if it's more accurate (e.g. live update)
                liveHoursToday = sessionHours;
            } else {
                 // Fallback or no data
                 liveHoursToday = 0;
            }
        }

        const startOfWeek = new Date(now);
        startOfWeek.setHours(0,0,0,0);
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const pastRecords = attendance.filter(r => r.employeeId === employee.id && r.date !== todayStr);

        const completedHoursWeek = pastRecords
            .filter(r => new Date(r.date + 'T00:00:00') >= startOfWeek)
            .reduce((acc, r) => acc + (r.totalHours || 0), 0);
            
        const completedHoursMonth = pastRecords
            .filter(r => new Date(r.date + 'T00:00:00') >= startOfMonth)
            .reduce((acc, r) => acc + (r.totalHours || 0), 0);
        
        setWorkedHours({
            today: liveHoursToday > 0 ? liveHoursToday.toFixed(2) : '0.00',
            week: (completedHoursWeek + liveHoursToday).toFixed(2),
            month: (completedHoursMonth + liveHoursToday).toFixed(2),
        });
    };

    calculateAllHours();

    const isClockedIn = todayRecord?.sessions?.some(s => !s.checkOut);

    if (isClockedIn) {
        const interval = setInterval(calculateAllHours, 60000);
        return () => clearInterval(interval);
    }
  }, [attendance, todayRecord, employee.id]);

  const getStatus = (): { text: string; color: string } => {
    if (todayRecord?.status === 'On Leave') {
        return { text: 'On Leave', color: 'text-yellow-600' };
    }
    // Check for open session
    if (todayRecord?.sessions?.some(s => !s.checkOut)) {
        return { text: 'Present', color: 'text-green-600' };
    }
    // Fallback for legacy
    // Removed legacy checks
    
    if (todayRecord?.sessions?.length > 0 && todayRecord.sessions.every(s => s.checkOut)) {
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
                <p>Checked in</p>
            </>
            )}
            {statusText === 'Checked Out' && (
            <>
                <p>Checked out</p>
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