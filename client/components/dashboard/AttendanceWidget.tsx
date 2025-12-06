import React, { useState, useEffect, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useEmployees } from '../../hooks/useEmployees';
import { useTodayAttendance, useAttendanceRecords, useEmployeeAttendance } from '../../hooks/useAttendance';
import ClockActionModal from '../attendance/ClockActionModal';
import ResolveMissingClockOutModal from '../attendance/ResolveMissingClockOutModal';
import { toast } from 'sonner';

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const AttendanceWidget: React.FC = () => {
    const { user } = useAuth();
    console.log('AttendanceWidget user:', user, 'Timezone:', user?.timezone);
    const { data: employees = [] } = useEmployees();
    const { data: todayRecord, isLoading: loadingToday } = useTodayAttendance(user?.employeeId || '');
    const { data: historyResponse } = useEmployeeAttendance(user?.employeeId || '', undefined, undefined, undefined, 1, 50);
    const allAttendance = historyResponse?.data || [];
    
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'in' | 'out'>('in');
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

    const currentUserEmployee = employees.find(e => e.id === user?.employeeId);
    
    // Use timezone from auth user (token) as it's the source of truth for the current session
    // This matches TeamSnapshot logic which is working correctly
    const userTimezone = user?.timezone || 'Asia/Karachi';

    console.log("AttendanceWidget userTimezone:", userTimezone);

    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const recordToFix = useMemo(() => {
        if (!user?.employeeId) return undefined;
        // Check for any record where checkIn exists but checkOut is missing, and it's not today
        // Note: The API/Types might have changed from clockIn/clockOut to sessions or similar. 
        // Assuming the hook returns records with sessions.
        // If the hook returns flattened records with clockIn/clockOut, we use that.
        // Based on previous files, it seems we are using sessions now, but let's check the type.
        // For now, assuming standard AttendanceRecord type which might have sessions.
        
        return allAttendance.find(a => 
            a.employeeId === user.employeeId && 
            a.sessions?.some(s => !s.checkOutTime) && 
            a.date !== today
        );
    }, [allAttendance, user?.employeeId, today]);
    
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

    if (!user) return null;

    return (
        <>
            <Card title="My Attendance Today">
                <div className="flex flex-col items-center space-y-4">
                    <ClockIcon />
                    <div className="text-center">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-4xl font-mono font-bold text-slate-800">
                                {currentTime.toLocaleTimeString('en-US', { timeZone: userTimezone })}
                            </span>
                            <span className="text-xs text-slate-500 font-mono font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                {userTimezone}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mt-2">
                            {currentTime.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                timeZone: userTimezone
                            })}
                        </p>
                    </div>
                    <div className="text-center text-slate-600 h-10">
                        {loadingToday && <p>Updating...</p>}
                        {!loadingToday && isClockedIn && <p>Clocked In: {new Date(activeSession!.checkInTime).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            timeZone: userTimezone
                        })}</p>}
                        {!loadingToday && !isClockedIn && todayRecord?.sessions?.length && <p>Last Clock Out: {new Date(todayRecord.sessions[todayRecord.sessions.length - 1].checkOutTime!).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            timeZone: userTimezone
                        })}</p>}
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
            {currentUserEmployee && isModalOpen && (
                <ClockActionModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    employee={currentUserEmployee}
                    action={modalAction}
                    todayRecord={todayRecord || undefined}
                    timezone={userTimezone}
                    onSuccess={() => {
                        // toast handled in hook
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
                         // toast handled in hook
                         setIsResolveModalOpen(false);
                    }}
                />
            )}
        </>
    );
};

export default AttendanceWidget;