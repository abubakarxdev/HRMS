import React from 'react';
import Card from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendanceStats } from '../../hooks/useAttendance';

const InfoRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline">
        <p className="text-slate-600">{label}</p>
        <p className="font-semibold text-slate-800 text-lg font-mono">{value}</p>
    </div>
);

const formatHoursMinutes = (totalHours: number): string => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
};

const MyHoursSummaryCard: React.FC = () => {
    const { user } = useAuth();
    const { data: stats, isLoading } = useAttendanceStats(user?.employeeId || '');

    if (!user) return null;

    return (
        <Card title="My Hours Summary">
            {isLoading ? (
                <div className="text-center text-slate-500 py-4">Loading...</div>
            ) : (
                <div className="space-y-3">
                    <InfoRow label="Logged Today" value={stats?.hoursToday || "0h 0m"} />
                    <InfoRow label="Logged This Week" value={stats?.hoursThisWeek || "0h 0m"} />
                    <InfoRow label="Logged This Month" value={stats?.hoursThisMonth || "0h 0m"} />
                </div>
            )}
        </Card>
    );
};

export default MyHoursSummaryCard;