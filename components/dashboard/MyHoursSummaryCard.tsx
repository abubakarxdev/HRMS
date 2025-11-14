import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { useAppContext } from '../../contexts/AppContext';
import { AttendanceRecord } from '../../types';

const InfoRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline">
        <p className="text-slate-600">{label}</p>
        <p className="font-semibold text-slate-800 text-lg">{value}</p>
    </div>
);

const MyHoursSummaryCard: React.FC = () => {
    const { user, attendance } = useAppContext();
    const [workedHours, setWorkedHours] = useState({ today: '0.00', week: '0.00', month: '0.00' });

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
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const todayRecord = attendance.find(a => a.employeeId === user.employeeId && a.date === todayStr);

            let liveHoursToday = 0;
            if (todayRecord) {
                if (todayRecord.clockIn && todayRecord.clockOut) {
                    liveHoursToday = calculateHours(todayRecord);
                } else if (todayRecord.clockIn) {
                    const currentTimeStr = today.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    liveHoursToday = calculateHours(todayRecord, currentTimeStr);
                }
            }

            const startOfWeek = new Date(today);
            startOfWeek.setHours(0,0,0,0);
            startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            const pastRecords = attendance.filter(r => r.employeeId === user.employeeId && r.clockIn && r.clockOut && r.date !== todayStr);

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

        const todayRecord = attendance.find(a => a.employeeId === user.employeeId && a.date === new Date().toISOString().split('T')[0]);
        const isClockedIn = !!(todayRecord?.clockIn && !todayRecord.clockOut);

        if (isClockedIn) {
            const interval = setInterval(calculateAllHours, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [attendance, user.employeeId]);

    return (
        <Card title="My Hours Summary">
            <div className="space-y-3">
                <InfoRow label="Logged Today" value={`${workedHours.today} hrs`} />
                <InfoRow label="Logged This Week" value={`${workedHours.week} hrs`} />
                <InfoRow label="Logged This Month" value={`${workedHours.month} hrs`} />
            </div>
        </Card>
    );
};

export default MyHoursSummaryCard;