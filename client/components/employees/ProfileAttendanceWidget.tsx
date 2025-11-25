import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { api } from '../../services/apiService';
import { AttendanceRecord, Employee } from '../../types';
import ClockActionModal from '../attendance/ClockActionModal';
import { useAppContext } from '../../contexts/AppContext';
import ResolveMissingClockOutModal from '../attendance/ResolveMissingClockOutModal';
import { toast } from 'sonner';


const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

interface ProfileAttendanceWidgetProps {
  employee: Employee;
}

const ProfileAttendanceWidget: React.FC<ProfileAttendanceWidgetProps> = ({ employee }) => {
    const { attendance, performClockAction } = useAppContext();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'in' | 'out'>('in');
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);


    const fetchTodayRecord = useCallback(async () => {
        setLoading(true);
        const record = await api.getTodayAttendanceForEmployee(employee.id);
        setTodayRecord(record);
        setLoading(false);
    }, [employee.id]);

    useEffect(() => {
        fetchTodayRecord();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [fetchTodayRecord]);

    const today = useMemo(() => new Date().toISOString().split('T')[0], []);
    
    const recordToFix = useMemo(() => 
        attendance.find(a => 
            a.employeeId === parseInt(employee.id) && 
            a.clockIn && 
            !a.clockOut && 
            a.date !== today
        ), [attendance, employee.id, today]);

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
      fetchTodayRecord(); // Refresh data after modal closes
    };

    const canClockIn = !todayRecord?.clockIn;
    const canClockOut = todayRecord?.clockIn && !todayRecord.clockOut;

    return (
        <>
            <Card title="My Attendance Today">
                <div className="flex flex-col items-center space-y-4">
                    <ClockIcon />
                    <p className="text-4xl font-mono font-bold text-slate-800">
                        {currentTime.toLocaleTimeString('en-US')}
                    </p>
                    <div className="text-center text-slate-600 h-10">
                        {loading && <p>Updating...</p>}
                        {!loading && todayRecord?.clockIn && <p>Clocked In: {new Date(`1970-01-01T${todayRecord.clockIn}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>}
                        {!loading && todayRecord?.clockOut && <p>Clocked Out: {new Date(`1970-01-01T${todayRecord.clockOut}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>}
                        {!loading && !todayRecord && <p>Not clocked in yet.</p>}
                    </div>
                    <div className="flex space-x-4">
                        <Button onClick={handleClockInClick} disabled={!canClockIn || loading} variant="success">
                            Clock In
                        </Button>
                        <Button onClick={() => openModal('out')} disabled={!canClockOut || loading} variant="danger">
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
                        toast.success(modalAction === 'in' ? 'Clocked in successfully!' : 'Clocked out successfully!');
                        closeModal();
                    }}
                />
            )}
            {recordToFix && isResolveModalOpen && (
                <ResolveMissingClockOutModal
                    isOpen={isResolveModalOpen}
                    onClose={() => setIsResolveModalOpen(false)}
                    record={recordToFix}
                    onSuccess={async () => {
                        const today = new Date().toISOString().split('T')[0];
                        await performClockAction(employee.employeeId, 'in', undefined, undefined, undefined, today);
                        toast.success('Missing clock-out resolved and clocked in!');
                    }}
                />
            )}
        </>
    );
};

export default ProfileAttendanceWidget;