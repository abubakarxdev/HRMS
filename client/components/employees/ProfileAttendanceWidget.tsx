import React, { useState, useEffect, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Employee } from '../../types';
import ClockActionModal from '../attendance/ClockActionModal';
import { useTodayAttendance, useAttendanceRecords } from '../../hooks/useAttendance';
import ResolveMissingClockOutModal from '../attendance/ResolveMissingClockOutModal';

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

interface ProfileAttendanceWidgetProps {
  employee: Employee;
}

const ProfileAttendanceWidget: React.FC<ProfileAttendanceWidgetProps> = ({ employee }) => {
    const { data: todayRecord, isLoading: loadingToday } = useTodayAttendance(employee.id);
    const { data: allAttendance = [] } = useAttendanceRecords();
    
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'in' | 'out'>('in');
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const today = useMemo(() => new Date().toISOString().split('T')[0], []);
    
    const recordToFix = useMemo(() => {
        // Find record with missing checkout for this employee, excluding today
        return allAttendance.find(a => 
            a.employeeId === employee.id && 
            a.sessions?.some(s => !s.checkOutTime) && 
            a.date !== today
        );
    }, [allAttendance, employee.id, today]);

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
    
    const closeModal = () => {
      setIsModalOpen(false);
    };

    // Determine if clocked in based on sessions
    const activeSession = todayRecord?.sessions?.find(s => !s.checkOutTime);
    const isClockedIn = !!activeSession;

    const canClockIn = !isClockedIn;
    const canClockOut = isClockedIn;

    return (
        <>
            <Card title="My Attendance Today">
                <div className="flex flex-col items-center space-y-4">
                    <ClockIcon />
                    <p className="text-4xl font-mono font-bold text-slate-800">
                        {currentTime.toLocaleTimeString('en-US')}
                    </p>
                    <div className="text-center text-slate-600 h-10">
                        {loadingToday && <p>Updating...</p>}
                        {!loadingToday && isClockedIn && <p>Clocked In: {new Date(activeSession!.checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>}
                        {!loadingToday && !isClockedIn && todayRecord?.sessions?.length && <p>Clocked Out: {new Date(todayRecord.sessions[todayRecord.sessions.length - 1].checkOutTime!).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>}
                        {!loadingToday && !todayRecord && <p>Not clocked in yet.</p>}
                    </div>
                    <div className="flex space-x-4">
                        <Button onClick={handleClockInClick} disabled={!canClockIn || loadingToday} variant="success">
                            Clock In
                        </Button>
                        <Button onClick={() => openModal('out')} disabled={!canClockOut || loadingToday} variant="danger">
                            Clock Out
                        </Button>
                    </div>
                </div>
            </Card>
            {isModalOpen && (
                <ClockActionModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    employee={employee}
                    action={modalAction}
                    todayRecord={todayRecord || undefined}
                    onSuccess={() => {
                        closeModal();
                    }}
                />
            )}
            {recordToFix && isResolveModalOpen && (
                <ResolveMissingClockOutModal
                    isOpen={isResolveModalOpen}
                    onClose={() => setIsResolveModalOpen(false)}
                    record={recordToFix}
                    onSuccess={() => {
                        setIsResolveModalOpen(false);
                    }}
                />
            )}
        </>
    );
};

export default ProfileAttendanceWidget;